import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChatsService],
  controllers: [ChatsController],
  exports: [ChatsService],
})
export class ChatsModule {}
