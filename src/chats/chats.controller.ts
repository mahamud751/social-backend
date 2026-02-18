import { Controller, Get, Post, Body, Param, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatsService } from './chats.service';
import { AuthGuard } from '@nestjs/passport';
import { multerOptions } from '../../middleware/multer.config';

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

  @Post('upload-files')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.chatsService.uploadFiles(files);
  }

  @Post(':userId/messages')
  async sendMessage(
    @Request() req,
    @Param('userId') userId: string,
    @Body() body: { content: string; type?: string; attachments?: any[]; voiceUrl?: string; duration?: number },
  ) {
    return this.chatsService.sendMessage(
      req.user.id,
      userId,
      body.content,
      body.type || 'text',
      body.attachments || [],
      body.voiceUrl,
      body.duration,
    );
  }
}
