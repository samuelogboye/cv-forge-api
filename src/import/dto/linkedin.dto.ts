import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsString } from 'class-validator';

export class LinkedInDto {
  @ApiProperty({
    example: 'https://www.linkedin.com/in/johndoe',
    description: 'LinkedIn profile URL',
  })
  @IsUrl()
  @IsString()
  linkedinUrl: string;
}
