import { NextRequest } from 'next/server';
import { BillingController } from '@/app/controllers/billing.controller';
import { handleError } from '@/lib/errors';

/**
 * GET /api/billing/plans
 * Get all available subscription plans
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    return await BillingController.getPlans(request);
  } catch (error) {
    return handleError(error);
  }
}
