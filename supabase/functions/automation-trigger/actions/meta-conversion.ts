// supabase/functions/automation-trigger/actions/meta-conversion.ts
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

interface MetaConversionConfig {
  pixel_id: string;           // Facebook Pixel ID
  event_name: string;         // e.g. "Purchase", "Lead", "CompleteRegistration"
  event_time?: number;        // Unix timestamp (seconds), defaults to now
  event_id?: string;          // Deduplication ID (optional)
  event_source_url?: string;  // Page URL where event occurred
  action_source?: string;      // "website", "email", "app", "phone_call", "chat", "physical_store", "system_generated", "other"
  user_data?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    external_id?: string;      // Hashed user ID
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    contents?: Array<{ id: string; quantity: number; item_price?: number }>;
    num_items?: number;
    order_id?: string;
    predicted_ltv?: number;
  };
}

// Refresh Meta access token if needed
async function refreshAccessToken(
  supabase: SupabaseClient,
  teamId: string,
  currentToken: string
): Promise<string | null> {
  // Meta tokens are long-lived (60 days), but check if expired
  // For now, return current token - refresh logic can be added if needed
  return currentToken;
}

export async function executeMetaConversion(
  config: Record<string, any>,
  context: AutomationContext,
  supabase: SupabaseClient
): Promise<StepExecutionLog> {
  const metaConfig = config as MetaConversionConfig;

  if (!metaConfig.pixel_id) {
    return {
      status: "error",
      error: "No Facebook Pixel ID specified",
    };
  }

  if (!metaConfig.event_name) {
    return {
      status: "error",
      error: "No event name specified",
    };
  }

  try {
    // Fetch the team's Meta integration
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("access_token, config")
      .eq("team_id", context.teamId)
      .eq("integration_type", "meta")
      .single();

    if (fetchError || !integration) {
      console.error("[Meta] No integration found for team:", context.teamId);
      return {
        status: "error",
        error: "Meta is not connected. Please connect Meta/Facebook in the Apps section.",
      };
    }

    const accessToken = integration.access_token;
    if (!accessToken) {
      return {
        status: "error",
        error: "Meta access token not found. Please reconnect Meta.",
      };
    }

    // Check if CAPI is enabled for this integration
    const capiEnabled = integration.config?.enabled_features?.capi || false;
    if (!capiEnabled) {
      console.warn("[Meta] CAPI not enabled for this integration");
      // Continue anyway - user might have enabled it manually
    }

    // Build user data from context and config
    const userData: Record<string, any> = {};
    
    // Use template variables or fallback to context
    if (metaConfig.user_data?.email) {
      userData.em = renderTemplate(metaConfig.user_data.email, context);
    } else if (context.lead?.email) {
      userData.em = context.lead.email;
    }

    if (metaConfig.user_data?.phone) {
      userData.ph = renderTemplate(metaConfig.user_data.phone, context);
    } else if (context.lead?.phone) {
      userData.ph = context.lead.phone;
    }

    if (metaConfig.user_data?.first_name) {
      userData.fn = renderTemplate(metaConfig.user_data.first_name, context);
    } else if (context.lead?.first_name) {
      userData.fn = context.lead.first_name;
    }

    if (metaConfig.user_data?.last_name) {
      userData.ln = renderTemplate(metaConfig.user_data.last_name, context);
    } else if (context.lead?.last_name) {
      userData.ln = context.lead.last_name;
    }

    if (metaConfig.user_data?.external_id) {
      userData.external_id = renderTemplate(metaConfig.user_data.external_id, context);
    } else if (context.lead?.id) {
      userData.external_id = context.lead.id;
    }

    // Build custom data
    const customData: Record<string, any> = {};
    if (metaConfig.custom_data) {
      if (metaConfig.custom_data.value !== undefined) {
        customData.value = metaConfig.custom_data.value;
      }
      if (metaConfig.custom_data.currency) {
        customData.currency = metaConfig.custom_data.currency;
      }
      if (metaConfig.custom_data.content_name) {
        customData.content_name = renderTemplate(metaConfig.custom_data.content_name, context);
      }
      if (metaConfig.custom_data.content_category) {
        customData.content_category = renderTemplate(metaConfig.custom_data.content_category, context);
      }
      if (metaConfig.custom_data.content_ids) {
        customData.content_ids = metaConfig.custom_data.content_ids.map(id => renderTemplate(id, context));
      }
      if (metaConfig.custom_data.contents) {
        customData.contents = metaConfig.custom_data.contents.map(content => ({
          id: renderTemplate(content.id, context),
          quantity: content.quantity,
          item_price: content.item_price,
        }));
      }
      if (metaConfig.custom_data.num_items !== undefined) {
        customData.num_items = metaConfig.custom_data.num_items;
      }
      if (metaConfig.custom_data.order_id) {
        customData.order_id = renderTemplate(metaConfig.custom_data.order_id, context);
      }
      if (metaConfig.custom_data.predicted_ltv !== undefined) {
        customData.predicted_ltv = metaConfig.custom_data.predicted_ltv;
      }
    }

    // Build event payload
    const eventTime = metaConfig.event_time || Math.floor(Date.now() / 1000);
    const eventId = metaConfig.event_id || `${context.automationId}_${Date.now()}`;
    
    const eventPayload: Record<string, any> = {
      event_name: metaConfig.event_name,
      event_time: eventTime,
      event_id: eventId,
      action_source: metaConfig.action_source || "website",
    };

    if (metaConfig.event_source_url) {
      eventPayload.event_source_url = renderTemplate(metaConfig.event_source_url, context);
    }

    if (Object.keys(userData).length > 0) {
      eventPayload.user_data = userData;
    }

    if (Object.keys(customData).length > 0) {
      eventPayload.custom_data = customData;
    }

    console.log("[Meta] Sending conversion event:", metaConfig.event_name, "to pixel:", metaConfig.pixel_id);

    // Call Facebook Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${metaConfig.pixel_id}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          data: [eventPayload],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("[Meta] API error:", data);
      return {
        status: "error",
        error: data.error?.message || `Meta API call failed [${response.status}]`,
        output: { metaResponse: data },
      };
    }

    // Check for events_received
    if (data.events_received && data.events_received > 0) {
      console.log("[Meta] Conversion event sent successfully, events_received:", data.events_received);
      return {
        status: "success",
        channel: "meta",
        provider: "meta",
        output: {
          pixel_id: metaConfig.pixel_id,
          event_name: metaConfig.event_name,
          event_id: eventId,
          events_received: data.events_received,
        },
      };
    } else {
      console.warn("[Meta] Event sent but events_received is 0");
      return {
        status: "error",
        error: "Event sent but not received by Facebook",
        output: { metaResponse: data },
      };
    }
  } catch (error) {
    console.error("[Meta] Error sending conversion:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error sending Meta conversion",
    };
  }
}
