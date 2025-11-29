import { NextRequest } from 'next/server';
import { BillingController } from '@/app/controllers/billing.controller';
import { handleError } from '@/lib/errors';
import { authenticate } from '@/lib/auth';

/**
 * POST /api/billing/upgrade
 * Create Stripe checkout session for upgrading subscription
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await BillingController.upgrade(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}
