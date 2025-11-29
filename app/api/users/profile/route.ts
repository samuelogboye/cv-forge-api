import { NextRequest } from 'next/server';
import { UserController } from '@/app/controllers/user.controller';
import { handleError } from '@/lib/errors';
import { authenticate } from '@/lib/auth';

/**
 * GET /api/users/profile
 * Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await UserController.getProfile(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/users/profile
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await UserController.updateProfile(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}
