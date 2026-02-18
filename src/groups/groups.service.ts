import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async getGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        group: {
          updatedAt: 'desc',
        },
      },
    });

    return memberships.map((membership) => {
      const group = membership.group;
      const lastMessage = group.messages[0];

      return {
        id: group.id,
        name: group.name,
        avatar: group.avatarUrl || null,
        lastMsg: lastMessage
          ? `${lastMessage.sender.name}: ${lastMessage.content}`
          : 'No messages yet',
        time: lastMessage ? lastMessage.createdAt : group.createdAt,
        unread: 0,
        memberCount: group._count.members,
        grid: group._count.members > 1,
        extra: group._count.members > 4 ? group._count.members - 4 : null,
      };
    });
  }

  async createGroup(userId: string, createGroupDto: CreateGroupDto) {
    const { name, description, avatarUrl, memberIds } = createGroupDto;

    const group = await this.prisma.chatGroup.create({
      data: {
        name,
        description,
        avatarUrl,
        createdBy: userId,
        members: {
          create: [
            { userId, role: 'admin' },
            ...memberIds.map((memberId) => ({
              userId: memberId,
              role: 'member',
            })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      createdBy: group.creator.name,
      memberCount: group.members.length,
    };
  }

  async getGroupInfo(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const group = await this.prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      createdBy: group.creator.name,
      memberCount: group._count.members,
      onlineCount: group.members.filter((m) => m.user.status === 'online').length,
      members: group.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        status: m.user.status,
        role: m.role,
        isAdmin: m.role === 'admin',
      })),
    };
  }

  async getGroupMessages(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const group = await this.prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
        messages: {
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
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return {
      group: {
        id: group.id,
        name: group.name,
        memberCount: group.members.length,
        onlineCount: group.members.filter((m) => m.user.status === 'online').length,
      },
      messages: group.messages.map((msg) => ({
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

  async sendGroupMessage(groupId: string, userId: string, content: string, type: string = 'text', attachments: any[] = []) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const message = await this.prisma.groupMessage.create({
      data: {
        groupId,
        senderId: userId,
        content,
        type: type as any,
        attachments,
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
      senderId: message.senderId,
      senderName: message.sender.name,
      senderAvatar: message.sender.avatarUrl,
      createdAt: message.createdAt,
      isSent: true,
    };
  }
}
