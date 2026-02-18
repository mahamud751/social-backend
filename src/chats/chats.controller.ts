import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('chats')
@UseGuards(AuthGuard('jwt'))
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async getChatList(@Request() req) {
    return this.chatsService.getChatList(req.user.id);
  }

  @Get(':userId/messages')
  async getMessages(@Request() req, @Param('userId') userId: string) {
    return this.chatsService.getMessages(req.user.id, userId);
  }

  @Post(':userId/messages')
  async sendMessage(
    @Request() req,
    @Param('userId') userId: string,
    @Body() body: { content: string; type?: string; attachments?: any[] },
  ) {
    return this.chatsService.sendMessage(
      req.user.id,
      userId,
      body.content,
      body.type || 'text',
      body.attachments || [],
    );
  }
}
