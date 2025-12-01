import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OptimizeDto } from './dto/optimize.dto';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey || apiKey === 'sk-placeholder') {
      console.warn('⚠️  OPENAI_API_KEY not configured. AI optimization will not work.');
    }
    this.openai = new OpenAI({
      apiKey: apiKey || 'sk-placeholder',
    });
  }

  async optimizeCV(userId: string, dto: OptimizeDto) {
    // Check if user has a valid subscription or free tier limits
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    // Check AI usage for free tier users
    if (!subscription || subscription.planId === 'free') {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const usageCount = await this.prisma.aIUsage.count({
        where: {
          userId,
          createdAt: {
            gte: currentMonth,
          },
        },
      });

      if (usageCount >= 3) {
        throw new BadRequestException(
          'AI optimization limit reached for free plan. Upgrade to Pro for unlimited optimizations.',
        );
      }
    }

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey || apiKey === 'sk-placeholder') {
      throw new BadRequestException(
        'AI service not configured. Please contact support.',
      );
    }

    try {
      const prompt = `You are a professional resume optimization expert. Your task is to optimize the following resume/CV content to better match the provided job description.

Resume Content:
${dto.content}

Job Description:
${dto.jobDescription}

Instructions:
1. Analyze the job description and identify key skills, qualifications, and requirements
2. Enhance the resume content to highlight relevant experience and skills that match the job description
3. Use action verbs and quantifiable achievements where possible
4. Maintain the original structure and format
5. Keep the optimized content professional and truthful
6. Return ONLY the optimized resume content, without any additional explanations or comments

Optimized Resume:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional resume optimization expert. Provide only the optimized resume content without any additional commentary.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const optimizedContent = response.choices[0]?.message?.content;

      if (!optimizedContent) {
        throw new BadRequestException('Failed to generate optimized content');
      }

      // Track AI usage
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const cost = this.calculateCost(inputTokens, outputTokens);

      await this.prisma.aIUsage.create({
        data: {
          userId,
          operationType: 'optimize',
          inputTokens,
          outputTokens,
          cost,
        },
      });

      return {
        optimizedContent,
        tokensUsed: inputTokens + outputTokens,
      };
    } catch (error) {
      if (error.status === 401) {
        throw new BadRequestException('Invalid OpenAI API key');
      }
      if (error.status === 429) {
        throw new BadRequestException('AI service rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // GPT-4 pricing (as of 2024): $0.03 per 1K input tokens, $0.06 per 1K output tokens
    const inputCost = (inputTokens / 1000) * 0.03;
    const outputCost = (outputTokens / 1000) * 0.06;
    return inputCost + outputCost;
  }
}
