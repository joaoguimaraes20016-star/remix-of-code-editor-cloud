// supabase/functions/fathom-sync/index.ts
// Syncs call summaries from Fathom AI to appointment records.
// Designed to run on a cron schedule or triggered after an appointment ends.
// Fathom does not have public webhooks, so this polls the Fathom API.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

interface FathomCall {
  id: string;
  title: string;
  created_at: string;
  duration_seconds: number;
  attendees: Array<{ email: string; name?: string }>;
  summary?: string;
  action_items?: string[];
  transcript_url?: string;
  recording_url?: string;
}

// Fetch recent calls from Fathom API
async function fetchRecentCalls(
  apiKey: string,
  sinceTimestamp?: string
): Promise<FathomCall[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (sinceTimestamp) {
    params.set("created_after", sinceTimestamp);
  }

  try {
    const response = await fetch(
      `https://api.fathom.ai/external/v1/meetings?${params.toString()}`,
      {
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("[Fathom Sync] API error:", response.status, await response.text());
      return [];
    }

    const data = await response.json();
    return data.meetings || data.data || [];
  } catch (error) {
    console.error("[Fathom Sync] Error fetching calls:", error);
    return [];
  }
}

// Fetch detailed call info including summary and action items
async function fetchCallDetails(
  apiKey: string,
  callId: string
): Promise<Partial<FathomCall> | null> {
  try {
    const response = await fetch(
      `https://api.fathom.ai/external/v1/meetings/${callId}`,
      {
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("[Fathom Sync] Error fetching call details:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Fathom Sync] Error fetching call details:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    // Support both POST (manual trigger / cron) and GET (healthcheck)
    let teamId: string | null = null;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      teamId = body.team_id || null;
    } else {
      const url = new URL(req.url);
      teamId = url.searchParams.get("team_id");
    }

    // If no specific team, process all teams with Fathom connected
    let teamsToProcess: Array<{ team_id: string; config: any; access_token: string | null }> = [];

    if (teamId) {
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("team_id, config, access_token")
        .eq("team_id", teamId)
        .eq("integration_type", "fathom")
        .single();

      if (integration) {
        teamsToProcess = [integration];
      }
    } else {
      // Process all teams with active Fathom connections
      const { data: integrations } = await supabase
        .from("team_integrations")
        .select("team_id, config, access_token")
        .eq("integration_type", "fathom");

      teamsToProcess = integrations || [];
    }

    if (teamsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No Fathom integrations found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalProcessed = 0;
    let totalMatched = 0;

    for (const integration of teamsToProcess) {
      // Fathom uses API keys, not OAuth tokens
      // The API key is stored in the top-level access_token column (from OAuth callback)
      // or optionally in config.api_key or config.access_token
      const apiKey = integration.access_token || integration.config?.api_key || integration.config?.access_token;
      if (!apiKey) {
        console.warn(`[Fathom Sync] No API key for team: ${integration.team_id}`);
        continue;
      }

      // Get the last sync timestamp
      const lastSyncAt = integration.config?.last_sync_at || null;

      // Fetch recent calls
      const calls = await fetchRecentCalls(apiKey, lastSyncAt);
      console.log(`[Fathom Sync] Found ${calls.length} calls for team: ${integration.team_id}`);

      for (const call of calls) {
        totalProcessed++;

        // Try to match call to an appointment by attendee email
        const attendeeEmails = (call.attendees || [])
          .map((a) => a.email)
          .filter(Boolean);

        if (attendeeEmails.length === 0) continue;

        // Look for appointments within a reasonable time window (same day)
        const callDate = new Date(call.created_at);
        const dayStart = new Date(callDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(callDate);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: appointments } = await supabase
          .from("appointments")
          .select("id, lead_email, appointment_notes")
          .eq("team_id", integration.team_id)
          .gte("start_at_utc", dayStart.toISOString())
          .lte("start_at_utc", dayEnd.toISOString())
          .in("lead_email", attendeeEmails);

        if (!appointments || appointments.length === 0) continue;

        // Fetch detailed call info (summary, action items)
        const details = await fetchCallDetails(apiKey, call.id);

        const summary = details?.summary || call.summary || null;
        const actionItems = details?.action_items || call.action_items || [];
        const transcriptUrl = details?.transcript_url || call.transcript_url || null;
        const recordingUrl = details?.recording_url || call.recording_url || null;

        // Update matched appointment(s) with call data
        for (const appointment of appointments) {
          const existingNotes = appointment.appointment_notes || "";
          const fathomSection = [
            "\n\n---\n📋 Fathom Call Summary",
            `Title: ${call.title || "Untitled Call"}`,
            `Duration: ${Math.round((call.duration_seconds || 0) / 60)} minutes`,
            summary ? `\nSummary:\n${summary}` : "",
            actionItems.length > 0
              ? `\nAction Items:\n${actionItems.map((item: string) => `• ${item}`).join("\n")}`
              : "",
            transcriptUrl ? `\nTranscript: ${transcriptUrl}` : "",
            recordingUrl ? `\nRecording: ${recordingUrl}` : "",
          ]
            .filter(Boolean)
            .join("\n");

          // Only update if we haven't already added this call's data
          if (existingNotes.includes(call.id)) continue;

          await supabase
            .from("appointments")
            .update({
              appointment_notes: existingNotes + fathomSection + `\n[fathom_call_id:${call.id}]`,
            })
            .eq("id", appointment.id);

          totalMatched++;

          // Fire automation event
          try {
            await supabase.rpc("fire_automation_event", {
              p_team_id: integration.team_id,
              p_trigger_type: "fathom_summary_received",
              p_event_payload: {
                teamId: integration.team_id,
                appointment: {
                  id: appointment.id,
                  lead_email: appointment.lead_email,
                },
                fathom: {
                  call_id: call.id,
                  title: call.title,
                  summary,
                  action_items: actionItems,
                  transcript_url: transcriptUrl,
                  recording_url: recordingUrl,
                  duration_seconds: call.duration_seconds,
                },
              },
              p_event_id: `fathom:${call.id}:${appointment.id}`,
            });
          } catch (err) {
            console.error("[Fathom Sync] Error firing automation event:", err);
          }
        }
      }

      // Update last sync timestamp
      await supabase
        .from("team_integrations")
        .update({
          config: {
            ...integration.config,
            last_sync_at: new Date().toISOString(),
          },
        })
        .eq("team_id", integration.team_id)
        .eq("integration_type", "fathom");
    }

    console.log(
      `[Fathom Sync] Completed. Processed: ${totalProcessed} calls, Matched: ${totalMatched} appointments`
    );

    return new Response(
      JSON.stringify({
        success: true,
        teams_processed: teamsToProcess.length,
        calls_processed: totalProcessed,
        appointments_matched: totalMatched,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Fathom Sync] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
