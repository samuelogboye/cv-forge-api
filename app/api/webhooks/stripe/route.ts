import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { BillingService } from '@/app/services/billing.service';
import Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 *
 * IMPORTANT: This endpoint must receive raw body for signature verification
 * Next.js App Router handles this automatically for webhook routes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log the event for debugging
    console.log(`Received Stripe webhook event: ${event.type}`);

    // Handle the event
    try {
      await BillingService.handleWebhookEvent(event);
    } catch (err) {
      console.error(`Error handling webhook event ${event.type}:`, err);
      // Return 200 to prevent Stripe from retrying
      // But log the error for investigation
      return NextResponse.json(
        { received: true, error: 'Event processing failed' },
        { status: 200 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for this route to get raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
