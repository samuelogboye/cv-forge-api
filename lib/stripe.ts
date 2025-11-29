import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

/**
 * Subscription plan definitions
 * These should match your Stripe product/price configuration
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
      maxCVs: -1, // unlimited
      aiOptimizationsPerMonth: -1, // unlimited
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

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Get plan details by ID
 */
export function getPlanById(planId: string) {
  const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
  if (!plan) {
    throw new Error(`Plan with ID ${planId} not found`);
  }
  return plan;
}

/**
 * Get plan by Stripe price ID
 */
export function getPlanByStripePriceId(stripePriceId: string) {
  const plan = Object.values(SUBSCRIPTION_PLANS).find(
    p => p.stripePriceId === stripePriceId
  );
  if (!plan) {
    throw new Error(`Plan with Stripe price ID ${stripePriceId} not found`);
  }
  return plan;
}

/**
 * Check if user has access to a feature based on their subscription
 */
export function hasFeatureAccess(
  userPlanId: string,
  feature: string
): boolean {
  const plan = getPlanById(userPlanId);
  return plan.features.includes(feature);
}

/**
 * Check if user has reached their CV limit
 */
export function canCreateCV(userPlanId: string, currentCVCount: number): boolean {
  const plan = getPlanById(userPlanId);
  if (plan.limits.maxCVs === -1) return true; // unlimited
  return currentCVCount < plan.limits.maxCVs;
}

/**
 * Check if user can use AI optimization
 */
export function canUseAIOptimization(
  userPlanId: string,
  usageThisMonth: number
): boolean {
  const plan = getPlanById(userPlanId);
  if (plan.limits.aiOptimizationsPerMonth === -1) return true; // unlimited
  return usageThisMonth < plan.limits.aiOptimizationsPerMonth;
}
