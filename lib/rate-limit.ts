import { NextRequest, NextResponse } from 'next/server';
import { APIError } from '@/lib/errors';

/**
 * Simple in-memory rate limiter
 * For production, use Redis-backed solution like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data in memory (per server instance)
// In production with multiple servers, use Redis instead
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom key function to identify clients (default: userId or IP) */
  keyGenerator?: (request: NextRequest) => string;
}

/**
 * Rate limit middleware
 * Returns true if request should be allowed, throws error if rate limit exceeded
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): Promise<void> {
  const { max, windowMs, keyGenerator } = config;

  // Generate key for this client
  let key: string;
  if (identifier) {
    key = identifier;
  } else if (keyGenerator) {
    key = keyGenerator(request);
  } else {
    // Default: use IP address
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    key = ip;
  }

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // First request or window expired, create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  if (entry.count >= max) {
    // Rate limit exceeded
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    throw APIError.RATE_LIMIT_EXCEEDED(
      `Rate limit exceeded. Try again in ${resetIn} seconds.`
    );
  }

  // Increment counter
  entry.count++;
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  AUTH_LOGIN: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  AUTH_REGISTER: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // AI endpoints - based on subscription tier
  AI_OPTIMIZE_FREE: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 3 per hour for free tier
  },
  AI_OPTIMIZE_PRO: {
    max: -1, // unlimited for pro
    windowMs: 60 * 60 * 1000,
  },

  // Import endpoints
  IMPORT_DOCUMENT: {
    max: 5,
    windowMs: 60 * 60 * 1000, // 5 per hour
  },

  // General API
  GENERAL_API: {
    max: 100,
    windowMs: 15 * 60 * 1000, // 100 per 15 minutes
  },
} as const;

/**
 * Rate limit based on user ID (requires authentication)
 */
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig
): Promise<void> {
  const now = Date.now();
  const key = `user:${userId}`;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return;
  }

  if (entry.count >= config.max) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    throw APIError.RATE_LIMIT_EXCEEDED(
      `Rate limit exceeded. Try again in ${resetIn} seconds.`
    );
  }

  entry.count++;
}

/**
 * Check if user has exceeded rate limit without incrementing
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry || entry.resetTime < now) {
    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: now + config.windowMs,
    };
  }

  const remaining = Math.max(0, config.max - entry.count);

  return {
    allowed: entry.count < config.max,
    remaining,
    resetTime: entry.resetTime,
  };
}
