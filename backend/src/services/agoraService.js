import { RtcTokenBuilder, RtcRole } from 'agora-token';

/**
 * Agora Token Service
 * Generates secure Real-Time Tokens (RTC) for Agora video/audio sessions.
 */

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

/**
 * Generate a token for a given channel and user.
 * @param {string} channelName - Usually the Batch ID
 * @param {string|number} uid - User ID (integer for SDK, or 0 for any)
 * @param {string} role - 'publisher' (scholar) or 'subscriber' (student)
 * @returns {string} The generated token
 */
export function generateAgoraToken(channelName, uid = 0, role = 'subscriber') {
    if (!APP_ID || !APP_CERTIFICATE) {
        console.warn("[Agora] AGORA_APP_ID or AGORA_APP_CERTIFICATE not set. RTC tokens will fail.");
        return null;
    }

    // Convert role string to Agora enum
    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Set expiration (1 hour for class sessions)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    console.log(`[Agora] Generating token for channel: ${channelName}, role: ${role}`);

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            agoraRole,
            privilegeExpiredTs
        );
        return token;
    } catch (error) {
        console.error("[Agora] Token generation failed:", error.message);
        return null;
    }
}
