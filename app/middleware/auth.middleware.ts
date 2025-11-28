import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Errors, errorResponse } from '@/lib/errors';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authMiddleware(request: NextRequest) {
  const user = await verifyAuth(request);

  if (!user) {
    throw Errors.UNAUTHORIZED();
  }

  return user;
}

/**
 * Optional authentication middleware
 * Verifies token if present, but doesn't require it
 */
export async function optionalAuthMiddleware(request: NextRequest) {
  const user = await verifyAuth(request);
  return user || null;
}
