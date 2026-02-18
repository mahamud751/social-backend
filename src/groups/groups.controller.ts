import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async getGroups(@Request() req) {
    return this.groupsService.getGroups(req.user.id);
  }

  @Post()
  async createGroup(@Request() req, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.createGroup(req.user.id, createGroupDto);
  }

  @Get(':id')
  async getGroupInfo(@Request() req, @Param('id') id: string) {
    return this.groupsService.getGroupInfo(id, req.user.id);
  }

  @Get(':id/messages')
  async getGroupMessages(@Request() req, @Param('id') id: string) {
    return this.groupsService.getGroupMessages(id, req.user.id);
  }

  @Post(':id/messages')
  async sendGroupMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { content: string; type?: string; attachments?: any[]; voiceUrl?: string; duration?: number },
  ) {
    return this.groupsService.sendGroupMessage(
      id,
      req.user.id,
      body.content,
      body.type || 'text',
      body.attachments || [],
      body.voiceUrl,
      body.duration,
    );
  }
}
