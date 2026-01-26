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
            JSON.stringify({ success: true, note_id: log.id, created_at: log.created_at }),
            { headers: corsHeaders }
          );
        }

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
            { text: noteContent, source: "zapier", created_at: new Date().toISOString() },
          ];

          const { error: updateError } = await supabase
            .from("contacts")
            .update({
              custom_fields: { ...(contact.custom_fields as any || {}), notes: newNotes },
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
            JSON.stringify({ success: true, contact_id: contactTargetId, note_added: true }),
            { headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({ error: "validation_error", message: "Contact ID or Appointment ID is required" }),
          { status: 400, headers: corsHeaders }
        );
      }

      case "create_appointment": {
        const { lead_name, lead_email, lead_phone, start_time, event_type, closer_name, notes, duration_minutes } = body;

        if (!lead_name || !start_time) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "lead_name and start_time are required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const appointmentData: Record<string, any> = {
          team_id: teamId,
          lead_name,
          lead_email: lead_email || "",
          start_at_utc: start_time,
          status: "NEW",
        };

        if (lead_phone) appointmentData.lead_phone = lead_phone;
        if (event_type) appointmentData.event_type_name = event_type;
        if (closer_name) appointmentData.closer_name = closer_name;
        if (notes) appointmentData.appointment_notes = notes;
        if (duration_minutes) appointmentData.duration_minutes = duration_minutes;

        const { data: appointment, error } = await supabase
          .from("appointments")
          .insert(appointmentData)
          .select()
          .single();

        if (error) {
          console.error("Error creating appointment:", error);
          return new Response(
            JSON.stringify({ error: "database_error", message: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            appointment: {
              id: appointment.id,
              lead_name: appointment.lead_name,
              lead_email: appointment.lead_email,
              start_time: appointment.start_at_utc,
              status: appointment.status,
              created_at: appointment.created_at,
            },
          }),
          { headers: corsHeaders }
        );
      }

      case "update_appointment": {
        const { id, appointment_id, ...updates } = body;
        const targetId = id || appointment_id;

        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "Appointment ID is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const updateData: Record<string, any> = {};
        if (updates.lead_name) updateData.lead_name = updates.lead_name;
        if (updates.lead_email) updateData.lead_email = updates.lead_email;
        if (updates.lead_phone) updateData.lead_phone = updates.lead_phone;
        if (updates.start_time) updateData.start_at_utc = updates.start_time;
        if (updates.status) updateData.status = updates.status;
        if (updates.pipeline_stage) updateData.pipeline_stage = updates.pipeline_stage;
        if (updates.closer_name) updateData.closer_name = updates.closer_name;
        if (updates.notes) updateData.appointment_notes = updates.notes;
        if (updates.revenue) updateData.revenue = updates.revenue;
        if (updates.product_name) updateData.product_name = updates.product_name;

        const { data: appointment, error } = await supabase
          .from("appointments")
          .update(updateData)
          .eq("id", targetId)
          .eq("team_id", teamId)
          .select()
          .single();

        if (error) {
          console.error("Error updating appointment:", error);
          return new Response(
            JSON.stringify({ error: "database_error", message: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            appointment: {
              id: appointment.id,
              lead_name: appointment.lead_name,
              status: appointment.status,
              pipeline_stage: appointment.pipeline_stage,
              updated_at: appointment.updated_at,
            },
          }),
          { headers: corsHeaders }
        );
      }

      case "add_tag": {
        const { contact_id, id, tags, tag } = body;
        const targetId = contact_id || id;
        const tagsToAdd = tags || (tag ? [tag] : []);

        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "Contact ID is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        if (!tagsToAdd.length) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "At least one tag is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { data: contact, error: fetchError } = await supabase
          .from("contacts")
          .select("tags")
          .eq("id", targetId)
          .eq("team_id", teamId)
          .single();

        if (fetchError) {
          return new Response(
            JSON.stringify({ error: "not_found", message: "Contact not found" }),
            { status: 404, headers: corsHeaders }
          );
        }

        const existingTags = contact.tags || [];
        const newTagsArray = Array.isArray(tagsToAdd) ? tagsToAdd : [tagsToAdd];
        const mergedTags = [...new Set([...existingTags, ...newTagsArray])];

        const { error: updateError } = await supabase
          .from("contacts")
          .update({ tags: mergedTags })
          .eq("id", targetId)
          .eq("team_id", teamId);

        if (updateError) {
          console.error("Error adding tags:", updateError);
          return new Response(
            JSON.stringify({ error: "database_error", message: updateError.message }),
            { status: 500, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({ success: true, contact_id: targetId, tags: mergedTags }),
          { headers: corsHeaders }
        );
      }

      case "remove_tag": {
        const { contact_id, id, tags, tag } = body;
        const targetId = contact_id || id;
        const tagsToRemove = tags || (tag ? [tag] : []);

        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "Contact ID is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        if (!tagsToRemove.length) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "At least one tag is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { data: contact, error: fetchError } = await supabase
          .from("contacts")
          .select("tags")
          .eq("id", targetId)
          .eq("team_id", teamId)
          .single();

        if (fetchError) {
          return new Response(
            JSON.stringify({ error: "not_found", message: "Contact not found" }),
            { status: 404, headers: corsHeaders }
          );
        }

        const existingTags = contact.tags || [];
        const removeTagsArray = Array.isArray(tagsToRemove) ? tagsToRemove : [tagsToRemove];
        const filteredTags = existingTags.filter((t: string) => !removeTagsArray.includes(t));

        const { error: updateError } = await supabase
          .from("contacts")
          .update({ tags: filteredTags })
          .eq("id", targetId)
          .eq("team_id", teamId);

        if (updateError) {
          console.error("Error removing tags:", updateError);
          return new Response(
            JSON.stringify({ error: "database_error", message: updateError.message }),
            { status: 500, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({ success: true, contact_id: targetId, tags: filteredTags }),
          { headers: corsHeaders }
        );
      }

      case "change_stage": {
        const { appointment_id, id, stage, pipeline_stage } = body;
        const targetId = appointment_id || id;
        const newStage = stage || pipeline_stage;

        if (!targetId) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "Appointment ID is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        if (!newStage) {
          return new Response(
            JSON.stringify({ error: "validation_error", message: "Stage is required" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { data: appointment, error } = await supabase
          .from("appointments")
          .update({ pipeline_stage: newStage })
          .eq("id", targetId)
          .eq("team_id", teamId)
          .select()
          .single();

        if (error) {
          console.error("Error changing stage:", error);
          return new Response(
            JSON.stringify({ error: "database_error", message: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            appointment: {
              id: appointment.id,
              lead_name: appointment.lead_name,
              pipeline_stage: appointment.pipeline_stage,
              updated_at: appointment.updated_at,
            },
          }),
          { headers: corsHeaders }
        );
      }

      default: {
        return new Response(
          JSON.stringify({
            available_actions: [
              { key: "create_lead", name: "Create Lead/Contact", description: "Creates a new lead or contact in your CRM", fields: ["name", "first_name", "last_name", "email", "phone", "company", "source", "tags"] },
              { key: "update_lead", name: "Update Lead/Contact", description: "Updates an existing lead or contact", fields: ["id", "name", "first_name", "last_name", "email", "phone", "company", "tags"] },
              { key: "add_note", name: "Add Note", description: "Adds a note to a lead, contact, or appointment", fields: ["contact_id", "appointment_id", "note"] },
              { key: "create_appointment", name: "Create Appointment", description: "Creates a new appointment", fields: ["lead_name", "lead_email", "lead_phone", "start_time", "event_type", "closer_name", "notes", "duration_minutes"] },
              { key: "update_appointment", name: "Update Appointment", description: "Updates an existing appointment", fields: ["appointment_id", "lead_name", "lead_email", "status", "pipeline_stage", "start_time", "notes", "revenue", "product_name"] },
              { key: "add_tag", name: "Add Tag to Contact", description: "Adds one or more tags to a contact", fields: ["contact_id", "tags"] },
              { key: "remove_tag", name: "Remove Tag from Contact", description: "Removes tags from a contact", fields: ["contact_id", "tags"] },
              { key: "change_stage", name: "Change Pipeline Stage", description: "Moves an appointment to a different pipeline stage", fields: ["appointment_id", "stage"] },
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
