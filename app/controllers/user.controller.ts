import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/app/services/user.service';
import { APIError } from '@/lib/errors';
import { parseRequestBody } from '@/lib/request-utils';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(5).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export class UserController {
  /**
   * GET /api/users/settings
   * Get user settings
   */
  static async getSettings(request: NextRequest, userId: string) {
    try {
      const settings = await UserService.getSettings(userId);
      return NextResponse.json({ settings });
    } catch (error) {
      console.error('Get settings error:', error);
      throw APIError.INTERNAL_ERROR('Failed to fetch user settings');
    }
  }

  /**
   * PUT /api/users/settings
   * Update user settings
   */
  static async updateSettings(request: NextRequest, userId: string) {
    try {
      const body = await parseRequestBody(request);
      const validated = updateSettingsSchema.parse(body);

      const settings = await UserService.updateSettings(userId, validated);

      return NextResponse.json({
        message: 'Settings updated successfully',
        settings,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.BAD_REQUEST('Invalid request data', error.errors);
      }

      console.error('Update settings error:', error);
      throw APIError.INTERNAL_ERROR('Failed to update settings');
    }
  }

  /**
   * GET /api/users/profile
   * Get user profile
   */
  static async getProfile(request: NextRequest, userId: string) {
    try {
      const profile = await UserService.getProfile(userId);
      return NextResponse.json({ user: profile });
    } catch (error) {
      console.error('Get profile error:', error);
      throw APIError.INTERNAL_ERROR('Failed to fetch user profile');
    }
  }

  /**
   * PUT /api/users/profile
   * Update user profile
   */
  static async updateProfile(request: NextRequest, userId: string) {
    try {
      const body = await parseRequestBody(request);
      const validated = updateProfileSchema.parse(body);

      const user = await UserService.updateProfile(userId, validated);

      return NextResponse.json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.BAD_REQUEST('Invalid request data', error.errors);
      }

      if (error instanceof Error && error.message === 'Email already in use') {
        throw APIError.CONFLICT('Email already in use');
      }

      console.error('Update profile error:', error);
      throw APIError.INTERNAL_ERROR('Failed to update profile');
    }
  }

  /**
   * PUT /api/users/change-password
   * Change user password
   */
  static async changePassword(request: NextRequest, userId: string) {
    try {
      const body = await parseRequestBody(request);
      const validated = changePasswordSchema.parse(body);

      const result = await UserService.changePassword(
        userId,
        validated.currentPassword,
        validated.newPassword
      );

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.BAD_REQUEST('Invalid request data', error.errors);
      }

      if (error instanceof Error && error.message === 'Current password is incorrect') {
        throw APIError.UNAUTHORIZED('Current password is incorrect');
      }

      console.error('Change password error:', error);
      throw APIError.INTERNAL_ERROR('Failed to change password');
    }
  }

  /**
   * PUT /api/users/preferences
   * Update user preferences
   */
  static async updatePreferences(request: NextRequest, userId: string) {
    try {
      const body = await parseRequestBody(request);
      const validated = updateSettingsSchema.parse(body);

      const preferences = await UserService.updatePreferences(userId, validated);

      return NextResponse.json({
        message: 'Preferences updated successfully',
        preferences,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.BAD_REQUEST('Invalid request data', error.errors);
      }

      console.error('Update preferences error:', error);
      throw APIError.INTERNAL_ERROR('Failed to update preferences');
    }
  }

  /**
   * DELETE /api/users/account
   * Delete user account
   */
  static async deleteAccount(request: NextRequest, userId: string) {
    try {
      const result = await UserService.deleteAccount(userId);

      return NextResponse.json(result);
    } catch (error) {
      console.error('Delete account error:', error);
      throw APIError.INTERNAL_ERROR('Failed to delete account');
    }
  }
}
