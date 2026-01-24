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

  // Check token expiry
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
    const actionType = url.searchParams.get("action") || url.pathname.split("/").pop();
    const body = await req.json().catch(() => ({}));

    const supabase = getSupabaseClient();

    switch (actionType) {
      case "create_lead":
      case "create_contact": {
        const { name, first_name, last_name, email, phone, company, source, tags } = body;

        if (!email && !phone && !name) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "At least one of: name, email, or phone is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const contactData: Record<string, any> = {
          team_id: teamId,
          source: source || "zapier",
        };

        if (name) contactData.name = name;
        if (first_name) contactData.first_name = first_name;
        if (last_name) contactData.last_name = last_name;
        if (email) contactData.email = email;
        if (phone) contactData.phone = phone;
        if (company) contactData.company_name = company;
        if (tags) contactData.tags = Array.isArray(tags) ? tags : [tags];

        // Derive name from first/last if not provided
        if (!contactData.name && (first_name || last_name)) {
          contactData.name = `${first_name || ""} ${last_name || ""}`.trim();
        }

        const { data: contact, error } = await supabase
          .from("contacts")
          .insert(contactData)
          .select()
          .single();

        if (error) {
          console.error("Error creating contact:", error);
          return new Response(
            JSON.stringify({ error: "database_error", message: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            contact: {
              id: contact.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              created_at: contact.created_at,
            },
          }),
          { headers: corsHeaders }
        );
      }

      case "update_lead":
      case "update_contact": {
        const { id, contact_id, ...updates } = body;
        const targetId = id || contact_id;

        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "Contact ID is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        // Build update object
        const updateData: Record<string, any> = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.first_name) updateData.first_name = updates.first_name;
        if (updates.last_name) updateData.last_name = updates.last_name;
        if (updates.email) updateData.email = updates.email;
        if (updates.phone) updateData.phone = updates.phone;
        if (updates.company) updateData.company_name = updates.company;
        if (updates.tags) updateData.tags = Array.isArray(updates.tags) ? updates.tags : [updates.tags];

        const { data: contact, error } = await supabase
          .from("contacts")
          .update(updateData)
          .eq("id", targetId)
          .eq("team_id", teamId)
          .select()
          .single();

        if (error) {
          console.error("Error updating contact:", error);
          return new Response(
            JSON.stringify({ error: "database_error", message: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            contact: {
              id: contact.id,
              name: contact.name,
              email: contact.email,
              updated_at: contact.updated_at,
            },
          }),
          { headers: corsHeaders }
        );
      }

      case "add_note": {
        const { contact_id, lead_id, appointment_id, note, note_text } = body;
        const noteContent = note || note_text;
        const targetAppointmentId = appointment_id;

        if (!noteContent) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "Note text is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        // If appointment_id provided, add to activity log
        if (targetAppointmentId) {
          const { data: log, error } = await supabase
            .from("activity_logs")
            .insert({
              team_id: teamId,
              appointment_id: targetAppointmentId,
              action_type: "note_added",
              actor_name: "Zapier",
              note: noteContent,
            })
            .select()
            .single();

          if (error) {
            console.error("Error adding note:", error);
            return new Response(
              JSON.stringify({ error: "database_error", message: error.message }),
              { status: 500, headers: corsHeaders }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              note_id: log.id,
              created_at: log.created_at,
            }),
            { headers: corsHeaders }
          );
        }

        // If contact/lead ID provided, update custom_fields with notes
        const contactTargetId = contact_id || lead_id;
        if (contactTargetId) {
          const { data: contact, error: fetchError } = await supabase
            .from("contacts")
            .select("custom_fields")
            .eq("id", contactTargetId)
            .eq("team_id", teamId)
            .single();

          if (fetchError) {
            return new Response(
              JSON.stringify({ error: "not_found", message: "Contact not found" }),
              { status: 404, headers: corsHeaders }
            );
          }

          const existingNotes = (contact.custom_fields as any)?.notes || [];
          const newNotes = [
            ...existingNotes,
            {
              text: noteContent,
              source: "zapier",
              created_at: new Date().toISOString(),
            },
          ];

          const { error: updateError } = await supabase
            .from("contacts")
            .update({
              custom_fields: {
                ...(contact.custom_fields as any || {}),
                notes: newNotes,
              },
            })
            .eq("id", contactTargetId)
            .eq("team_id", teamId);

          if (updateError) {
            console.error("Error adding note to contact:", updateError);
            return new Response(
              JSON.stringify({ error: "database_error", message: updateError.message }),
              { status: 500, headers: corsHeaders }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              contact_id: contactTargetId,
              note_added: true,
            }),
            { headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({ error: "validation_error", message: "Contact ID or Appointment ID is required" }),
          { status: 400, headers: corsHeaders }
        );
      }

      default: {
        // List available actions
        return new Response(
          JSON.stringify({
            available_actions: [
              {
                key: "create_lead",
                name: "Create Lead/Contact",
                description: "Creates a new lead or contact in your CRM",
                fields: ["name", "first_name", "last_name", "email", "phone", "company", "source", "tags"],
              },
              {
                key: "update_lead",
                name: "Update Lead/Contact",
                description: "Updates an existing lead or contact",
                fields: ["id", "name", "first_name", "last_name", "email", "phone", "company", "tags"],
              },
              {
                key: "add_note",
                name: "Add Note",
                description: "Adds a note to a lead, contact, or appointment",
                fields: ["contact_id", "appointment_id", "note"],
              },
            ],
          }),
          { headers: corsHeaders }
        );
      }
    }
  } catch (error) {
    console.error("Action error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", message: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
