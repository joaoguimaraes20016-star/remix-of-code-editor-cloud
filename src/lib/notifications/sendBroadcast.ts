// src/lib/notifications/sendBroadcast.ts
import { dispatchMessage } from '../messaging/dispatcher';
import type { MessageChannel } from '../messaging/types';

export interface BroadcastRecipient {
  leadId?: string;
  toPhone?: string | null;
  toEmail?: string | null;
}

export interface BroadcastConfig {
  id: string;
  teamId: string;
  channel: MessageChannel; // 'sms' or 'email' for now
  subject?: string;
  text: string;
  html?: string;
}

/**
 * Sends a one-off or saved broadcast to a list of recipients.
 */
export async function sendBroadcastToRecipients(
  config: BroadcastConfig,
  recipients: BroadcastRecipient[],
) {
  for (const rec of recipients) {
    await dispatchMessage({
      teamId: config.teamId,
      channel: config.channel,
      toPhone: rec.toPhone ?? undefined,
      toEmail: rec.toEmail ?? undefined,
      subject: config.subject,
      text: config.text,
      html: config.html,
      metadata: {
        broadcastId: config.id,
        leadId: rec.leadId,
      },
    });
  }
}
