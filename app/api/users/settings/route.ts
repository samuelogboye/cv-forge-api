import { NextRequest } from 'next/server';
import { UserController } from '@/app/controllers/user.controller';
import { handleError } from '@/lib/errors';
import { authenticate } from '@/lib/auth';

/**
 * GET /api/users/settings
 * Get user settings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await UserController.getSettings(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/users/settings
 * Update user settings
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await UserController.updateSettings(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}
