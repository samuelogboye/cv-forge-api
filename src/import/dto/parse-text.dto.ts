import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ParseTextDto {
  @ApiProperty({
    example: 'John Doe\nSoftware Engineer\njohn@example.com\n\nExperience:\n- Senior Developer at ABC Corp...',
    description: 'Plain text resume content to parse',
  })
  @IsString()
  @MinLength(50)
  @MaxLength(20000)
  text: string;
}
