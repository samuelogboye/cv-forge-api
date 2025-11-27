import OpenAI from 'openai';
import { db } from '@/lib/db';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Optimize CV content for a specific job description using AI
 */
export async function optimizeCVForJob(
  content: string,
  jobDescription: string,
  userId: string
): Promise<{ optimizedContent: string; usage: { inputTokens: number; outputTokens: number; cost: number } }> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: `You are a professional resume optimization expert. Your task is to optimize resumes to match job descriptions while:
- Maintaining truthfulness and accuracy
- Highlighting relevant skills and experiences
- Using industry-specific keywords from the job description
- Improving clarity and impact of bullet points
- Keeping the same structure and format
- Not adding false information or experiences

Return ONLY the optimized CV content, preserving the original structure.`,
        },
        {
          role: 'user',
          content: `Please optimize this CV for the following job description:

JOB DESCRIPTION:
${jobDescription}

CURRENT CV:
${content}

Return the optimized CV content:`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const optimizedContent = response.choices[0]?.message?.content || content;
    const usage = response.usage;

    // Calculate cost (approximate - adjust based on actual pricing)
    // GPT-4o-mini: $0.150 / 1M input tokens, $0.600 / 1M output tokens
    const inputCost = (usage?.prompt_tokens || 0) * 0.00000015;
    const outputCost = (usage?.completion_tokens || 0) * 0.0000006;
    const totalCost = inputCost + outputCost;

    // Track usage in database
    await db.aIUsage.create({
      data: {
        userId,
        operationType: 'optimize',
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        cost: totalCost,
      },
    });

    return {
      optimizedContent,
      usage: {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        cost: totalCost,
      },
    };
  } catch (error) {
    console.error('AI optimization error:', error);
    throw error;
  }
}

/**
 * Extract structured data from resume text using AI
 */
export async function extractResumeData(
  text: string,
  userId: string
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a resume parser. Extract structured information from resumes and return it in JSON format with this structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "summary": "professional summary or objective",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start - End",
      "description": "Job description and achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name",
      "year": "Graduation Year"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"]
}

Return ONLY valid JSON, no markdown formatting or additional text.`,
        },
        {
          role: 'user',
          content: `Extract structured data from this resume:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(content);
    const usage = response.usage;

    // Calculate cost
    const inputCost = (usage?.prompt_tokens || 0) * 0.00000015;
    const outputCost = (usage?.completion_tokens || 0) * 0.0000006;
    const totalCost = inputCost + outputCost;

    // Track usage
    await db.aIUsage.create({
      data: {
        userId,
        operationType: 'parse_text',
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        cost: totalCost,
      },
    });

    return parsedData;
  } catch (error) {
    console.error('AI parsing error:', error);
    throw error;
  }
}

/**
 * Get AI usage statistics for a user
 */
export async function getUserAIUsage(userId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const usage = await db.aIUsage.findMany({
    where: {
      userId,
      createdAt: {
        gte: since,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const totalCost = usage.reduce((sum, record) => sum + Number(record.cost), 0);
  const totalInputTokens = usage.reduce((sum, record) => sum + record.inputTokens, 0);
  const totalOutputTokens = usage.reduce((sum, record) => sum + record.outputTokens, 0);

  return {
    totalRecords: usage.length,
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    records: usage,
  };
}
