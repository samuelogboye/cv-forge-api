import { parseResumeFile, cleanText, parseResumeText } from '@/lib/parser';
import { validateFile, fileToBuffer } from '@/lib/upload';
import { extractResumeData } from '@/lib/ai';
import { Errors } from '@/lib/errors';

/**
 * Import Service
 * Contains business logic for resume import features
 */
export class ImportService {
  /**
   * Parse text resume
   */
  async parseText(userId: string, text: string) {
    const cleanedText = cleanText(text);

    // Try AI-powered extraction first if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') {
      try {
        const parsedData = await extractResumeData(cleanedText, userId);
        return { parsedData };
      } catch (aiError) {
        console.error('AI parsing failed, falling back to regex parser:', aiError);
        // Continue to fallback
      }
    }

    // Fallback to basic regex parser
    const parsedData = parseResumeText(cleanedText);
    return { parsedData };
  }

  /**
   * Parse document (PDF or DOCX)
   */
  async parseDocument(userId: string, file: File) {
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
      throw Errors.BAD_REQUEST(
        'Unable to extract meaningful content from file. File may be empty or corrupted.'
      );
    }

    // Extract structured data using AI if available
    let parsedData;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') {
      try {
        parsedData = await extractResumeData(cleanedText, userId);
      } catch (aiError) {
        console.error('AI parsing failed, falling back to regex parser:', aiError);
        // Fallback to basic regex parser
        parsedData = parseResumeText(cleanedText);
      }
    } else {
      // Use basic regex parser if no AI available
      parsedData = parseResumeText(cleanedText);
    }

    return {
      parsedData,
      extractedText: cleanedText.substring(0, 1000), // Return first 1000 chars for verification
    };
  }
}

// Export singleton instance
export const importService = new ImportService();
