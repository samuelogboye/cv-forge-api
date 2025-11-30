import 'dotenv/config';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

/**
 * Subscription plan definitions
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    interval: null,
    stripePriceId: null,
    features: [
      'Up to 3 resumes',
      'Basic templates',
      'PDF export',
      'Limited AI optimization (3 per month)',
    ],
    limits: {
      maxCVs: 3,
      aiOptimizationsPerMonth: 3,
      templatesAccess: 'basic',
    },
  },
  PRO: {
    id: 'pro',
    name: 'Professional',
    price: 9.99,
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    features: [
      'Unlimited resumes',
      'All premium templates',
      'PDF & DOCX export',
      'Unlimited AI optimization',
      'Priority support',
      'Resume import from LinkedIn',
    ],
    limits: {
      maxCVs: -1,
      aiOptimizationsPerMonth: -1,
      templatesAccess: 'all',
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
    features: [
      'Everything in Professional',
      'Team collaboration',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
    ],
    limits: {
      maxCVs: -1,
      aiOptimizationsPerMonth: -1,
      templatesAccess: 'all',
      teamMembers: 10,
    },
  },
} as const;

export function getPlanByStripePriceId(priceId: string) {
  for (const plan of Object.values(SUBSCRIPTION_PLANS)) {
    if (plan.stripePriceId === priceId) {
      return plan;
    }
  }
  return SUBSCRIPTION_PLANS.FREE;
}
