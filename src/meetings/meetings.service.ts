import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgoraService } from '../agora/agora.service';

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private agoraService: AgoraService,
  ) {}

  generateMeetingCode(): string {
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(100 + Math.random() * 900);
    return `${part1}-${part2}`;
  }

  async getMeetings(userId: string) {
    const meetings = await this.prisma.meeting.findMany({
      where: {
        OR: [
          { createdBy: userId },
          {
            participants: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        participants: {
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
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return meetings.map((meeting) => ({
      id: meeting.id,
      code: meeting.code,
      title: meeting.title || 'Untitled Meeting',
      scheduledAt: meeting.scheduledAt,
      isInstant: meeting.isInstant,
      isLive: meeting.participants.length > 0,
      participantCount: meeting._count.participants,
      creator: meeting.creator.name,
      createdAt: meeting.createdAt,
    }));
  }

  async createMeeting(userId: string, data: { title?: string; scheduledAt?: Date; isInstant?: boolean }) {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = this.generateMeetingCode();
      const existing = await this.prisma.meeting.findUnique({
        where: { code },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        code: code!,
        title: data.title,
        scheduledAt: data.scheduledAt,
        isInstant: data.isInstant || false,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    let token: string | null = null;
    let appId: string | null = null;
    try {
      const rtc = this.agoraService.generateRTCToken(meeting.code, 0, undefined, 86400);
      token = rtc.token;
      appId = rtc.appId;
    } catch (_) {}

    return {
      id: meeting.id,
      code: meeting.code,
      title: meeting.title,
      scheduledAt: meeting.scheduledAt,
      isInstant: meeting.isInstant,
      channelName: meeting.code,
      token,
      appId,
    };
  }

  async joinMeeting(userId: string, code: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { code },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        participants: {
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
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const existingParticipant = meeting.participants.find((p) => p.userId === userId);

    if (!existingParticipant) {
      await this.prisma.meetingMember.create({
        data: {
          meetingId: meeting.id,
          userId,
          role: meeting.createdBy === userId ? 'host' : 'participant',
        },
      });
    }

    // Generate Agora RTC token for this meeting (channel = code)
    let token: string | null = null;
    let appId: string | null = null;
    try {
      const rtc = this.agoraService.generateRTCToken(meeting.code, 0, undefined, 86400);
      token = rtc.token;
      appId = rtc.appId;
    } catch (_) {
      // Agora not configured; client can still request token via /agora/generate-rtc-token
    }

    return {
      id: meeting.id,
      code: meeting.code,
      title: meeting.title || 'Untitled Meeting',
      isInstant: meeting.isInstant,
      channelName: meeting.code,
      token,
      appId,
      participants: meeting.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl,
        role: p.role,
      })),
    };
  }
}
