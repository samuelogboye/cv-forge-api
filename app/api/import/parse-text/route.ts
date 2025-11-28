import { NextRequest } from 'next/server';
import { importController } from '@/app/controllers/import.controller';
import { errorResponse } from '@/lib/errors';

/**
 * POST /api/import/parse-text
 * Parse pasted text and extract structured resume data
 */
export async function POST(request: NextRequest) {
  try {
    return await importController.parseText(request);
  } catch (error) {
    return errorResponse(error);
  }
}
