import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({
    status: 200,
    description: 'User settings retrieved',
    schema: {
      example: {
        emailNotifications: true,
        weeklyDigest: false,
        theme: 'light',
        language: 'en',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSettings(@CurrentUser() user: any) {
    return this.userService.getSettings(user.userId);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({
    status: 200,
    description: 'Settings updated',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSettings(@Body() dto: UpdateSettingsDto, @CurrentUser() user: any) {
    return this.userService.updateSettings(user.userId, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    schema: {
      example: {
        id: 'user-uuid',
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@CurrentUser() user: any) {
    return this.userService.getProfile(user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: any) {
    return this.userService.updateProfile(user.userId, dto);
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({
    status: 200,
    description: 'Password updated',
    schema: {
      example: {
        message: 'Password updated successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized or incorrect current password' })
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: any) {
    return this.userService.changePassword(user.userId, dto);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete user account (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted',
    schema: {
      example: {
        message: 'Account deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@CurrentUser() user: any) {
    return this.userService.deleteAccount(user.userId);
  }
}
