// src/lib/notifications/sendReminder.ts
import { dispatchMessage } from '../messaging/dispatcher';
import type { MessageChannel } from '../messaging/types';

export interface ReminderContext {
  teamId: string;
  leadId?: string;
  appointmentId?: string;
  toPhone?: string | null;
  toEmail?: string | null;
  startsAt?: string; // ISO timestamp
  label?: string; // e.g. 'strategy call'
}

/**
 * Generic reminder sender. You can use this for:
 * - appointment reminders
 * - payment reminders
 * - onboarding reminders, etc.
 */
export async function sendReminder(
  channel: MessageChannel,
  ctx: ReminderContext,
) {
  const text =
    ctx.label && ctx.startsAt
      ? `Reminder: your ${ctx.label} is scheduled at ${ctx.startsAt}.`
      : `Reminder about your upcoming call.`;

  if (channel === 'sms') {
    if (!ctx.toPhone) return;
    await dispatchMessage({
      teamId: ctx.teamId,
      channel: 'sms',
      toPhone: ctx.toPhone,
      text,
      metadata: {
        type: 'reminder',
        leadId: ctx.leadId,
        appointmentId: ctx.appointmentId,
      },
    });
    return;
  }

  if (channel === 'email') {
    if (!ctx.toEmail) return;
    await dispatchMessage({
      teamId: ctx.teamId,
      channel: 'email',
      toEmail: ctx.toEmail,
      subject: 'Reminder for your upcoming call',
      text,
      html: `<p>${text}</p>`,
      metadata: {
        type: 'reminder',
        leadId: ctx.leadId,
        appointmentId: ctx.appointmentId,
      },
    });
    return;
  }

  // voice / in_app can be wired later
  console.info('[sendReminder] unsupported channel for now', channel);
}
