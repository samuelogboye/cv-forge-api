import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { errorResponse, Errors, successResponse } from '@/lib/errors';
import { parseTextSchema } from '@/lib/validations';
import { extractResumeData } from '@/lib/ai';
import { parseResumeText, cleanText } from '@/lib/parser';

/**
 * POST /api/import/parse-text
 * Parse pasted text and extract structured resume data
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
    const validated = parseTextSchema.parse(body);

    // Clean the text
    const cleanedText = cleanText(validated.text);

    // Try AI-powered extraction first if API key is available
    let parsedData;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') {
      try {
        parsedData = await extractResumeData(cleanedText, user.userId);
      } catch (aiError) {
        console.error('AI parsing failed, falling back to regex parser:', aiError);
        // Fallback to basic regex parser
        parsedData = parseResumeText(cleanedText);
      }
    } else {
      // Use basic regex parser if no AI available
      parsedData = parseResumeText(cleanedText);
    }

    return successResponse({ parsedData });
  } catch (error) {
    return errorResponse(error);
  }
}
