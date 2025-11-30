import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { CVTemplate } from './create-cv.dto';

export class UpdateCVDto {
  @ApiProperty({
    example: 'Updated Resume Title',
    description: 'CV title',
    minLength: 1,
    maxLength: 200,
    required: false,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Updated CV content...',
    description: 'CV content in text or JSON format',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @IsOptional()
  content?: string;

  @ApiProperty({
    example: 'classic',
    description: 'CV template',
    enum: CVTemplate,
    required: false,
  })
  @IsEnum(CVTemplate)
  @IsOptional()
  template?: CVTemplate;
}
