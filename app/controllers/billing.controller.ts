import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/app/services/billing.service';
import { APIError } from '@/lib/errors';
import { parseRequestBody } from '@/lib/request-utils';
import { z } from 'zod';

const upgradeSchema = z.object({
  planId: z.enum(['pro', 'enterprise']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const customerPortalSchema = z.object({
  returnUrl: z.string().url(),
});

export class BillingController {
  /**
   * GET /api/billing/plans
   * Get all available subscription plans
   */
  static async getPlans(request: NextRequest) {
    try {
      const plans = await BillingService.getPlans();

      return NextResponse.json({ plans });
    } catch (error) {
      console.error('Get plans error:', error);
      throw APIError.INTERNAL_ERROR('Failed to fetch subscription plans');
    }
  }

  /**
   * GET /api/billing/subscription
   * Get user's current subscription
   */
  static async getSubscription(request: NextRequest, userId: string) {
    try {
      const subscription = await BillingService.getUserSubscription(userId);

      return NextResponse.json({ subscription });
    } catch (error) {
      console.error('Get subscription error:', error);
      throw APIError.INTERNAL_ERROR('Failed to fetch subscription');
    }
  }

  /**
   * POST /api/billing/upgrade
   * Create Stripe checkout session for upgrading
   */
  static async upgrade(request: NextRequest, userId: string) {
    try {
      const body = await parseRequestBody(request);
      const validated = upgradeSchema.parse(body);

      const session = await BillingService.createCheckoutSession(
        userId,
        validated.planId,
        validated.successUrl,
        validated.cancelUrl
      );

      return NextResponse.json({
        sessionId: session.sessionId,
        url: session.url,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.BAD_REQUEST('Invalid request data', error.errors);
      }

      console.error('Upgrade error:', error);
      throw APIError.INTERNAL_ERROR('Failed to create checkout session');
    }
  }

  /**
   * POST /api/billing/customer-portal
   * Get Stripe customer portal URL
   */
  static async getCustomerPortal(request: NextRequest, userId: string) {
    try {
      const body = await parseRequestBody(request);
      const validated = customerPortalSchema.parse(body);

      const portal = await BillingService.getCustomerPortalUrl(
        userId,
        validated.returnUrl
      );

      return NextResponse.json({
        url: portal.url,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.BAD_REQUEST('Invalid request data', error.errors);
      }

      if (error instanceof Error && error.message === 'No active subscription found') {
        throw APIError.BAD_REQUEST('No active subscription found');
      }

      console.error('Customer portal error:', error);
      throw APIError.INTERNAL_ERROR('Failed to create customer portal session');
    }
  }

  /**
   * POST /api/billing/cancel
   * Cancel subscription at period end
   */
  static async cancelSubscription(request: NextRequest, userId: string) {
    try {
      const result = await BillingService.cancelSubscription(userId);

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'No active subscription found') {
        throw APIError.BAD_REQUEST('No active subscription found');
      }

      console.error('Cancel subscription error:', error);
      throw APIError.INTERNAL_ERROR('Failed to cancel subscription');
    }
  }

  /**
   * POST /api/billing/reactivate
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(request: NextRequest, userId: string) {
    try {
      const result = await BillingService.reactivateSubscription(userId);

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'No subscription found') {
        throw APIError.BAD_REQUEST('No subscription found');
      }

      console.error('Reactivate subscription error:', error);
      throw APIError.INTERNAL_ERROR('Failed to reactivate subscription');
    }
  }
}
