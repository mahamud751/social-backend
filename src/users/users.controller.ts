import { Controller, Get, Put, Body, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('me')
  async updateProfile(@Request() req, @Body() body: { name?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Put('me/status')
  async updateStatus(@Request() req, @Body() body: { status: 'online' | 'away' | 'offline' }) {
    return this.usersService.updateStatus(req.user.id, body.status);
  }

  @Public()
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
