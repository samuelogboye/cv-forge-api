import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CVService } from './cv.service';
import { CreateCVDto } from './dto/create-cv.dto';
import { UpdateCVDto } from './dto/update-cv.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('cvs')
@Controller('cvs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CVController {
  constructor(private cvService: CVService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CVs for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of CVs retrieved successfully',
    schema: {
      example: {
        cvs: [
          {
            id: 'cv-uuid',
            title: 'Software Engineer Resume',
            template: 'modern',
            content: 'CV content...',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllCVs(@CurrentUser() user: any) {
    return this.cvService.getAllByUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific CV by ID' })
  @ApiParam({ name: 'id', description: 'CV ID' })
  @ApiResponse({
    status: 200,
    description: 'CV retrieved successfully',
    schema: {
      example: {
        cv: {
          id: 'cv-uuid',
          title: 'Software Engineer Resume',
          template: 'modern',
          content: 'CV content...',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your CV' })
  @ApiResponse({ status: 404, description: 'CV not found' })
  async getCVById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cvService.getById(id, user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new CV' })
  @ApiResponse({
    status: 201,
    description: 'CV created successfully',
    schema: {
      example: {
        cv: {
          id: 'cv-uuid',
          title: 'Software Engineer Resume',
          template: 'modern',
          content: 'CV content...',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCV(@Body() dto: CreateCVDto, @CurrentUser() user: any) {
    return this.cvService.create(user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a CV' })
  @ApiParam({ name: 'id', description: 'CV ID' })
  @ApiResponse({
    status: 200,
    description: 'CV updated successfully',
    schema: {
      example: {
        cv: {
          id: 'cv-uuid',
          title: 'Updated Resume Title',
          template: 'classic',
          content: 'Updated CV content...',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your CV' })
  @ApiResponse({ status: 404, description: 'CV not found' })
  async updateCV(
    @Param('id') id: string,
    @Body() dto: UpdateCVDto,
    @CurrentUser() user: any,
  ) {
    return this.cvService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CV (soft delete)' })
  @ApiParam({ name: 'id', description: 'CV ID' })
  @ApiResponse({
    status: 200,
    description: 'CV deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'CV deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your CV' })
  @ApiResponse({ status: 404, description: 'CV not found' })
  async deleteCV(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cvService.delete(id, user.userId);
  }
}
