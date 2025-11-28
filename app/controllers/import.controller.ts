import { NextRequest } from 'next/server';
import { importService } from '@/app/services/import.service';
import { authMiddleware } from '@/app/middleware/auth.middleware';
import { validateBody } from '@/app/middleware/validation.middleware';
import { parseTextSchema } from '@/lib/validations';
import { successResponse, Errors } from '@/lib/errors';

/**
 * Import Controller
 * Handles HTTP requests for import features
 */
export class ImportController {
  /**
   * POST /api/import/parse-text
   * Parse pasted text resume
   */
  async parseText(request: NextRequest) {
    const user = await authMiddleware(request);
    const validated = await validateBody(parseTextSchema)(request);

    const result = await importService.parseText(user.userId, validated.text);
    return successResponse(result);
  }

  /**
   * POST /api/import/parse-document
   * Parse uploaded resume file (PDF or DOCX)
   */
  async parseDocument(request: NextRequest) {
    const user = await authMiddleware(request);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw Errors.BAD_REQUEST('No file provided');
    }

    try {
      const result = await importService.parseDocument(user.userId, file);
      return successResponse(result);
    } catch (error) {
      // Handle file parsing errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to parse')) {
          throw Errors.BAD_REQUEST(
            'Unable to parse document. Please ensure the file is a valid PDF or DOCX.'
          );
        }
      }
      throw error;
    }
  }
}

// Export singleton instance
export const importController = new ImportController();
