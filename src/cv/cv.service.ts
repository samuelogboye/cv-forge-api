import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCVDto } from './dto/create-cv.dto';
import { UpdateCVDto } from './dto/update-cv.dto';

@Injectable()
export class CVService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all CVs for a user
   */
  async getAllByUser(userId: string) {
    const cvs = await this.prisma.cV.findMany({
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

    return { cvs };
  }

  /**
   * Get CV by ID
   */
  async getById(cvId: string, userId: string) {
    const cv = await this.prisma.cV.findFirst({
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
      throw new NotFoundException('CV not found');
    }

    // Verify ownership
    if (cv.userId !== userId) {
      throw new ForbiddenException('You do not have access to this CV');
    }

    // Remove userId from response
    const { userId: _, ...cvData } = cv;
    return { cv: cvData };
  }

  /**
   * Create a new CV
   */
  async create(userId: string, dto: CreateCVDto) {
    const cv = await this.prisma.cV.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        template: dto.template || 'modern',
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

    return { cv };
  }

  /**
   * Update CV
   */
  async update(cvId: string, userId: string, dto: UpdateCVDto) {
    // Check if at least one field is provided
    if (!dto.title && !dto.content && !dto.template) {
      throw new ForbiddenException('At least one field must be provided for update');
    }

    // Check if CV exists and user owns it
    const existingCV = await this.prisma.cV.findFirst({
      where: {
        id: cvId,
        deletedAt: null,
      },
      select: {
        userId: true,
      },
    });

    if (!existingCV) {
      throw new NotFoundException('CV not found');
    }

    if (existingCV.userId !== userId) {
      throw new ForbiddenException('You do not have access to this CV');
    }

    // Update CV
    const cv = await this.prisma.cV.update({
      where: { id: cvId },
      data: dto,
      select: {
        id: true,
        title: true,
        template: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { cv };
  }

  /**
   * Delete CV (soft delete)
   */
  async delete(cvId: string, userId: string) {
    // Check if CV exists and user owns it
    const existingCV = await this.prisma.cV.findFirst({
      where: {
        id: cvId,
        deletedAt: null,
      },
      select: {
        userId: true,
      },
    });

    if (!existingCV) {
      throw new NotFoundException('CV not found');
    }

    if (existingCV.userId !== userId) {
      throw new ForbiddenException('You do not have access to this CV');
    }

    // Soft delete CV
    await this.prisma.cV.update({
      where: { id: cvId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { success: true, message: 'CV deleted successfully' };
  }
}
