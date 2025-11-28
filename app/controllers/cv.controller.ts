import { NextRequest } from 'next/server';
import { cvService } from '@/app/services/cv.service';
import { authMiddleware } from '@/app/middleware/auth.middleware';
import { validateBody } from '@/app/middleware/validation.middleware';
import { createCVSchema, updateCVSchema } from '@/lib/validations';
import { successResponse } from '@/lib/errors';

/**
 * CV Controller
 * Handles HTTP requests for CV management
 */
export class CVController {
  /**
   * GET /api/cvs
   * Get all CVs for authenticated user
   */
  async getAll(request: NextRequest) {
    const user = await authMiddleware(request);
    const cvs = await cvService.getAllByUser(user.userId);
    return successResponse({ cvs });
  }

  /**
   * POST /api/cvs
   * Create new CV
   */
  async create(request: NextRequest) {
    const user = await authMiddleware(request);
    const validated = await validateBody(createCVSchema)(request);
    const cv = await cvService.create(user.userId, validated);
    return successResponse(cv, 201);
  }

  /**
   * GET /api/cvs/[id]
   * Get specific CV by ID
   */
  async getById(request: NextRequest, cvId: string) {
    const user = await authMiddleware(request);
    const cv = await cvService.getById(cvId, user.userId);
    return successResponse(cv);
  }

  /**
   * PUT /api/cvs/[id]
   * Update CV
   */
  async update(request: NextRequest, cvId: string) {
    const user = await authMiddleware(request);
    const validated = await validateBody(updateCVSchema)(request);
    const cv = await cvService.update(cvId, user.userId, validated);
    return successResponse(cv);
  }

  /**
   * DELETE /api/cvs/[id]
   * Delete CV (soft delete)
   */
  async delete(request: NextRequest, cvId: string) {
    const user = await authMiddleware(request);
    await cvService.delete(cvId, user.userId);
    return new Response(null, { status: 204 });
  }
}

// Export singleton instance
export const cvController = new CVController();
