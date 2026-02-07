// supabase/functions/automation-trigger/actions/voice-actions.ts
// Voice automation actions: send voicemail, make outbound call

import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

type FlexibleConfig = Record<string, unknown>;

/**
 * Send a voicemail drop (ringless voicemail)
 * Uses Twilio to place a call that goes directly to voicemail
 */
export async function executeSendVoicemail(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get recipient phone
    const toPhone = context.lead?.phone || context.appointment?.lead_phone;
    if (!toPhone) {
      log.status = "skipped";
      log.skipReason = "no_phone_number";
      return log;
    }

    const voicemailType = (config.type as string) || "tts";

    let twiml: string;

    if (voicemailType === "audio" && config.audioUrl) {
      // Pre-recorded audio voicemail
      const audioUrl = config.audioUrl as string;
      twiml = `<Response><Play>${escapeXml(audioUrl)}</Play></Response>`;
    } else {
      // Text-to-speech voicemail
      const message = config.message
        ? renderTemplate(config.message as string, context)
        : "Hello, this is an automated message.";
      const voice = (config.voice as string) === "male" ? "Polly.Matthew" : "Polly.Joanna";
      twiml = `<Response><Say voice="${voice}">${escapeXml(message)}</Say></Response>`;
    }

    // Use the make-call function with machine detection set to voicemail
    const response = await fetch(`${supabaseUrl}/functions/v1/make-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: toPhone,
        teamId: context.teamId,
        twiml,
        mode: "voicemail_drop",
        leadId: context.lead?.id,
        appointmentId: context.appointment?.id,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      log.status = "success";
      log.output = {
        callId: result.callId,
        provider: result.provider || "twilio",
        type: voicemailType,
      };
    } else {
      log.status = "error";
      log.error = result.error || "Voicemail delivery failed";
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Make an outbound phone call
 * Delegates to the existing make-call edge function with optional AI or script
 */
export async function executeMakeCall(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get recipient phone
    const toPhone = context.lead?.phone || context.appointment?.lead_phone;
    if (!toPhone) {
      log.status = "skipped";
      log.skipReason = "no_phone_number";
      return log;
    }

    // Build call script
    const script = config.script
      ? renderTemplate(config.script as string, context)
      : "Hello, this is an automated call.";

    const whisperMessage = config.whisperMessage
      ? renderTemplate(config.whisperMessage as string, context)
      : undefined;

    // Build TwiML for the call
    const escapedScript = escapeXml(script);
    let twiml = `<Response><Say voice="Polly.Matthew">${escapedScript}</Say></Response>`;

    // If whisper message is set, add it before connecting
    if (whisperMessage) {
      const escapedWhisper = escapeXml(whisperMessage);
      twiml = `<Response><Say voice="Polly.Matthew">${escapedWhisper}</Say><Pause length="1"/><Say voice="Polly.Matthew">${escapedScript}</Say></Response>`;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/make-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: toPhone,
        teamId: context.teamId,
        twiml,
        mode: "immediate",
        callerId: config.callerId as string || undefined,
        record: config.recordCall as boolean || false,
        leadId: context.lead?.id,
        appointmentId: context.appointment?.id,
        script,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      log.status = "success";
      log.output = {
        callId: result.callId,
        provider: result.provider || "twilio",
      };
    } else {
      log.status = "error";
      log.error = result.error || "Call initiation failed";
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Escape XML special characters for TwiML
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
