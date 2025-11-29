import { NextRequest, NextResponse } from 'next/server';
import { Middleware, RouteContext } from '@/lib/router';
import { verifyAuth } from '@/lib/auth';
import { APIError } from '@/lib/errors';

/**
 * Authentication middleware
 * Verifies JWT token and adds user to context
 */
export const authMiddleware: Middleware = async (
  request: NextRequest,
  context: RouteContext,
  next
) => {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Add user to context for use in handlers
  context.user = user;

  return next();
};

/**
 * Optional authentication middleware
 * Adds user to context if token is present, but doesn't require it
 */
export const optionalAuthMiddleware: Middleware = async (
  request: NextRequest,
  context: RouteContext,
  next
) => {
  const user = await verifyAuth(request);

  if (user) {
    context.user = user;
  }

  return next();
};
