import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { stripe } from '@/lib/stripe';

export class UserService {
  /**
   * Get user settings
   */
  static async getSettings(userId: string) {
    let settings = await db.userSettings.findUnique({
      where: { userId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await db.userSettings.create({
        data: {
          userId,
          emailNotifications: true,
          weeklyDigest: false,
          theme: 'light',
          language: 'en',
        },
      });
    }

    return {
      emailNotifications: settings.emailNotifications,
      weeklyDigest: settings.weeklyDigest,
      theme: settings.theme,
      language: settings.language,
    };
  }

  /**
   * Update user settings
   */
  static async updateSettings(
    userId: string,
    data: {
      emailNotifications?: boolean;
      weeklyDigest?: boolean;
      theme?: string;
      language?: string;
    }
  ) {
    const settings = await db.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        emailNotifications: data.emailNotifications ?? true,
        weeklyDigest: data.weeklyDigest ?? false,
        theme: data.theme ?? 'light',
        language: data.language ?? 'en',
      },
      update: data,
    });

    return {
      emailNotifications: settings.emailNotifications,
      weeklyDigest: settings.weeklyDigest,
      theme: settings.theme,
      language: settings.language,
    };
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
    }
  ) {
    // Check if email is already taken by another user
    if (data.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: data.email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new Error('Email already in use');
      }
    }

    const user = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Get user with password hash
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return {
      message: 'Password updated successfully',
    };
  }

  /**
   * Delete user account (soft delete)
   */
  static async deleteAccount(userId: string) {
    // Use transaction to ensure all related data is handled atomically
    await db.$transaction(async (tx) => {
      // Get subscription if exists
      const subscription = await tx.subscription.findUnique({
        where: { userId },
      });

      // Cancel Stripe subscription if exists
      if (subscription?.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        } catch (error) {
          console.error('Failed to cancel Stripe subscription:', error);
          // Continue with account deletion even if Stripe cancellation fails
        }
      }

      // Soft delete all user's CVs
      await tx.cV.updateMany({
        where: { userId },
        data: { deletedAt: new Date() },
      });

      // Delete subscription record
      if (subscription) {
        await tx.subscription.delete({
          where: { userId },
        });
      }

      // Delete user settings
      await tx.userSettings.deleteMany({
        where: { userId },
      });

      // Soft delete user
      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
    });

    return {
      message: 'Account deleted successfully',
    };
  }

  /**
   * Update user preferences (alias for updateSettings)
   * This provides a separate endpoint for preferences if needed
   */
  static async updatePreferences(
    userId: string,
    data: {
      emailNotifications?: boolean;
      weeklyDigest?: boolean;
      theme?: string;
      language?: string;
    }
  ) {
    return this.updateSettings(userId, data);
  }
}
