import { NextRequest } from 'next/server';
import { UserController } from '@/app/controllers/user.controller';
import { handleError } from '@/lib/errors';
import { authenticate } from '@/lib/auth';

/**
 * PUT /api/users/change-password
 * Change user password
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await UserController.changePassword(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}
