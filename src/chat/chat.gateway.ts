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
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);

    if (userId) {
      this.connectedUsers.set(userId, client.id);
      // Update user status to online
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'online' },
      }).catch((err) => this.logger.error('Error updating user status:', err));

      // Notify others about this user coming online
      this.server.emit('user_status', {
        userId,
        status: 'online',
      });
    }
  }

  /** Emit event to a user by userId (for REST-created messages) */
  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) this.server.to(socketId).emit(event, data);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.logger.log(`Client disconnected: ${client.id}, userId: ${userId}`);

    if (userId) {
      this.connectedUsers.delete(userId);
      // Update user status to offline
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'offline' },
      }).catch((err) => this.logger.error('Error updating user status:', err));

      // Notify others about this user going offline
      this.server.emit('user_status', {
        userId,
        status: 'offline',
      });
    }
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

      // Send to receiver if connected
      const receiverSocketId = this.connectedUsers.get(data.to);
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
    },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Group message from ${data.from} to group ${data.groupId}`);

    try {
      // Store message in database
      const savedMessage = await this.prisma.groupMessage.create({
        data: {
          groupId: data.groupId,
          senderId: data.from,
          content: data.message,
          type: (data.type || 'text') as any,
          attachments: data.attachments || [],
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
          const memberSocketId = this.connectedUsers.get(member.userId);
          if (memberSocketId) {
            this.server.to(memberSocketId).emit('new_group_message', {
              id: savedMessage.id,
              groupId: data.groupId,
              from: data.from,
              message: data.message,
              type: data.type || 'text',
              attachments: data.attachments || [],
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
