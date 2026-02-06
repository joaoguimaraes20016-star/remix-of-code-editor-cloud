// supabase/functions/cancel-booking/index.ts
// Cancels a native booking by booking_token.
// Handles: status update, Google Calendar deletion, automation trigger.
// Note: Reminders are handled via the automation system (GHL-style).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { booking_token } = body;

    if (!booking_token) {
      return new Response(
        JSON.stringify({ error: "booking_token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find appointment by booking token
    const { data: appointment, error: findError } = await supabase
      .from("appointments")
      .select("*")
      .eq("booking_token", booking_token)
      .single();

    if (findError || !appointment) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already cancelled
    if (appointment.status === "CANCELLED") {
      return new Response(
        JSON.stringify({ error: "Booking is already cancelled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Update appointment status
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "CANCELLED",
        previous_status: appointment.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.id);

    if (updateError) {
      console.error("[cancel-booking] Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to cancel booking" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Cancel any scheduled automation jobs for this appointment
    await supabase
      .from("scheduled_automation_jobs")
      .update({ status: "cancelled" })
      .eq("status", "pending")
      .contains("context_snapshot", { appointment: { id: appointment.id } });

    // 4. Delete Zoom meeting if exists
    if (appointment.meeting_link && appointment.meeting_link.includes("zoom.us")) {
      try {
        // Extract meeting ID from Zoom URL if possible
        const zoomUrlMatch = appointment.meeting_link.match(/\/j\/(\d+)/);
        if (zoomUrlMatch) {
          const meetingId = zoomUrlMatch[1];
          const { data: integration } = await supabase
            .from("team_integrations")
            .select("config")
            .eq("team_id", appointment.team_id)
            .eq("integration_type", "zoom")
            .eq("is_connected", true)
            .single();

          if (integration?.config?.access_token) {
            await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${integration.config.access_token}`,
              },
            });
          }
        }
      } catch (zoomErr) {
        console.error("[cancel-booking] Zoom meeting deletion error:", zoomErr);
        // Don't fail cancellation if Zoom deletion fails
      }
    }

    // 5. Delete Google Calendar event if exists
    if (appointment.google_calendar_event_id && appointment.assigned_user_id) {
      try {
        const { data: gcalConn } = await supabase
          .from("google_calendar_connections")
          .select("*")
          .eq("user_id", appointment.assigned_user_id)
          .eq("team_id", appointment.team_id)
          .eq("sync_enabled", true)
          .single();

        if (gcalConn) {
          let accessToken = gcalConn.access_token;

          // Refresh if expired
          if (gcalConn.token_expires_at && new Date(gcalConn.token_expires_at) < new Date()) {
            const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
            const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
            if (clientId && clientSecret && gcalConn.refresh_token) {
              const response = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                  client_id: clientId,
                  client_secret: clientSecret,
                  refresh_token: gcalConn.refresh_token,
                  grant_type: "refresh_token",
                }),
              });
              if (response.ok) {
                const tokens = await response.json();
                accessToken = tokens.access_token;
                await supabase
                  .from("google_calendar_connections")
                  .update({
                    access_token: tokens.access_token,
                    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                  })
                  .eq("id", gcalConn.id);
              }
            }
          }

          const calendarId = gcalConn.calendar_id || "primary";
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${appointment.google_calendar_event_id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
        }
      } catch (gcalErr) {
        console.error("[cancel-booking] Google Calendar delete error:", gcalErr);
      }
    }

    // 6. Fire automation trigger
    try {
      await supabase.functions.invoke("automation-trigger", {
        body: {
          triggerType: "appointment_canceled",
          teamId: appointment.team_id,
          eventPayload: {
            appointment: {
              id: appointment.id,
              start_at_utc: appointment.start_at_utc,
              event_type_name: appointment.event_type_name,
              status: "CANCELLED",
            },
            lead: {
              name: appointment.lead_name,
              email: appointment.lead_email,
              phone: appointment.lead_phone,
            },
          },
        },
      });
    } catch (autoErr) {
      console.error("[cancel-booking] Automation trigger error:", autoErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking cancelled successfully",
        appointment_id: appointment.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[cancel-booking] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
