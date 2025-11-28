import { NextRequest } from 'next/server';
import { aiController } from '@/app/controllers/ai.controller';
import { errorResponse } from '@/lib/errors';

/**
 * GET /api/ai/usage
 * Get AI usage statistics for authenticated user
 * Query params: days (optional, default 30)
 */
export async function GET(request: NextRequest) {
  try {
    return await aiController.getUsage(request);
  } catch (error) {
    return errorResponse(error);
  }
}
