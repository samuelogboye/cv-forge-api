import { NextRequest } from 'next/server';
import { BillingController } from '@/app/controllers/billing.controller';
import { handleError } from '@/lib/errors';
import { authenticate } from '@/lib/auth';

/**
 * GET /api/billing/subscription
 * Get user's current subscription
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await BillingController.getSubscription(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}
