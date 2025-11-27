import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { errorResponse, Errors, successResponse } from '@/lib/errors';
import { createCVSchema } from '@/lib/validations';

/**
 * GET /api/cvs
 * Get all CVs for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      throw Errors.UNAUTHORIZED();
    }

    // Fetch user's CVs (excluding soft-deleted)
    const cvs = await db.cV.findMany({
      where: {
        userId: user.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        template: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return successResponse({ cvs });
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
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      throw Errors.UNAUTHORIZED();
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = createCVSchema.parse(body);

    // Create CV
    const cv = await db.cV.create({
      data: {
        userId: user.userId,
        title: validated.title,
        content: validated.content,
        template: validated.template,
      },
      select: {
        id: true,
        title: true,
        template: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(cv, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
