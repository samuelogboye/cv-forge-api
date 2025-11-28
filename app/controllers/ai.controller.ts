import { NextRequest } from 'next/server';
import { aiService } from '@/app/services/ai.service';
import { authMiddleware } from '@/app/middleware/auth.middleware';
import { validateBody } from '@/app/middleware/validation.middleware';
import { optimizeSchema } from '@/lib/validations';
import { successResponse, Errors } from '@/lib/errors';

/**
 * AI Controller
 * Handles HTTP requests for AI features
 */
export class AIController {
  /**
   * POST /api/ai/optimize
   * Optimize CV for job description
   */
  async optimize(request: NextRequest) {
    const user = await authMiddleware(request);
    const validated = await validateBody(optimizeSchema)(request);

    try {
      const result = await aiService.optimizeCV(user.userId, validated);
      return successResponse(result);
    } catch (error) {
      // Handle OpenAI specific errors
      if (error && typeof error === 'object' && 'status' in error) {
        const openAIError = error as any;
        if (openAIError.status === 401) {
          throw Errors.INTERNAL_ERROR('Invalid OpenAI API key');
        }
        if (openAIError.status === 429) {
          throw Errors.RATE_LIMIT();
        }
      }
      throw error;
    }
  }

  /**
   * GET /api/ai/usage
   * Get AI usage statistics
   */
  async getUsage(request: NextRequest) {
    const user = await authMiddleware(request);

    // Get days parameter from query string
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const result = await aiService.getUsageStats(user.userId, days);
    return successResponse(result);
  }
}

// Export singleton instance
export const aiController = new AIController();
