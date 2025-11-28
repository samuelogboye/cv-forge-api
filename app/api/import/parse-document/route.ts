import { NextRequest } from 'next/server';
import { importController } from '@/app/controllers/import.controller';
import { errorResponse } from '@/lib/errors';

/**
 * POST /api/import/parse-document
 * Parse uploaded resume file (PDF or DOCX) and extract structured data
 */
export async function POST(request: NextRequest) {
  try {
    return await importController.parseDocument(request);
  } catch (error) {
    return errorResponse(error);
  }
}
