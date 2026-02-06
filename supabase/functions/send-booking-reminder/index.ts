// supabase/functions/send-booking-reminder/index.ts
// Processes pending booking reminders (called by pg_cron every 5 minutes).
// Sends emails via send-email and SMS via send-sms edge functions.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REMINDER_TEMPLATES: Record<string, { subject: string; bodyTemplate: string; smsTemplate: string }> = {
  "24h_before": {
    subject: "Reminder: Your {{event_type_name}} is tomorrow",
    bodyTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Appointment Reminder</h2>
        <p>Hi {{lead_name}},</p>
        <p>This is a friendly reminder that your <strong>{{event_type_name}}</strong> is scheduled for tomorrow.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Date:</strong> {{start_date}}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> {{start_time}}</p>
          <p style="margin: 4px 0;"><strong>Duration:</strong> {{duration}} minutes</p>
          {{#meeting_link}}<p style="margin: 4px 0;"><strong>Meeting Link:</strong> <a href="{{meeting_link}}">Join Meeting</a></p>{{/meeting_link}}
        </div>
        <p>Need to make changes?</p>
        <p>
          <a href="{{reschedule_url}}" style="color: #3B82F6;">Reschedule</a> |
          <a href="{{cancel_url}}" style="color: #EF4444;">Cancel</a>
        </p>
      </div>
    `,
    smsTemplate: "Reminder: Your {{event_type_name}} is tomorrow at {{start_time}}. {{meeting_link}}",
  },
  "1h_before": {
    subject: "Starting Soon: Your {{event_type_name}} begins in 1 hour",
    bodyTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Appointment Starts Soon</h2>
        <p>Hi {{lead_name}},</p>
        <p>Your <strong>{{event_type_name}}</strong> begins in 1 hour.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Time:</strong> {{start_time}}</p>
          {{#meeting_link}}<p style="margin: 4px 0;"><strong>Meeting Link:</strong> <a href="{{meeting_link}}">Join Meeting</a></p>{{/meeting_link}}
        </div>
        {{#meeting_link}}<p><a href="{{meeting_link}}" style="background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Join Meeting</a></p>{{/meeting_link}}
      </div>
    `,
    smsTemplate: "Starting soon: Your {{event_type_name}} begins in 1 hour. {{meeting_link}}",
  },
  "15m_before": {
    subject: "Starting in 15 minutes: {{event_type_name}}",
    bodyTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Starting in 15 Minutes</h2>
        <p>Hi {{lead_name}}, your <strong>{{event_type_name}}</strong> starts in 15 minutes.</p>
        {{#meeting_link}}<p><a href="{{meeting_link}}" style="background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Join Meeting Now</a></p>{{/meeting_link}}
      </div>
    `,
    smsTemplate: "Your {{event_type_name}} starts in 15 min! {{meeting_link}}",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Query pending reminders that are due
    const { data: reminders, error: queryError } = await supabase
      .from("booking_reminders")
      .select(`
        *,
        appointments (
          id, team_id, lead_name, lead_email, lead_phone,
          start_at_utc, duration_minutes, event_type_name,
          meeting_link, reschedule_url, cancel_url,
          appointment_timezone, status
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(50);

    if (queryError) {
      console.error("[send-booking-reminder] Query error:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to query reminders" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending reminders" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const reminder of reminders) {
      const appointment = reminder.appointments;

      // Skip if appointment is cancelled or no appointment data
      if (!appointment || appointment.status === "CANCELLED" || appointment.status === "RESCHEDULED") {
        await supabase
          .from("booking_reminders")
          .update({ status: "cancelled" })
          .eq("id", reminder.id);
        skipped++;
        continue;
      }

      // Get template
      const template = REMINDER_TEMPLATES[reminder.template] || REMINDER_TEMPLATES["1h_before"];

      // Build template variables
      const startDate = new Date(appointment.start_at_utc);
      const tz = appointment.appointment_timezone || "America/New_York";

      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const variables: Record<string, string> = {
        lead_name: appointment.lead_name || "there",
        event_type_name: appointment.event_type_name || "Appointment",
        start_date: dateFormatter.format(startDate),
        start_time: timeFormatter.format(startDate),
        duration: String(appointment.duration_minutes || 30),
        meeting_link: appointment.meeting_link || "",
        reschedule_url: appointment.reschedule_url || "",
        cancel_url: appointment.cancel_url || "",
      };

      // Render template
      const renderTemplate = (tmpl: string): string => {
        let result = tmpl;
        for (const [key, value] of Object.entries(variables)) {
          result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
        }
        // Handle conditional blocks {{#key}}...{{/key}}
        result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, content) => {
          return variables[key] ? content : "";
        });
        return result;
      };

      try {
        if (reminder.type === "email" && appointment.lead_email) {
          // Send email via existing send-email edge function
          await supabase.functions.invoke("send-email", {
            body: {
              to: appointment.lead_email,
              subject: renderTemplate(template.subject),
              html: renderTemplate(template.bodyTemplate),
              team_id: appointment.team_id,
            },
          });

          await supabase
            .from("booking_reminders")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);
          sent++;
        } else if (reminder.type === "sms" && appointment.lead_phone) {
          // Send SMS via existing send-sms edge function
          await supabase.functions.invoke("send-sms", {
            body: {
              to: appointment.lead_phone,
              message: renderTemplate(template.smsTemplate),
              team_id: appointment.team_id,
            },
          });

          await supabase
            .from("booking_reminders")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);
          sent++;
        } else {
          // No valid recipient
          await supabase
            .from("booking_reminders")
            .update({ status: "failed" })
            .eq("id", reminder.id);
          failed++;
        }
      } catch (sendErr) {
        console.error(`[send-booking-reminder] Send error for reminder ${reminder.id}:`, sendErr);
        await supabase
          .from("booking_reminders")
          .update({ status: "failed" })
          .eq("id", reminder.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        processed: reminders.length,
        sent,
        failed,
        skipped,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[send-booking-reminder] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
