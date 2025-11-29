import { stripe, SUBSCRIPTION_PLANS, getPlanByStripePriceId } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

export class BillingService {
  /**
   * Get all available subscription plans
   */
  static async getPlans() {
    return Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
    }));
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string) {
    const subscription = await db.subscription.findUnique({
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
      // User has no subscription, return free plan
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

  /**
   * Create Stripe checkout session for upgrading subscription
   */
  static async createCheckoutSession(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan || !plan.stripePriceId) {
      throw new Error('Invalid plan selected');
    }

    // Check if user already has a subscription
    const existingSubscription = await db.subscription.findUnique({
      where: { userId },
    });

    let customerId = existingSubscription?.stripeCustomerId;

    // Create or retrieve Stripe customer
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

    // Create checkout session
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

  /**
   * Get Stripe customer portal URL for managing subscription
   */
  static async getCustomerPortalUrl(userId: string, returnUrl: string) {
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No active subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhookEvent(event: Stripe.Event) {
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

  /**
   * Handle subscription creation/update
   */
  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
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

    await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        planId: plan.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  /**
   * Handle subscription deletion
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    // Downgrade to free plan
    await db.subscription.update({
      where: { userId },
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: false,
      },
    });
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log(`Payment succeeded for invoice ${invoice.id}`);
    // You can add logic here to send payment confirmation emails, etc.
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    console.log(`Payment failed for invoice ${invoice.id}`);
    // You can add logic here to notify the user about the failed payment
  }

  /**
   * Cancel subscription at period end
   */
  static async cancelSubscription(userId: string) {
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local database
    await db.subscription.update({
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

  /**
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(userId: string) {
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No subscription found');
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update local database
    await db.subscription.update({
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
