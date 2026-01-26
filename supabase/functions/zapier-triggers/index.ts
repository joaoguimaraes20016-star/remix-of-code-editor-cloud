import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function validateToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = getSupabaseClient();

  const { data: integration, error } = await supabase
    .from("team_integrations")
    .select("team_id, config, token_expires_at")
    .eq("integration_type", "zapier")
    .eq("access_token", token)
    .eq("is_connected", true)
    .single();

  if (error || !integration) {
    return null;
  }

  if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
    return null;
  }

  return integration.team_id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const teamId = await validateToken(authHeader);

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "unauthorized", message: "Invalid or expired access token" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const url = new URL(req.url);
    const triggerType = url.searchParams.get("trigger") || url.pathname.split("/").pop();

    const supabase = getSupabaseClient();

    switch (triggerType) {
      case "new_lead":
      case "new_contact": {
        const { data: contacts, error } = await supabase
          .from("contacts")
          .select("id, name, first_name, last_name, email, phone, company_name, source, tags, created_at")
          .eq("team_id", teamId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching contacts:", error);
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const results = (contacts || []).map(contact => ({
          id: contact.id,
          name: contact.name || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company_name,
          source: contact.source,
          tags: contact.tags,
          created_at: contact.created_at,
        }));

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      case "new_appointment": {
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("id, lead_name, lead_email, lead_phone, start_at_utc, status, event_type_name, closer_name, created_at")
          .eq("team_id", teamId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching appointments:", error);
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const results = (appointments || []).map(apt => ({
          id: apt.id,
          lead_name: apt.lead_name,
          lead_email: apt.lead_email,
          lead_phone: apt.lead_phone,
          start_time: apt.start_at_utc,
          status: apt.status,
          event_type: apt.event_type_name,
          assigned_to: apt.closer_name,
          created_at: apt.created_at,
        }));

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      case "appointment_rescheduled": {
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("id, lead_name, lead_email, lead_phone, start_at_utc, original_booking_date, event_type_name, reschedule_count, updated_at")
          .eq("team_id", teamId)
          .eq("status", "RESCHEDULED")
          .order("updated_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching rescheduled appointments:", error);
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const results = (appointments || []).map(apt => ({
          id: `${apt.id}_${apt.updated_at}`,
          appointment_id: apt.id,
          lead_name: apt.lead_name,
          lead_email: apt.lead_email,
          lead_phone: apt.lead_phone,
          original_date: apt.original_booking_date,
          new_date: apt.start_at_utc,
          event_type: apt.event_type_name,
          reschedule_count: apt.reschedule_count,
          rescheduled_at: apt.updated_at,
        }));

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      case "appointment_canceled":
      case "appointment_cancelled": {
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("id, lead_name, lead_email, lead_phone, start_at_utc, event_type_name, updated_at")
          .eq("team_id", teamId)
          .eq("status", "CANCELLED")
          .order("updated_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching canceled appointments:", error);
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const results = (appointments || []).map(apt => ({
          id: `${apt.id}_${apt.updated_at}`,
          appointment_id: apt.id,
          lead_name: apt.lead_name,
          lead_email: apt.lead_email,
          lead_phone: apt.lead_phone,
          scheduled_time: apt.start_at_utc,
          event_type: apt.event_type_name,
          canceled_at: apt.updated_at,
        }));

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      case "appointment_no_show":
      case "no_show": {
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("id, lead_name, lead_email, lead_phone, start_at_utc, event_type_name, closer_name, updated_at")
          .eq("team_id", teamId)
          .eq("status", "NO_SHOW")
          .order("updated_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching no-show appointments:", error);
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const results = (appointments || []).map(apt => ({
          id: `${apt.id}_${apt.updated_at}`,
          appointment_id: apt.id,
          lead_name: apt.lead_name,
          lead_email: apt.lead_email,
          lead_phone: apt.lead_phone,
          scheduled_time: apt.start_at_utc,
          event_type: apt.event_type_name,
          assigned_to: apt.closer_name,
          marked_no_show_at: apt.updated_at,
        }));

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      case "appointment_completed":
      case "deal_won": {
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("id, lead_name, lead_email, lead_phone, start_at_utc, event_type_name, closer_name, revenue, product_name, updated_at")
          .eq("team_id", teamId)
          .eq("status", "CLOSED")
          .order("updated_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching completed appointments:", error);
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const results = (appointments || []).map(apt => ({
          id: `${apt.id}_${apt.updated_at}`,
          appointment_id: apt.id,
          lead_name: apt.lead_name,
          lead_email: apt.lead_email,
          lead_phone: apt.lead_phone,
          scheduled_time: apt.start_at_utc,
          event_type: apt.event_type_name,
          assigned_to: apt.closer_name,
          revenue: apt.revenue,
          product_name: apt.product_name,
          closed_at: apt.updated_at,
        }));

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      case "stage_changed":
      case "pipeline_stage_changed": {
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("id, lead_name, lead_email, pipeline_stage, previous_status, updated_at")
          .eq("team_id", teamId)
          .not("pipeline_stage", "is", null)
          .order("updated_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching stage changes:", error);
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const results = (appointments || []).map(apt => ({
          id: `${apt.id}_${apt.updated_at}`,
          appointment_id: apt.id,
          lead_name: apt.lead_name,
          lead_email: apt.lead_email,
          current_stage: apt.pipeline_stage,
          previous_status: apt.previous_status,
          changed_at: apt.updated_at,
        }));

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      case "tag_added": {
        const { data: contacts, error } = await supabase
          .from("contacts")
          .select("id, name, email, phone, tags, updated_at")
          .eq("team_id", teamId)
          .not("tags", "is", null)
          .order("updated_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching tagged contacts:", error);
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const results = (contacts || []).filter(c => c.tags && c.tags.length > 0).map(contact => ({
          id: `${contact.id}_${contact.updated_at}`,
          contact_id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          tags: contact.tags,
          updated_at: contact.updated_at,
        }));

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      case "lead_status_changed":
      case "appointment_status_changed": {
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("id, lead_name, lead_email, status, previous_status, updated_at")
          .eq("team_id", teamId)
          .not("previous_status", "is", null)
          .order("updated_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching status changes:", error);
          return new Response(JSON.stringify([]), { headers: corsHeaders });
        }

        const results = (appointments || []).map(apt => ({
          id: `${apt.id}_${apt.updated_at}`,
          appointment_id: apt.id,
          lead_name: apt.lead_name,
          lead_email: apt.lead_email,
          old_status: apt.previous_status,
          new_status: apt.status,
          changed_at: apt.updated_at,
        }));

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      case "sample":
      case "test": {
        return new Response(
          JSON.stringify([
            {
              id: "sample_1",
              name: "John Doe",
              email: "john@example.com",
              phone: "+1234567890",
              created_at: new Date().toISOString(),
            },
          ]),
          { headers: corsHeaders }
        );
      }

      default: {
        return new Response(
          JSON.stringify({
            available_triggers: [
              { key: "new_lead", name: "New Lead/Contact", description: "Triggers when a new lead or contact is created" },
              { key: "new_appointment", name: "New Appointment", description: "Triggers when a new appointment is booked" },
              { key: "appointment_rescheduled", name: "Appointment Rescheduled", description: "Triggers when an appointment is rescheduled" },
              { key: "appointment_canceled", name: "Appointment Canceled", description: "Triggers when an appointment is canceled" },
              { key: "appointment_no_show", name: "Appointment No-Show", description: "Triggers when a lead doesn't show up" },
              { key: "appointment_completed", name: "Appointment Completed/Deal Won", description: "Triggers when a deal is closed" },
              { key: "stage_changed", name: "Pipeline Stage Changed", description: "Triggers when a deal moves to a different stage" },
              { key: "tag_added", name: "Tag Added to Contact", description: "Triggers when a tag is added to a contact" },
              { key: "lead_status_changed", name: "Lead Status Changed", description: "Triggers when a lead's status changes" },
            ],
          }),
          { headers: corsHeaders }
        );
      }
    }
  } catch (error) {
    console.error("Trigger error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", message: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
