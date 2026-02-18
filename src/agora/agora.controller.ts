import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgoraService } from './agora.service';

@Controller('agora')
export class AgoraController {
  constructor(private readonly agoraService: AgoraService) {}

  /**
   * Generate RTC token for video/audio calls (1:1 or group/meeting)
   * POST /agora/generate-rtc-token
   * Body: { channelName: string, uid?: number, expirationTime?: number }
   */
  @Post('generate-rtc-token')
  @UseGuards(AuthGuard('jwt'))
  generateRTCToken(
    @Body('channelName') channelName: string,
    @Body('uid') uid?: number,
    @Body('expirationTime') expirationTime?: number,
  ) {
    try {
      if (!channelName || typeof channelName !== 'string') {
        throw new HttpException(
          'channelName is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      const uidNumber = uid != null ? Number(uid) : 0;
      const expiration = expirationTime != null ? Number(expirationTime) : 86400;
      return this.agoraService.generateRTCToken(
        channelName,
        uidNumber,
        undefined,
        expiration,
      );
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error?.message || 'Failed to generate RTC token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate RTM token for signaling
   * POST /agora/generate-rtm-token
   * Body: { userId: string, expirationTime?: number }
   */
  @Post('generate-rtm-token')
  @UseGuards(AuthGuard('jwt'))
  generateRTMToken(
    @Body('userId') userId: string,
    @Body('expirationTime') expirationTime?: number,
  ) {
    try {
      if (!userId) {
        throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
      }
      const expiration = expirationTime != null ? Number(expirationTime) : 86400;
      return this.agoraService.generateRTMToken(userId, expiration);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error?.message || 'Failed to generate RTM token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate both RTC and RTM tokens
   * POST /agora/generate-tokens
   * Body: { channelName: string, userId: string, uid?: number, expirationTime?: number }
   */
  @Post('generate-tokens')
  @UseGuards(AuthGuard('jwt'))
  generateTokens(
    @Body('channelName') channelName: string,
    @Body('userId') userId: string,
    @Body('uid') uid?: number,
    @Body('expirationTime') expirationTime?: number,
  ) {
    try {
      if (!channelName || !userId) {
        throw new HttpException(
          'channelName and userId are required',
          HttpStatus.BAD_REQUEST,
        );
      }
      const uidNumber = uid != null ? Number(uid) : 0;
      const expiration = expirationTime != null ? Number(expirationTime) : 86400;
      return this.agoraService.generateTokens(
        channelName,
        userId,
        uidNumber,
        expiration,
      );
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error?.message || 'Failed to generate tokens',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
