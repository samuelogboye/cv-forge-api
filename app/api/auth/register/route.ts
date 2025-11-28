import { NextRequest } from 'next/server';
import { authController } from '@/app/controllers/auth.controller';
import { errorResponse } from '@/lib/errors';

/**
 * POST /api/auth/register
 * Register a new user account
 */
export async function POST(request: NextRequest) {
  try {
    return await authController.register(request);
  } catch (error) {
    return errorResponse(error);
  }
}
