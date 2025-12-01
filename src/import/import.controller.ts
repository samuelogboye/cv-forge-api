import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ParseTextDto } from './dto/parse-text.dto';
import { LinkedInDto } from './dto/linkedin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('import')
@Controller('import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('parse-document')
  @ApiOperation({ summary: 'Parse resume from uploaded PDF or DOCX file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Document parsed successfully',
    schema: {
      example: {
        extractedText: 'Full text extracted from document...',
        parsedData: {
          personalInfo: { name: 'John Doe', email: 'john@example.com' },
          experience: [],
          education: [],
          skills: [],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or parsing failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large' })
  @UseInterceptors(FileInterceptor('file'))
  async parseDocument(@UploadedFile() file: Express.Multer.File) {
    return this.importService.parseDocument(file);
  }

  @Post('parse-text')
  @ApiOperation({ summary: 'Parse resume from plain text' })
  @ApiResponse({
    status: 200,
    description: 'Text parsed successfully',
    schema: {
      example: {
        parsedData: {
          personalInfo: { name: 'John Doe', email: 'john@example.com' },
          experience: [],
          education: [],
          skills: [],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid text or parsing failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async parseText(@Body() dto: ParseTextDto) {
    return this.importService.parseText(dto);
  }

  @Post('linkedin')
  @ApiOperation({ summary: 'Import resume from LinkedIn profile' })
  @ApiResponse({
    status: 200,
    description: 'LinkedIn profile imported successfully',
    schema: {
      example: {
        parsedData: {
          personalInfo: { name: 'John Doe', email: 'john@example.com' },
          experience: [],
          education: [],
          skills: [],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid LinkedIn URL or import failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 501, description: 'LinkedIn import not implemented' })
  async parseLinkedIn(@Body() dto: LinkedInDto) {
    return this.importService.parseLinkedIn(dto);
  }
}
