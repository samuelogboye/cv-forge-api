import { optimizeCVForJob, extractResumeData, getUserAIUsage } from '@/lib/ai';
import { Errors } from '@/lib/errors';
import type { OptimizeInput } from '@/lib/validations';

/**
 * AI Service
 * Contains business logic for AI features
 */
export class AIService {
  /**
   * Optimize CV for job description
   */
  async optimizeCV(userId: string, data: OptimizeInput) {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
      throw Errors.INTERNAL_ERROR(
        'AI service is not configured. Please set OPENAI_API_KEY in environment variables.'
      );
    }

    // Optimize CV using AI
    const result = await optimizeCVForJob(data.content, data.jobDescription, userId);

    return {
      optimizedContent: result.optimizedContent,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        cost: result.usage.cost,
      },
    };
  }

  /**
   * Parse resume text using AI
   */
  async parseResumeText(userId: string, text: string) {
    // Use AI if available, otherwise fallback
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') {
      try {
        return await extractResumeData(text, userId);
      } catch (error) {
        console.error('AI parsing failed:', error);
        // Fallback will be handled in controller
        throw error;
      }
    }

    throw Errors.INTERNAL_ERROR('AI service not available for text parsing');
  }

  /**
   * Get AI usage statistics for user
   */
  async getUsageStats(userId: string, days: number = 30) {
    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      throw Errors.BAD_REQUEST('Invalid days parameter. Must be between 1 and 365.');
    }

    const usage = await getUserAIUsage(userId, days);

    return {
      period: `Last ${days} days`,
      usage: {
        totalOperations: usage.totalRecords,
        totalCost: Number(usage.totalCost.toFixed(6)),
        totalInputTokens: usage.totalInputTokens,
        totalOutputTokens: usage.totalOutputTokens,
        averageCostPerOperation:
          usage.totalRecords > 0 ? Number((usage.totalCost / usage.totalRecords).toFixed(6)) : 0,
      },
      recentOperations: usage.records.slice(0, 10).map((record) => ({
        type: record.operationType,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        cost: Number(record.cost),
        date: record.createdAt.toISOString(),
      })),
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
