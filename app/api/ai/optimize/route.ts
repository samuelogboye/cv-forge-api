import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { errorResponse, Errors, successResponse } from '@/lib/errors';
import { optimizeSchema } from '@/lib/validations';
import { optimizeCVForJob } from '@/lib/ai';

/**
 * POST /api/ai/optimize
 * Optimize CV content for a specific job description using AI
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      throw Errors.UNAUTHORIZED();
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = optimizeSchema.parse(body);

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
      throw Errors.INTERNAL_ERROR('AI service is not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    // Optimize CV using AI
    const result = await optimizeCVForJob(
      validated.content,
      validated.jobDescription,
      user.userId
    );

    return successResponse({
      optimizedContent: result.optimizedContent,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        cost: result.usage.cost,
      },
    });
  } catch (error) {
    // Handle OpenAI specific errors
    if (error && typeof error === 'object' && 'status' in error) {
      const openAIError = error as any;
      if (openAIError.status === 401) {
        return errorResponse(Errors.INTERNAL_ERROR('Invalid OpenAI API key'));
      }
      if (openAIError.status === 429) {
        return errorResponse(Errors.RATE_LIMIT());
      }
    }

    return errorResponse(error);
  }
}
