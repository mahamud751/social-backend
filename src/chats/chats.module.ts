import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatGateway } from '../chat/chat.gateway';

@Module({
  imports: [PrismaModule],
  providers: [ChatsService, ChatGateway],
  controllers: [ChatsController],
  exports: [ChatsService],
})
export class ChatsModule {}
