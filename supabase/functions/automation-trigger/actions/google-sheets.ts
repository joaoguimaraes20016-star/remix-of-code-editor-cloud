import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate, enrichContext } from "../template-engine.ts";

interface ColumnMapping {
  column: string;
  value: string;
}

interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  values: ColumnMapping[];
}

interface GoogleIntegration {
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  email?: string;
}

/**
 * Refresh Google OAuth token if expired
 */
async function ensureValidToken(
  supabase: SupabaseClient,
  teamId: string,
  integration: GoogleIntegration
): Promise<{ access_token: string | null; error?: string }> {
  if (!integration.access_token) {
    return { access_token: null, error: "No access token" };
  }

  // Check if token is expired (with 5 minute buffer)
  if (integration.expires_at) {
    const expiresAt = new Date(integration.expires_at);
    const bufferTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    if (expiresAt <= bufferTime && integration.refresh_token) {
      console.log("[Google Sheets] Token expired or expiring soon, refreshing...");
      
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

      if (!clientId || !clientSecret) {
        return { access_token: null, error: "Google OAuth not configured" };
      }

      try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            refresh_token: integration.refresh_token,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error("[Google Sheets] Token refresh failed:", errorText);
          return { access_token: null, error: "Token refresh failed" };
        }

        const tokens = await tokenResponse.json();
        const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Update stored token
        // Preserve enabled_features and other config when updating token
        const updatedConfig = {
          ...integration,
          access_token: tokens.access_token,
          expires_at: newExpiresAt,
          last_refreshed: new Date().toISOString(),
        };

        await supabase
          .from("team_integrations")
          .update({
            config: updatedConfig,
          })
          .eq("team_id", teamId)
          .eq("integration_type", "google");

        console.log("[Google Sheets] Token refreshed successfully");
        return { access_token: tokens.access_token };
      } catch (err) {
        console.error("[Google Sheets] Token refresh error:", err);
        return { access_token: null, error: "Token refresh error" };
      }
    }
  }

  return { access_token: integration.access_token };
}

/**
 * Convert column letter to index (A=0, B=1, ..., Z=25, AA=26, etc.)
 */
function columnToIndex(column: string): number {
  let result = 0;
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 64);
  }
  return result - 1;
}

/**
 * Execute Google Sheets append row action
 */
export async function executeGoogleSheets(
  actionConfig: GoogleSheetsConfig,
  context: AutomationContext,
  supabase: SupabaseClient
): Promise<Partial<StepExecutionLog>> {
  const startTime = Date.now();

  try {
    // Validate actionConfig
    if (!actionConfig.spreadsheetId) {
      return {
        status: "error",
        error: "Spreadsheet ID is required",
        durationMs: Date.now() - startTime,
      };
    }

    if (!actionConfig.values || actionConfig.values.length === 0) {
      return {
        status: "error",
        error: "At least one column value is required",
        durationMs: Date.now() - startTime,
      };
    }

    // Get team's unified Google integration
    const { data: integrationData, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", context.teamId)
      .eq("integration_type", "google")
      .single();

    if (fetchError || !integrationData) {
      return {
        status: "error",
        error: "Google not connected. Please connect Google Sheets in Apps settings.",
        durationMs: Date.now() - startTime,
      };
    }

    // Check if Sheets feature is enabled
    const integrationConfig = integrationData.config as Record<string, any>;
    if (!integrationConfig.enabled_features?.sheets) {
      return {
        status: "error",
        error: "Google Sheets not enabled. Please enable it in Apps settings.",
        durationMs: Date.now() - startTime,
      };
    }

    const integration = integrationData.config as GoogleIntegration;

    // Ensure valid token
    const { access_token, error: tokenError } = await ensureValidToken(
      supabase,
      context.teamId,
      integration
    );

    if (!access_token) {
      return {
        status: "error",
        error: tokenError || "Failed to get valid access token",
        durationMs: Date.now() - startTime,
      };
    }

    // Enrich context for template rendering
    const enrichedContext = enrichContext(context);

    // Render template values and build row data
    // Find the highest column index to know how many cells we need
    let maxColumnIndex = 0;
    const columnData: { index: number; value: string }[] = [];

    for (const mapping of actionConfig.values) {
      if (!mapping.column || !mapping.value) continue;
      
      const columnIndex = columnToIndex(mapping.column.toUpperCase());
      maxColumnIndex = Math.max(maxColumnIndex, columnIndex);
      
      // Render template - use enriched context for template variables
      const renderedValue = renderTemplate(mapping.value, enrichedContext);
      columnData.push({ index: columnIndex, value: renderedValue });
    }

    // Build row array with empty strings for gaps
    const rowData: string[] = new Array(maxColumnIndex + 1).fill("");
    for (const { index, value } of columnData) {
      rowData[index] = value;
    }

    // Build range (e.g., "Sheet1!A:Z")
    const sheetName = actionConfig.sheetName || "Sheet1";
    const lastColumn = String.fromCharCode(65 + maxColumnIndex); // A, B, C...
    const range = `${sheetName}!A:${lastColumn}`;

    console.log(`[Google Sheets] Appending row to ${actionConfig.spreadsheetId}, range: ${range}`);
    console.log(`[Google Sheets] Row data:`, rowData);

    // Call Google Sheets API
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(actionConfig.spreadsheetId)}/values/${encodeURIComponent(range)}:append`;
    
    const response = await fetch(`${apiUrl}?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[Google Sheets] API error:", response.status, errorBody);
      
      // Parse error for better message
      let errorMessage = `Google Sheets API error (${response.status})`;
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Use default error message
      }

      return {
        status: "error",
        error: errorMessage,
        durationMs: Date.now() - startTime,
        output: { 
          statusCode: response.status,
          errorDetails: errorBody,
        },
      };
    }

    const result = await response.json();
    console.log("[Google Sheets] Row appended successfully:", result.updates);

    return {
      status: "success",
      durationMs: Date.now() - startTime,
      output: {
        spreadsheetId: actionConfig.spreadsheetId,
        sheetName,
        updatedRange: result.updates?.updatedRange,
        updatedRows: result.updates?.updatedRows,
        rowData,
      },
    };

  } catch (error) {
    console.error("[Google Sheets] Execution error:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      durationMs: Date.now() - startTime,
    };
  }
}
