import { NextRequest } from 'next/server';
import { aiController } from '@/app/controllers/ai.controller';
import { errorResponse } from '@/lib/errors';

/**
 * POST /api/ai/optimize
 * Optimize CV content for a specific job description using AI
 */
export async function POST(request: NextRequest) {
  try {
    return await aiController.optimize(request);
  } catch (error) {
    return errorResponse(error);
  }
}
