import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { errorResponse, Errors, successResponse } from '@/lib/errors';
import { getUserAIUsage } from '@/lib/ai';

/**
 * GET /api/ai/usage
 * Get AI usage statistics for authenticated user
 * Query params: days (optional, default 30)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      throw Errors.UNAUTHORIZED();
    }

    // Get days parameter from query string
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      throw Errors.BAD_REQUEST('Invalid days parameter. Must be between 1 and 365.');
    }

    // Get usage statistics
    const usage = await getUserAIUsage(user.userId, days);

    return successResponse({
      period: `Last ${days} days`,
      usage: {
        totalOperations: usage.totalRecords,
        totalCost: Number(usage.totalCost.toFixed(6)),
        totalInputTokens: usage.totalInputTokens,
        totalOutputTokens: usage.totalOutputTokens,
        averageCostPerOperation:
          usage.totalRecords > 0
            ? Number((usage.totalCost / usage.totalRecords).toFixed(6))
            : 0,
      },
      recentOperations: usage.records.slice(0, 10).map(record => ({
        type: record.operationType,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        cost: Number(record.cost),
        date: record.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
