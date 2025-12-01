import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AIService } from './ai.service';
import { OptimizeDto } from './dto/optimize.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('optimize')
  @ApiOperation({ summary: 'Optimize CV content for a job description' })
  @ApiResponse({
    status: 200,
    description: 'CV content optimized successfully',
    schema: {
      example: {
        optimizedContent: 'Optimized resume content here...',
        tokensUsed: 1234,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request or limit reached' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async optimize(@Body() dto: OptimizeDto, @CurrentUser() user: any) {
    return this.aiService.optimizeCV(user.userId, dto);
  }
}
