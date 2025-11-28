import { NextRequest } from 'next/server';
import { authController } from '@/app/controllers/auth.controller';
import { errorResponse } from '@/lib/errors';

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    return await authController.login(request);
  } catch (error) {
    return errorResponse(error);
  }
}
