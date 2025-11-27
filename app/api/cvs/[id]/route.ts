import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { errorResponse, Errors, successResponse } from '@/lib/errors';
import { updateCVSchema } from '@/lib/validations';

/**
 * GET /api/cvs/[id]
 * Get specific CV by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      throw Errors.UNAUTHORIZED();
    }

    const { id } = await params;

    // Fetch CV
    const cv = await db.cV.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        template: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Check if CV exists and user owns it
    if (!cv) {
      throw Errors.NOT_FOUND('CV');
    }

    if (cv.userId !== user.userId) {
      throw Errors.RESOURCE_NOT_FOUND();
    }

    // Remove userId from response
    const { userId, ...cvData } = cv;

    return successResponse(cvData);
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
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      throw Errors.UNAUTHORIZED();
    }

    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validated = updateCVSchema.parse(body);

    // Check if CV exists and user owns it
    const existingCV = await db.cV.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        userId: true,
      },
    });

    if (!existingCV) {
      throw Errors.NOT_FOUND('CV');
    }

    if (existingCV.userId !== user.userId) {
      throw Errors.RESOURCE_NOT_FOUND();
    }

    // Update CV
    const cv = await db.cV.update({
      where: { id },
      data: validated,
      select: {
        id: true,
        title: true,
        template: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(cv);
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
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      throw Errors.UNAUTHORIZED();
    }

    const { id } = await params;

    // Check if CV exists and user owns it
    const existingCV = await db.cV.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        userId: true,
      },
    });

    if (!existingCV) {
      throw Errors.NOT_FOUND('CV');
    }

    if (existingCV.userId !== user.userId) {
      throw Errors.RESOURCE_NOT_FOUND();
    }

    // Soft delete CV
    await db.cV.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
