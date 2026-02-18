import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('meetings')
@UseGuards(AuthGuard('jwt'))
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  async getMeetings(@Request() req) {
    return this.meetingsService.getMeetings(req.user.id);
  }

  @Post()
  async createMeeting(
    @Request() req,
    @Body() body: { title?: string; scheduledAt?: Date; isInstant?: boolean },
  ) {
    return this.meetingsService.createMeeting(req.user.id, body);
  }

  @Post('join')
  async joinMeeting(@Request() req, @Body() body: { code: string }) {
    return this.meetingsService.joinMeeting(req.user.id, body.code);
  }
}
