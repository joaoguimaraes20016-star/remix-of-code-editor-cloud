// supabase/functions/automation-trigger/actions/tiktok-event.ts
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

interface TikTokEventConfig {
  event_type: string;      // e.g. "CompletePayment", "SubmitForm", "Contact"
  pixel_code: string;      // TikTok pixel ID
  event_id?: string;       // Dedup event ID (optional, auto-generated if missing)
  properties?: Record<string, any>;
}

// TikTok standard event types
const TIKTOK_EVENTS = [
  "CompletePayment",
  "SubmitForm",
  "Contact",
  "Subscribe",
  "CompleteRegistration",
  "PlaceAnOrder",
  "AddToCart",
  "ViewContent",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Download",
  "Search",
  "ClickButton",
] as const;

export async function executeTikTokEvent(
  config: Record<string, any>,
  context: AutomationContext,
  supabase: SupabaseClient
): Promise<StepExecutionLog> {
  const tiktokConfig = config as TikTokEventConfig;

  if (!tiktokConfig.event_type) {
    return {
      status: "error",
      error: "No event type specified",
    };
  }

  if (!tiktokConfig.pixel_code) {
    return {
      status: "error",
      error: "No pixel code specified",
    };
  }

  try {
    // Fetch the team's TikTok integration
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("access_token, config")
      .eq("team_id", context.teamId)
      .eq("integration_type", "tiktok")
      .single();

    if (fetchError || !integration) {
      console.error("[TikTok] No integration found for team:", context.teamId);
      return {
        status: "error",
        error: "TikTok is not connected. Please connect TikTok in the Apps section.",
      };
    }

    const accessToken = integration.access_token;
    if (!accessToken) {
      return {
        status: "error",
        error: "TikTok access token not found. Please reconnect TikTok.",
      };
    }

    // Build event data
    const eventId = tiktokConfig.event_id || `${context.automationId}_${Date.now()}`;

    const eventPayload: Record<string, any> = {
      pixel_code: tiktokConfig.pixel_code,
      event: tiktokConfig.event_type,
      event_id: eventId,
      timestamp: new Date().toISOString(),
    };

    // Add user data if available from context
    const userData: Record<string, any> = {};
    if (context.lead?.email) {
      userData.email = context.lead.email;
    }
    if (context.lead?.phone) {
      userData.phone = context.lead.phone;
    }
    if (Object.keys(userData).length > 0) {
      eventPayload.user = userData;
    }

    // Add custom properties
    if (tiktokConfig.properties) {
      const renderedProps: Record<string, any> = {};
      for (const [key, value] of Object.entries(tiktokConfig.properties)) {
        renderedProps[key] = typeof value === "string"
          ? renderTemplate(value, context)
          : value;
      }
      eventPayload.properties = renderedProps;
    }

    console.log("[TikTok] Sending event:", tiktokConfig.event_type, "pixel:", tiktokConfig.pixel_code);

    // Call TikTok Events API
    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batch: [eventPayload],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.code !== 0) {
      console.error("[TikTok] API error:", data);
      return {
        status: "error",
        error: data.message || `TikTok API call failed [${response.status}]`,
        output: { tiktokResponse: data },
      };
    }

    console.log("[TikTok] Event sent successfully");

    return {
      status: "success",
      channel: "tiktok",
      provider: "tiktok",
      output: {
        event_type: tiktokConfig.event_type,
        pixel_code: tiktokConfig.pixel_code,
        event_id: eventId,
      },
    };
  } catch (error) {
    console.error("[TikTok] Error sending event:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error sending TikTok event",
    };
  }
}
