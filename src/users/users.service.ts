import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        status: true,
      },
    });
  }

  async updateStatus(userId: string, status: 'online' | 'away' | 'offline') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        status: true,
      },
    });
  }

  async getAllUsers(excludeUserId?: string) {
    const users = await this.prisma.user.findMany({
      where: excludeUserId
        ? {
            id: { not: excludeUserId },
          }
        : {},
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        status: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return users;
  }
}
