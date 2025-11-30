import { Injectable, NotFoundException, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { stripe } from '../config/stripe.config';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
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

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        emailNotifications: dto.emailNotifications ?? true,
        weeklyDigest: dto.weeklyDigest ?? false,
        theme: dto.theme ?? 'light',
        language: dto.language ?? 'en',
      },
      update: dto,
    });

    return {
      emailNotifications: settings.emailNotifications,
      weeklyDigest: settings.weeklyDigest,
      theme: settings.theme,
      language: settings.language,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return {
      message: 'Password updated successfully',
    };
  }

  async deleteAccount(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({
        where: { userId },
      });

      if (subscription?.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        } catch (error) {
          console.error('Failed to cancel Stripe subscription:', error);
        }
      }

      await tx.cV.updateMany({
        where: { userId },
        data: { deletedAt: new Date() },
      });

      if (subscription) {
        await tx.subscription.delete({
          where: { userId },
        });
      }

      await tx.userSettings.deleteMany({
        where: { userId },
      });

      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
    });

    return {
      message: 'Account deleted successfully',
    };
  }
}
