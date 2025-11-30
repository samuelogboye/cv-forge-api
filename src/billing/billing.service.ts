import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { stripe, SUBSCRIPTION_PLANS, getPlanByStripePriceId } from '../config/stripe.config';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
    }));
  }

  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return {
        planId: 'free',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    return {
      planId: subscription.planId,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    };
  }

  async createCheckoutSession(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan || !plan.stripePriceId) {
      throw new BadRequestException('Invalid plan selected');
    }

    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    let customerId = existingSubscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId: plan.id,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async getCustomerPortalUrl(userId: string, returnUrl: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new NotFoundException('No active subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.error('No price ID found in subscription');
      return;
    }

    const plan = getPlanByStripePriceId(priceId);

    const currentPeriodEnd = (subscription as any).current_period_end || (subscription as any).currentPeriodEnd;
    const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end !== undefined
      ? (subscription as any).cancel_at_period_end
      : (subscription as any).cancelAtPeriodEnd;

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        status: subscription.status as any,
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
        cancelAtPeriodEnd,
      },
      update: {
        planId: plan.id,
        status: subscription.status as any,
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
        cancelAtPeriodEnd,
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: false,
      },
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log(`Payment succeeded for invoice ${invoice.id}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    console.log(`Payment failed for invoice ${invoice.id}`);
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new NotFoundException('No active subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return {
      message: 'Subscription will be canceled at the end of the billing period',
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  async reactivateSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new NotFoundException('No subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: false,
      },
    });

    return {
      message: 'Subscription reactivated successfully',
    };
  }
}
