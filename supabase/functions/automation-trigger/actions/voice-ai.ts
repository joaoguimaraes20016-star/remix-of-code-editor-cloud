// supabase/functions/automation-trigger/actions/voice-ai.ts
// ElevenLabs Voice AI integration for automated calls

import type { AutomationContext } from "../types.ts";

interface VoiceAIConfig {
  channel: "voice";
  agentId?: string;
  useElevenLabsAI?: boolean;
  script?: string;
  mode?: "immediate" | "dialer_queue";
}

interface VoiceAIResult {
  status: "success" | "error";
  callId?: string;
  provider?: string;
  error?: string;
}

/**
 * Initiate a voice call using ElevenLabs AI agent or standard Twilio TTS
 */
export async function executeVoiceCall(
  config: VoiceAIConfig,
  context: AutomationContext,
  supabase: any,
  runId: string | null,
  automationId: string,
): Promise<VoiceAIResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  // Get recipient phone number
  const toPhone = context.lead?.phone || context.appointment?.lead_phone;
  if (!toPhone) {
    return { status: "error", error: "No phone number available for voice call" };
  }
  
  try {
    let twiml: string | undefined;
    
    // If using ElevenLabs AI, get conversation token and build streaming TwiML
    if (config.useElevenLabsAI && config.agentId) {
      const tokenResult = await getElevenLabsToken(supabaseUrl, supabaseServiceKey, config.agentId);
      
      if (tokenResult.error) {
        console.warn("[VoiceAI] ElevenLabs token failed, falling back to TTS:", tokenResult.error);
        // Fall back to standard TTS with script
        twiml = buildStandardTwiML(config.script || "Hello, this is an automated call.");
      } else {
        // Build streaming TwiML for ElevenLabs
        twiml = buildElevenLabsStreamTwiML(config.agentId, tokenResult.token!);
      }
    } else {
      // Standard TTS call
      twiml = buildStandardTwiML(config.script || "Hello, this is an automated call.");
    }
    
    // Call the make-call edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/make-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: toPhone,
        teamId: context.teamId,
        automationId,
        runId,
        leadId: context.lead?.id,
        appointmentId: context.appointment?.id,
        twiml,
        mode: config.mode || "immediate",
        script: config.script,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      return {
        status: "error",
        error: result.error || "Voice call failed",
        provider: result.provider,
      };
    }
    
    return {
      status: "success",
      callId: result.callId,
      provider: result.provider,
    };
    
  } catch (err) {
    console.error("[VoiceAI] Error:", err);
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Voice call failed",
    };
  }
}

/**
 * Get ElevenLabs conversation token
 */
async function getElevenLabsToken(
  supabaseUrl: string,
  serviceKey: string,
  agentId: string,
): Promise<{ token?: string; error?: string }> {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/elevenlabs-conversation-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ agentId }),
      },
    );
    
    const data = await response.json();
    
    if (!response.ok || data.error) {
      return { error: data.error || "Failed to get ElevenLabs token" };
    }
    
    return { token: data.token };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Token request failed" };
  }
}

/**
 * Build TwiML for standard Twilio TTS
 */
function buildStandardTwiML(script: string): string {
  // Escape XML special characters
  const escapedScript = script
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  
  return `<Response><Say voice="Polly.Matthew">${escapedScript}</Say></Response>`;
}

/**
 * Build TwiML for ElevenLabs streaming conversation
 * Uses Twilio <Connect> with bidirectional audio streaming
 */
function buildElevenLabsStreamTwiML(agentId: string, token: string): string {
  // Build WebSocket URL for ElevenLabs Conversational AI
  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="token" value="${token}" />
    </Stream>
  </Connect>
</Response>`;
}

/**
 * Build TwiML with gather for interactive voice response
 */
export function buildGatherTwiML(
  prompt: string,
  options: {
    numDigits?: number;
    timeout?: number;
    actionUrl?: string;
  } = {},
): string {
  const escapedPrompt = prompt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  return `<Response>
  <Gather numDigits="${options.numDigits || 1}" timeout="${options.timeout || 5}">
    <Say voice="Polly.Matthew">${escapedPrompt}</Say>
  </Gather>
  <Say>We didn't receive any input. Goodbye!</Say>
</Response>`;
}
