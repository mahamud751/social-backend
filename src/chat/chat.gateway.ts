import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private connectedUsers = new Map<string, string>(); // normalized userId -> socketId (same as Savasaachi for reliable DM UID lookup)

  constructor(private prisma: PrismaService) {}

  /** Normalize user ID so socket lookup always matches (e.g. lowercase). Same as Savasaachi. */
  private normalizeUserId(id: string | undefined): string {
    return String(id ?? '').trim().toLowerCase();
  }

  handleConnection(client: Socket) {
    const rawUserId = client.handshake.query.userId as string;
    const userId = this.normalizeUserId(rawUserId);
    this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);

    if (userId) {
      this.connectedUsers.set(userId, client.id);
      (client as any).data = (client as any).data || {};
      (client as any).data.userId = rawUserId || userId;
      // Update user status to online (Prisma may use raw id; try normalized first)
      this.prisma.user.update({
        where: { id: rawUserId || userId },
        data: { status: 'online' },
      }).catch((err) => this.logger.error('Error updating user status:', err));

      // Notify others about this user coming online
      this.server.emit('user_status', {
        userId: rawUserId || userId,
        status: 'online',
      });
    }
  }

  /** Emit event to a user by userId (lookup normalized so it matches connectedUsers) */
  emitToUser(userId: string, event: string, data: any) {
    const key = this.normalizeUserId(userId);
    const socketId = this.connectedUsers.get(key);
    if (socketId) this.server.to(socketId).emit(event, data);
  }

  handleDisconnect(client: Socket) {
    const rawUserId = client.handshake.query.userId as string;
    const userId = this.normalizeUserId(rawUserId);
    this.logger.log(`Client disconnected: ${client.id}, userId: ${userId}`);

    if (userId) {
      this.connectedUsers.delete(userId);
      // Update user status to offline
      this.prisma.user.update({
        where: { id: rawUserId || userId },
        data: { status: 'offline' },
      }).catch((err) => this.logger.error('Error updating user status:', err));

      // Notify others about this user going offline
      this.server.emit('user_status', {
        userId: rawUserId || userId,
        status: 'offline',
      });
    }
  }

  /** When user A starts a call to user B, notify B (same as Savasaachi call_invite: pass channelName so both join same channel). */
  @SubscribeMessage('start_call')
  async handleStartCall(
    @MessageBody()
    data: {
      to: string;
      callType: 'audio' | 'video';
      from: string;
      channelName?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { to: calleeId, callType, from: callerId, channelName } = data;
    if (!calleeId || !callerId) return;

    try {
      const caller = await this.prisma.user.findUnique({
        where: { id: callerId },
        select: { id: true, name: true, avatarUrl: true },
      });
      const callerName = caller?.name ?? 'Unknown';
      const avatar = caller?.avatarUrl ?? null;

      const payload: Record<string, unknown> = {
        callerId,
        callerName,
        avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}&background=EF5F21&color=fff&size=150`,
        callType: callType || 'audio',
      };
      if (channelName && typeof channelName === 'string') {
        payload.channelName = channelName.trim();
        this.logger.log(`[start_call] ChannelName provided: ${payload.channelName}`);
      } else {
        this.logger.warn(`[start_call] No channelName provided by caller ${callerId}`);
      }
      this.emitToUser(calleeId, 'incoming_call', payload);
      this.logger.log(
        `Incoming call emitted to ${calleeId} from ${callerId} (${callType})${payload.channelName ? ` channel: ${payload.channelName}` : ' (NO CHANNEL)'}`,
      );
    } catch (err) {
      this.logger.error('Error in start_call:', err);
    }
  }

  /**
   * When a user starts a group call from GroupChatScreen, notify all other group members
   * so they see an incoming call with caller identity and can join the same meeting.
   */
  @SubscribeMessage('start_group_call')
  async handleStartGroupCall(
    @MessageBody()
    data: {
      from: string;
      groupId: string;
      callType: 'audio' | 'video';
      meeting: {
        code: string;
        title: string;
        channelName: string;
        token: string;
        appId: string;
      };
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { from: callerId, groupId, callType, meeting } = data;
    if (!callerId || !groupId || !meeting?.channelName) return;

    try {
      const [caller, group, groupMembers] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: callerId },
          select: { id: true, name: true, avatarUrl: true },
        }),
        this.prisma.chatGroup.findUnique({
          where: { id: groupId },
          select: { id: true, name: true, avatarUrl: true },
        }),
        this.prisma.groupMember.findMany({
          where: { groupId },
          select: { userId: true },
        }),
      ]);

      const callerName = caller?.name ?? 'Unknown';
      const avatar =
        caller?.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}&background=EF5F21&color=fff&size=150`;
      const groupName = group?.name ?? 'Group';
      const groupAvatar = group?.avatarUrl ?? null;

      const payload = {
        callerId,
        callerName,
        avatar,
        callType: callType || 'video',
        isGroupCall: true,
        groupId,
        groupName,
        groupAvatar:
          groupAvatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=EF5F21&color=fff&size=150`,
        code: meeting.code,
        title: meeting.title,
        channelName: meeting.channelName,
        token: meeting.token,
        appId: meeting.appId,
      };

      let emitted = 0;
      for (const member of groupMembers) {
        if (member.userId === callerId) continue;
        this.emitToUser(member.userId, 'incoming_call', payload);
        emitted++;
      }
      this.logger.log(
        `Group call from ${callerId} in group ${groupId}: incoming_call emitted to ${emitted} members`,
      );
    } catch (err) {
      this.logger.error('Error in start_group_call:', err);
    }
  }

  /**
   * 1:1 call: one peer sends their Agora UID so the other can show remote video (fallback when onUserJoined doesn't fire).
   * Same pattern as Savasaachi dm_agora_uid / dm_peer_agora_uid.
   */
  /** 1:1 call: forward Agora UID to peer so they can show remote video. Lookup by normalized userId (same as Savasaachi). */
  @SubscribeMessage('call_agora_uid')
  handleCallAgoraUid(
    @MessageBody()
    data: {
      channelName: string;
      agoraUid: number;
      targetUserId: string;
    },
  ) {
    if (!data?.targetUserId || data.agoraUid == null) return;
    const targetKey = this.normalizeUserId(data.targetUserId);
    const socketId = this.connectedUsers.get(targetKey);
    if (socketId) {
      this.server.to(socketId).emit('call_peer_agora_uid', {
        channelName:
          typeof data.channelName === 'string'
            ? data.channelName.trim()
            : data.channelName,
        agoraUid: Number(data.agoraUid),
      });
      this.logger.log(
        `call_peer_agora_uid forwarded to ${targetKey}, uid=${data.agoraUid}`,
      );
    }
  }

  /** Savasaachi 1:1: same as call_agora_uid; emit dm_peer_agora_uid so Savasaachi app receives the event it listens for. */
  @SubscribeMessage('dm_agora_uid')
  handleDmAgoraUid(
    @MessageBody()
    data: {
      channelName: string;
      agoraUid: number;
      myUserId?: string;
      targetUserId: string;
    },
  ) {
    if (!data?.targetUserId || data.agoraUid == null) return;
    const targetKey = this.normalizeUserId(data.targetUserId);
    const socketId = this.connectedUsers.get(targetKey);
    if (socketId) {
      const payload = {
        channelName:
          typeof data.channelName === 'string'
            ? data.channelName.trim()
            : data.channelName,
        agoraUid: Number(data.agoraUid),
      };
      this.server.to(socketId).emit('dm_peer_agora_uid', payload);
      this.logger.log(
        `dm_peer_agora_uid forwarded to ${targetKey}, uid=${data.agoraUid}`,
      );
    }
  }

  /** When callee B accepts, notify caller A so A's screen switches from "Calling..." to "Connected" */
  @SubscribeMessage('call_accepted')
  handleCallAccepted(
    @MessageBody() data: { to: string },
    @ConnectedSocket() client: Socket,
  ) {
    const callerId = data?.to;
    const calleeId = (client as any).data?.userId;
    if (!callerId || !calleeId) return;
    this.emitToUser(callerId, 'call_accepted', { from: calleeId });
    this.logger.log(`Call accepted: ${calleeId} -> notify caller ${callerId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: {
      to: string;
      message: string;
      from: string;
      timestamp: number;
      attachments?: string[];
      type?: string;
      voiceUrl?: string;
      duration?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Message from ${data.from} to ${data.to}: ${data.message}`);

    try {
      // Store message in database
      const savedMessage = await this.prisma.message.create({
        data: {
          senderId: data.from,
          receiverId: data.to,
          content: data.message,
          type: (data.type || 'text') as any,
          attachments: data.attachments || [],
          voiceUrl: data.voiceUrl || null,
          duration: data.duration ?? null,
          createdAt: new Date(data.timestamp),
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

      // Send to receiver if connected (normalized lookup)
      const receiverSocketId = this.connectedUsers.get(this.normalizeUserId(data.to));
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('new_message', {
          id: savedMessage.id,
          from: data.from,
          to: data.to,
          message: data.message,
          type: data.type || 'text',
          attachments: data.attachments || [],
          voiceUrl: data.voiceUrl ?? null,
          duration: data.duration ?? null,
          timestamp: data.timestamp,
          sender: savedMessage.sender,
        });
      }

      // Confirm to sender
      client.emit('message_sent', {
        id: savedMessage.id,
        timestamp: data.timestamp,
      });
    } catch (error) {
      this.logger.error('Error handling message:', error);
      client.emit('message_error', { error: 'Failed to send message' });
    }
  }

  @SubscribeMessage('send_group_message')
  async handleGroupMessage(
    @MessageBody()
    data: {
      groupId: string;
      message: string;
      from: string;
      timestamp: number;
      attachments?: string[];
      type?: string;
      voiceUrl?: string;
      duration?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Group message from ${data.from} to group ${data.groupId}`);

    try {
      const savedMessage = await this.prisma.groupMessage.create({
        data: {
          groupId: data.groupId,
          senderId: data.from,
          content: data.message,
          type: (data.type || 'text') as any,
          attachments: data.attachments || [],
          voiceUrl: data.voiceUrl || null,
          duration: data.duration ?? null,
          createdAt: new Date(data.timestamp),
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

      // Get all group members
      const groupMembers = await this.prisma.groupMember.findMany({
        where: { groupId: data.groupId },
        select: { userId: true },
      });

      // Send to all group members
      groupMembers.forEach((member) => {
        if (member.userId !== data.from) {
          const memberSocketId = this.connectedUsers.get(this.normalizeUserId(member.userId));
          if (memberSocketId) {
            this.server.to(memberSocketId).emit('new_group_message', {
              id: savedMessage.id,
              groupId: data.groupId,
              from: data.from,
              message: data.message,
              type: data.type || 'text',
              attachments: data.attachments || [],
              voiceUrl: data.voiceUrl ?? null,
              duration: data.duration ?? null,
              timestamp: data.timestamp,
              sender: savedMessage.sender,
            });
          }
        }
      });

      // Confirm to sender
      client.emit('group_message_sent', {
        id: savedMessage.id,
        timestamp: data.timestamp,
      });
    } catch (error) {
      this.logger.error('Error handling group message:', error);
      client.emit('message_error', { error: 'Failed to send group message' });
    }
  }
}
