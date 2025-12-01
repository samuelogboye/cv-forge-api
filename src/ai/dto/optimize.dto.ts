import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class OptimizeDto {
  @ApiProperty({
    example: 'My resume content here...',
    description: 'The CV content to optimize',
  })
  @IsString()
  @MinLength(50)
  @MaxLength(10000)
  content: string;

  @ApiProperty({
    example: 'Senior Software Engineer position requiring 5+ years of experience in React, Node.js, and TypeScript...',
    description: 'The job description to optimize for',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  jobDescription: string;
}
