import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async getChatList(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            status: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const chatMap = new Map();

    messages.forEach((msg) => {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!chatMap.has(partnerId)) {
        chatMap.set(partnerId, {
          id: partnerId,
          name: partner.name,
          avatar: partner.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=E2E8F0&color=1A202C&size=128`,
          lastMessage: msg.content,
          time: msg.createdAt,
          unreadCount: 0,
          isOnline: partner.status === 'online',
        });
      }
    });

    return Array.from(chatMap.values());
  }

  async getMessages(userId: string, partnerId: string) {
    const partner = await this.prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, avatarUrl: true, status: true },
    });

    if (!partner) {
      throw new NotFoundException('User not found');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      partner: {
        id: partner.id,
        name: partner.name,
        avatar: partner.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=E2E8F0&color=1A202C&size=128`,
        status: partner.status === 'online' ? 'Online' : 'Offline',
      },
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        type: msg.type,
        attachments: msg.attachments,
        senderId: msg.senderId,
        senderName: msg.sender.name,
        senderAvatar: msg.sender.avatarUrl,
        createdAt: msg.createdAt,
        isSent: msg.senderId === userId,
      })),
    };
  }

  async uploadFiles(files: Express.Multer.File[]) {
    const uploadedFiles = files.map((file) => ({
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    return { files: uploadedFiles };
  }

  async sendMessage(
    userId: string,
    receiverId: string,
    content: string,
    type: string = 'text',
    attachments: any[] = [],
    voiceUrl?: string,
    duration?: number,
  ) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const message = await this.prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        content,
        type: type as any,
        attachments,
        voiceUrl: voiceUrl || null,
        duration: duration || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: message.id,
      content: message.content,
      type: message.type,
      attachments: message.attachments,
      voiceUrl: message.voiceUrl,
      duration: message.duration,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderAvatar: message.sender.avatarUrl,
      createdAt: message.createdAt,
      isSent: true,
    };
  }
}
