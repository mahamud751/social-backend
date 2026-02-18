import { Injectable } from '@nestjs/common';
import {
  RtcTokenBuilder,
  RtmTokenBuilder,
  RtcRole,
  RtmRole,
} from 'agora-access-token';


@Injectable()
export class AgoraService {
  private readonly appId =
    process.env.AGORA_APP_ID || 'YOUR_AGORA_APP_ID';
  private readonly appCertificate =
    process.env.AGORA_APP_CERTIFICATE || 'YOUR_AGORA_APP_CERTIFICATE';

  /**
   * Generate RTC Token for video/audio calls (1:1 or group)
   * @param channelName - Agora channel (e.g. call-{id1}-{id2} or meeting code)
   * @param uid - Numeric UID (0 = server assigns)
   * @param expirationTimeInSeconds - Token TTL (default 24h)
   */
  generateRTCToken(
    channelName: string,
    uid: number = 0,
    role: number = RtcRole.PUBLISHER,
    expirationTimeInSeconds: number = 86400,
  ): { token: string; appId: string } {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
    );

    return {
      token,
      appId: this.appId,
    };
  }

  /**
   * Generate RTM Token for real-time messaging (e.g. signaling)
   * @param userId - String user id
   * @param expirationTimeInSeconds - Token TTL (default 24h)
   */
  generateRTMToken(
    userId: string,
    expirationTimeInSeconds: number = 86400,
  ): { token: string; appId: string } {
    if (
      !this.appId ||
      !this.appCertificate ||
      this.appId === 'YOUR_AGORA_APP_ID' ||
      this.appCertificate === 'YOUR_AGORA_APP_CERTIFICATE'
    ) {
      throw new Error(
        'Agora credentials not set. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env',
      );
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtmTokenBuilder.buildToken(
      this.appId,
      this.appCertificate,
      userId,
      RtmRole.Rtm_User,
      privilegeExpiredTs,
    );

    return {
      token,
      appId: this.appId,
    };
  }

  /**
   * Generate both RTC and RTM tokens (for full call + signaling)
   */
  generateTokens(
    channelName: string,
    userId: string,
    uid: number = 0,
    expirationTimeInSeconds: number = 86400,
  ): {
    rtcToken: { token: string; appId: string };
    rtmToken: { token: string; appId: string };
  } {
    const rtcToken = this.generateRTCToken(
      channelName,
      uid,
      RtcRole.PUBLISHER,
      expirationTimeInSeconds,
    );
    const rtmToken = this.generateRTMToken(userId, expirationTimeInSeconds);
    return {
      rtcToken,
      rtmToken,
    };
  }
}
