// supabase/functions/automation-trigger/actions/google-ads-conversion.ts
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

interface GoogleAdsConversionConfig {
  conversion_action: string;   // e.g. "customers/1234567890/conversionActions/9876543210"
  gclid?: string;              // Google Click ID (supports template vars)
  conversion_value?: number;
  currency_code?: string;
  conversion_time?: string;    // ISO 8601, defaults to now
}

// Refresh Google OAuth access token
async function refreshAccessToken(
  supabase: SupabaseClient,
  teamId: string,
  refreshToken: string
): Promise<string | null> {
  if (!refreshToken) return null;

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    console.error("[Google Ads] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return null;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();
    if (!data.access_token) {
      console.error("[Google Ads] Token refresh failed:", data);
      return null;
    }

    // Update stored access token in top-level columns
    await supabase
      .from("team_integrations")
      .update({
        access_token: data.access_token,
        token_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "google_ads");

    return data.access_token;
  } catch (error) {
    console.error("[Google Ads] Error refreshing token:", error);
    return null;
  }
}

export async function executeGoogleAdsConversion(
  config: Record<string, any>,
  context: AutomationContext,
  supabase: SupabaseClient
): Promise<StepExecutionLog> {
  const adsConfig = config as GoogleAdsConversionConfig;

  if (!adsConfig.conversion_action) {
    return {
      status: "error",
      error: "No conversion action specified",
    };
  }

  try {
    // Validate developer token first
    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    if (!developerToken) {
      return {
        status: "error",
        error: "Google Ads developer token not configured. Contact support.",
      };
    }

    // Fetch the team's Google Ads integration
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("access_token, refresh_token, token_expires_at, config")
      .eq("team_id", context.teamId)
      .eq("integration_type", "google_ads")
      .single();

    if (fetchError || !integration) {
      console.error("[Google Ads] No integration found for team:", context.teamId);
      return {
        status: "error",
        error: "Google Ads is not connected. Please connect Google Ads in the Apps section.",
      };
    }

    // Check if we need to refresh the token
    let accessToken = integration.access_token;
    const expiresAt = integration.token_expires_at
      ? new Date(integration.token_expires_at).getTime()
      : 0;

    if (!accessToken || Date.now() > expiresAt - 60000) {
      accessToken = await refreshAccessToken(supabase, context.teamId, integration.refresh_token || "");
      if (!accessToken) {
        return {
          status: "error",
          error: "Failed to refresh Google Ads access token. Please reconnect Google Ads.",
        };
      }
    }

    // Render template variables
    const gclid = adsConfig.gclid
      ? renderTemplate(adsConfig.gclid, context)
      : context.lead?.gclid || null;

    // Extract customer ID from conversion action path
    // Format: "customers/1234567890/conversionActions/9876543210"
    const customerIdMatch = adsConfig.conversion_action.match(/customers\/(\d+)/);
    if (!customerIdMatch) {
      return {
        status: "error",
        error: "Invalid conversion action format. Expected: customers/{customerId}/conversionActions/{actionId}",
      };
    }
    const customerId = customerIdMatch[1];

    const conversionTime = adsConfig.conversion_time || new Date().toISOString();

    // Build the conversion upload request
    const conversionPayload: Record<string, any> = {
      conversionAction: adsConfig.conversion_action,
      conversionDateTime: conversionTime.replace("T", " ").replace("Z", "+00:00"),
    };

    if (gclid) {
      conversionPayload.gclid = gclid;
    }

    if (adsConfig.conversion_value !== undefined) {
      conversionPayload.conversionValue = adsConfig.conversion_value;
      conversionPayload.currencyCode = adsConfig.currency_code || "USD";
    }

    console.log("[Google Ads] Uploading conversion for customer:", customerId);

    // Use Google Ads API v16 to upload the offline conversion
    const response = await fetch(
      `https://googleads.googleapis.com/v16/customers/${customerId}:uploadClickConversions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "developer-token": developerToken,
        },
        body: JSON.stringify({
          conversions: [conversionPayload],
          partialFailure: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[Google Ads] API error:", data);
      return {
        status: "error",
        error: data.error?.message || `Google Ads API call failed [${response.status}]`,
        output: { googleAdsResponse: data },
      };
    }

    // Check for partial failures
    if (data.partialFailureError) {
      console.warn("[Google Ads] Partial failure:", data.partialFailureError);
      return {
        status: "error",
        error: data.partialFailureError.message || "Partial failure uploading conversion",
        output: { partialFailure: data.partialFailureError },
      };
    }

    console.log("[Google Ads] Conversion uploaded successfully");

    return {
      status: "success",
      channel: "google_ads",
      provider: "google_ads",
      output: {
        customer_id: customerId,
        conversion_action: adsConfig.conversion_action,
        gclid: gclid || "none",
        conversion_value: adsConfig.conversion_value,
      },
    };
  } catch (error) {
    console.error("[Google Ads] Error uploading conversion:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error uploading Google Ads conversion",
    };
  }
}
