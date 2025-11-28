import { db } from '@/lib/db';
import { Errors } from '@/lib/errors';
import type { CreateCVInput, UpdateCVInput } from '@/lib/validations';

/**
 * CV Service
 * Contains business logic for CV management
 */
export class CVService {
  /**
   * Get all CVs for a user
   */
  async getAllByUser(userId: string) {
    const cvs = await db.cV.findMany({
      where: {
        userId,
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

    return cvs;
  }

  /**
   * Get CV by ID
   */
  async getById(cvId: string, userId: string) {
    const cv = await db.cV.findFirst({
      where: {
        id: cvId,
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

    if (!cv) {
      throw Errors.NOT_FOUND('CV');
    }

    // Verify ownership
    if (cv.userId !== userId) {
      throw Errors.RESOURCE_NOT_FOUND();
    }

    // Remove userId from response
    const { userId: _, ...cvData } = cv;
    return cvData;
  }

  /**
   * Create a new CV
   */
  async create(userId: string, data: CreateCVInput) {
    const cv = await db.cV.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        template: data.template,
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

    return cv;
  }

  /**
   * Update CV
   */
  async update(cvId: string, userId: string, data: UpdateCVInput) {
    // Check if CV exists and user owns it
    const existingCV = await db.cV.findFirst({
      where: {
        id: cvId,
        deletedAt: null,
      },
      select: {
        userId: true,
      },
    });

    if (!existingCV) {
      throw Errors.NOT_FOUND('CV');
    }

    if (existingCV.userId !== userId) {
      throw Errors.RESOURCE_NOT_FOUND();
    }

    // Update CV
    const cv = await db.cV.update({
      where: { id: cvId },
      data,
      select: {
        id: true,
        title: true,
        template: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return cv;
  }

  /**
   * Delete CV (soft delete)
   */
  async delete(cvId: string, userId: string) {
    // Check if CV exists and user owns it
    const existingCV = await db.cV.findFirst({
      where: {
        id: cvId,
        deletedAt: null,
      },
      select: {
        userId: true,
      },
    });

    if (!existingCV) {
      throw Errors.NOT_FOUND('CV');
    }

    if (existingCV.userId !== userId) {
      throw Errors.RESOURCE_NOT_FOUND();
    }

    // Soft delete CV
    await db.cV.update({
      where: { id: cvId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { success: true };
  }
}

// Export singleton instance
export const cvService = new CVService();
