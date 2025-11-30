import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';

export enum CVTemplate {
  MODERN = 'modern',
  CLASSIC = 'classic',
  MINIMAL = 'minimal',
  PROFESSIONAL = 'professional',
}

export class CreateCVDto {
  @ApiProperty({
    example: 'Software Engineer Resume',
    description: 'CV title',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(200, { message: 'Title too long' })
  title: string;

  @ApiProperty({
    example: 'John Doe\nSoftware Engineer\n\nExperience:\n- 5 years at Tech Corp...',
    description: 'CV content in text or JSON format',
  })
  @IsString()
  @MinLength(1, { message: 'Content is required' })
  content: string;

  @ApiProperty({
    example: 'modern',
    description: 'CV template',
    enum: CVTemplate,
    default: CVTemplate.MODERN,
  })
  @IsEnum(CVTemplate)
  @IsOptional()
  template?: CVTemplate;
}
