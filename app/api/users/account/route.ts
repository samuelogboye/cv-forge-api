import { NextRequest } from 'next/server';
import { UserController } from '@/app/controllers/user.controller';
import { handleError } from '@/lib/errors';
import { authenticate } from '@/lib/auth';

/**
 * DELETE /api/users/account
 * Delete user account (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticate(request);
    return await UserController.deleteAccount(request, user.userId);
  } catch (error) {
    return handleError(error);
  }
}
