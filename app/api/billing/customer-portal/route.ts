import { NextRequest } from 'next/server';
import { BillingController } from '@/app/controllers/billing.controller';
import { handleError } from '@/lib/errors';
import { authenticate } from '@/lib/auth';

/**
 * POST /api/billing/customer-portal
 * Get Stripe customer portal URL for managing subscription
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await BillingController.getCustomerPortal(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}
