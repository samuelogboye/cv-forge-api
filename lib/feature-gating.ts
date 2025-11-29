import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canCreateCV, canUseAIOptimization } from '@/lib/stripe';
import { APIError } from '@/lib/errors';

/**
 * Feature gating middleware
 * Checks if user has access to specific features based on their subscription plan
 */

/**
 * Check if user can create a new CV based on their plan limits
 */
export async function checkCVCreationLimit(userId: string): Promise<void> {
  // Get user's subscription
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  const planId = subscription?.planId || 'free';

  // Count user's current CVs (excluding soft-deleted)
  const cvCount = await db.cV.count({
    where: {
      userId,
      deletedAt: null,
    },
  });

  // Check if user can create more CVs
  if (!canCreateCV(planId, cvCount)) {
    throw APIError.FORBIDDEN(
      'CV limit reached. Please upgrade your plan to create more resumes.',
      'CV_LIMIT_REACHED'
    );
  }
}

/**
 * Check if user can use AI optimization based on their plan limits
 */
export async function checkAIOptimizationLimit(userId: string): Promise<void> {
  // Get user's subscription
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  const planId = subscription?.planId || 'free';

  // Get current month's AI usage count
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageCount = await db.aIUsage.count({
    where: {
      userId,
      operationType: 'optimize',
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  // Check if user can use AI optimization
  if (!canUseAIOptimization(planId, usageCount)) {
    throw APIError.FORBIDDEN(
      'AI optimization limit reached. Please upgrade to Professional plan for unlimited access.',
      'AI_LIMIT_REACHED'
    );
  }
}

/**
 * Check if user has access to premium templates
 */
export async function checkPremiumTemplateAccess(userId: string, templateId: string): Promise<void> {
  // Define which templates are premium
  const premiumTemplates = ['executive', 'creative', 'tech-lead', 'designer'];

  if (!premiumTemplates.includes(templateId)) {
    // Not a premium template, access granted
    return;
  }

  // Get user's subscription
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  const planId = subscription?.planId || 'free';

  // Free plan users cannot access premium templates
  if (planId === 'free') {
    throw APIError.FORBIDDEN(
      'This template requires a Professional or Enterprise plan.',
      'PREMIUM_TEMPLATE_REQUIRED'
    );
  }
}

/**
 * Check if user has access to team features (Enterprise only)
 */
export async function checkTeamFeatureAccess(userId: string): Promise<void> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  const planId = subscription?.planId || 'free';

  if (planId !== 'enterprise') {
    throw APIError.FORBIDDEN(
      'Team features are only available on Enterprise plan.',
      'ENTERPRISE_REQUIRED'
    );
  }
}

/**
 * Get user's plan information including limits and usage
 */
export async function getUserPlanInfo(userId: string) {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  const planId = subscription?.planId || 'free';

  // Get CV count
  const cvCount = await db.cV.count({
    where: {
      userId,
      deletedAt: null,
    },
  });

  // Get current month's AI usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const aiUsageCount = await db.aIUsage.count({
    where: {
      userId,
      operationType: 'optimize',
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  return {
    planId,
    cvCount,
    aiUsageCount,
    subscription: subscription ? {
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    } : null,
  };
}
