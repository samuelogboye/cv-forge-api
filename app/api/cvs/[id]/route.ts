import { NextRequest } from 'next/server';
import { cvController } from '@/app/controllers/cv.controller';
import { errorResponse } from '@/lib/errors';

/**
 * GET /api/cvs/[id]
 * Get specific CV by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await cvController.getById(request, id);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PUT /api/cvs/[id]
 * Update existing CV
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await cvController.update(request, id);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/cvs/[id]
 * Soft delete CV
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await cvController.delete(request, id);
  } catch (error) {
    return errorResponse(error);
  }
}
