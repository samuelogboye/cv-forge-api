import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUrl } from 'class-validator';

export class UpgradeDto {
  @ApiProperty({
    example: 'pro',
    description: 'Plan ID to upgrade to',
    enum: ['free', 'pro', 'enterprise'],
  })
  @IsEnum(['free', 'pro', 'enterprise'])
  planId: string;

  @ApiProperty({
    example: 'http://localhost:3000/dashboard?success=true',
    description: 'URL to redirect to after successful payment',
  })
  @IsUrl()
  @IsString()
  successUrl: string;

  @ApiProperty({
    example: 'http://localhost:3000/billing?canceled=true',
    description: 'URL to redirect to if payment is canceled',
  })
  @IsUrl()
  @IsString()
  cancelUrl: string;
}

export class CustomerPortalDto {
  @ApiProperty({
    example: 'http://localhost:3000/billing',
    description: 'URL to return to after managing subscription',
  })
  @IsUrl()
  @IsString()
  returnUrl: string;
}
