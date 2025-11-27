import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { errorResponse, Errors, successResponse } from '@/lib/errors';
import { validateFile, fileToBuffer } from '@/lib/upload';
import { parseResumeFile, cleanText, parseResumeText } from '@/lib/parser';
import { extractResumeData } from '@/lib/ai';

/**
 * POST /api/import/parse-document
 * Parse uploaded resume file (PDF or DOCX) and extract structured data
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      throw Errors.UNAUTHORIZED();
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw Errors.BAD_REQUEST('No file provided');
    }

    // Validate file
    const validation = validateFile({
      size: file.size,
      type: file.type,
      name: file.name,
    });

    if (!validation.valid) {
      throw Errors.BAD_REQUEST(validation.error || 'Invalid file');
    }

    // Convert file to buffer
    const buffer = await fileToBuffer(file);

    // Parse file based on type
    const extractedText = await parseResumeFile(buffer, file.type);
    const cleanedText = cleanText(extractedText);

    if (!cleanedText || cleanedText.length < 50) {
      throw Errors.BAD_REQUEST('Unable to extract meaningful content from file. File may be empty or corrupted.');
    }

    // Extract structured data using AI if available
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

    return successResponse({
      parsedData,
      extractedText: cleanedText.substring(0, 1000), // Return first 1000 chars for verification
    });
  } catch (error) {
    // Handle file parsing errors
    if (error instanceof Error) {
      if (error.message.includes('Failed to parse')) {
        return errorResponse(
          Errors.BAD_REQUEST('Unable to parse document. Please ensure the file is a valid PDF or DOCX.')
        );
      }
    }

    return errorResponse(error);
  }
}
