import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UpgradeDto, CustomerPortalDto } from './dto/upgrade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { stripe } from '../config/stripe.config';
import { Request } from 'express';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'List of subscription plans',
  })
  async getPlans() {
    return this.billingService.getPlans();
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({
    status: 200,
    description: 'User subscription details',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSubscription(@CurrentUser() user: any) {
    return this.billingService.getUserSubscription(user.userId);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create checkout session to upgrade subscription' })
  @ApiResponse({
    status: 200,
    description: 'Checkout session created',
    schema: {
      example: {
        sessionId: 'cs_test_...',
        url: 'https://checkout.stripe.com/...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upgrade(@Body() dto: UpgradeDto, @CurrentUser() user: any) {
    return this.billingService.createCheckoutSession(
      user.userId,
      dto.planId,
      dto.successUrl,
      dto.cancelUrl
    );
  }

  @Post('customer-portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Stripe customer portal URL' })
  @ApiResponse({
    status: 200,
    description: 'Customer portal URL',
    schema: {
      example: {
        url: 'https://billing.stripe.com/session/...',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCustomerPortal(@Body() dto: CustomerPortalDto, @CurrentUser() user: any) {
    return this.billingService.getCustomerPortalUrl(user.userId, dto.returnUrl);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled',
  })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelSubscription(@CurrentUser() user: any) {
    return this.billingService.cancelSubscription(user.userId);
  }

  @Post('reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate canceled subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription reactivated',
  })
  @ApiResponse({ status: 404, description: 'No subscription found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async reactivateSubscription(@CurrentUser() user: any) {
    return this.billingService.reactivateSubscription(user.userId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed',
  })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    const rawBody = request.rawBody;

    if (!rawBody || !signature) {
      throw new Error('Missing raw body or signature');
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    await this.billingService.handleWebhookEvent(event);

    return { received: true };
  }
}
