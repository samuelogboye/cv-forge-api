import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    example: true,
    description: 'Enable email notifications',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiProperty({
    example: false,
    description: 'Enable weekly digest emails',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  weeklyDigest?: boolean;

  @ApiProperty({
    example: 'light',
    description: 'UI theme preference',
    enum: ['light', 'dark'],
    required: false,
  })
  @IsEnum(['light', 'dark'])
  @IsOptional()
  theme?: string;

  @ApiProperty({
    example: 'en',
    description: 'Preferred language',
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: string;
}
