import { NextRequest } from 'next/server';
import { cvController } from '@/app/controllers/cv.controller';
import { errorResponse } from '@/lib/errors';

/**
 * GET /api/cvs
 * Get all CVs for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    return await cvController.getAll(request);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/cvs
 * Create new CV
 */
export async function POST(request: NextRequest) {
  try {
    return await cvController.create(request);
  } catch (error) {
    return errorResponse(error);
  }
}
