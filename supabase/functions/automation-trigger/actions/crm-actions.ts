// supabase/functions/automation-trigger/actions/crm-actions.ts

import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

// Flexible config types to allow Record<string, any> from step.config
type FlexibleConfig = Record<string, unknown>;

// Add Tag
export async function executeAddTag(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };
  const rawTag = (config.tag as string)?.trim();

  if (!rawTag) {
    log.status = "skipped";
    log.skipReason = "no_tag_specified";
    return log;
  }

  // Render template variables in tag name (e.g., "{{lead.source}}-customer")
  const tag = renderTemplate(rawTag, context);

  const leadId = context.lead?.id;
  if (!leadId) {
    log.status = "skipped";
    log.skipReason = "no_lead_in_context";
    return log;
  }

  try {
    // Get current tags
    const { data: contact, error: fetchError } = await supabase
      .from("contacts")
      .select("tags")
      .eq("id", leadId)
      .single();

    if (fetchError) {
      log.status = "error";
      log.error = fetchError.message;
      return log;
    }

    const currentTags: string[] = contact?.tags || [];
    if (!currentTags.includes(tag)) {
      const { error: updateError } = await supabase
        .from("contacts")
        .update({ tags: [...currentTags, tag] })
        .eq("id", leadId);

      if (updateError) {
        log.status = "error";
        log.error = updateError.message;
      }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Remove Tag
export async function executeRemoveTag(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };
  const rawTag = (config.tag as string)?.trim();

  if (!rawTag) {
    log.status = "skipped";
    log.skipReason = "no_tag_specified";
    return log;
  }

  // Render template variables in tag name
  const tag = renderTemplate(rawTag, context);

  const leadId = context.lead?.id;
  if (!leadId) {
    log.status = "skipped";
    log.skipReason = "no_lead_in_context";
    return log;
  }

  try {
    const { data: contact, error: fetchError } = await supabase
      .from("contacts")
      .select("tags")
      .eq("id", leadId)
      .single();

    if (fetchError) {
      log.status = "error";
      log.error = fetchError.message;
      return log;
    }

    const currentTags: string[] = contact?.tags || [];
    const updatedTags = currentTags.filter((t) => t !== tag);

    if (updatedTags.length !== currentTags.length) {
      const { error: updateError } = await supabase
        .from("contacts")
        .update({ tags: updatedTags })
        .eq("id", leadId);

      if (updateError) {
        log.status = "error";
        log.error = updateError.message;
      }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Create Contact
export async function executeCreateContact(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    // Render template variables in contact fields
    const name = renderTemplate((config.name as string) || "", context) || (context.meta as any)?.name || null;
    const email = renderTemplate((config.email as string) || "", context) || (context.meta as any)?.email || null;
    const phone = renderTemplate((config.phone as string) || "", context) || (context.meta as any)?.phone || null;
    const source = renderTemplate((config.source as string) || "", context) || "automation";

    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          team_id: context.teamId,
          name,
          email,
          phone,
          source,
        },
      ])
      .select("id")
      .single();

    if (error) {
      log.status = "error";
      log.error = error.message;
    } else {
      log.output = { contactId: data?.id };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Update Contact
export async function executeUpdateContact(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };
  const field = config.field as string;
  // Render template variables in the value (e.g., "{{appointment.event_type_name}}")
  const value = renderTemplate((config.value as string) || "", context);

  const leadId = context.lead?.id;
  if (!leadId) {
    log.status = "skipped";
    log.skipReason = "no_lead_in_context";
    return log;
  }

  if (!field) {
    log.status = "skipped";
    log.skipReason = "no_field_specified";
    return log;
  }

  try {
    // Handle custom fields separately
    if (field.startsWith("custom_fields.")) {
      const customFieldKey = field.replace("custom_fields.", "");
      const { data: contact, error: fetchError } = await supabase
        .from("contacts")
        .select("custom_fields")
        .eq("id", leadId)
        .single();

      if (fetchError) {
        log.status = "error";
        log.error = fetchError.message;
        return log;
      }

      const customFields = contact?.custom_fields || {};
      customFields[customFieldKey] = value;

      const { error: updateError } = await supabase
        .from("contacts")
        .update({ custom_fields: customFields })
        .eq("id", leadId);

      if (updateError) {
        log.status = "error";
        log.error = updateError.message;
      }
    } else {
      // Standard field update
      const { error } = await supabase
        .from("contacts")
        .update({ [field]: value })
        .eq("id", leadId);

      if (error) {
        log.status = "error";
        log.error = error.message;
      }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Add Note
export async function executeAddNote(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };
  const rawNote = config.note as string | undefined;
  const entityType = (config.entity as string) || "lead";
  const entityId = entityType === "lead" ? context.lead?.id : context.appointment?.id;

  if (!entityId) {
    log.status = "skipped";
    log.skipReason = `no_${entityType}_in_context`;
    return log;
  }

  if (!rawNote) {
    log.status = "skipped";
    log.skipReason = "no_note_content";
    return log;
  }

  // Render template variables in note content
  const note = renderTemplate(rawNote, context);

  try {
    // For appointments, update notes field
    if (entityType === "deal" || entityType === "appointment") {
      const { data: appt, error: fetchError } = await supabase
        .from("appointments")
        .select("closer_notes")
        .eq("id", entityId)
        .single();

      if (fetchError) {
        log.status = "error";
        log.error = fetchError.message;
        return log;
      }

      const existingNotes = appt?.closer_notes || "";
      const timestamp = new Date().toISOString();
      const newNote = `${existingNotes}\n\n[${timestamp}] ${note}`.trim();

      const { error: updateError } = await supabase
        .from("appointments")
        .update({ closer_notes: newNote })
        .eq("id", entityId);

      if (updateError) {
        log.status = "error";
        log.error = updateError.message;
      }
    }
    // For leads, we could add to activity_logs or a notes field
    // For now, log to activity_logs
    else {
      const { error } = await supabase.from("activity_logs").insert([
        {
          team_id: context.teamId,
          appointment_id: context.appointment?.id || entityId,
          action_type: "note_added",
          actor_name: "Automation",
          note: note,
        },
      ]);

      if (error) {
        log.status = "error";
        log.error = error.message;
      }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Assign Owner
export async function executeAssignOwner(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const entity = (config.entity as string) || "lead";
  const ownerId = config.ownerId as string | undefined;

  if (!ownerId) {
    log.status = "skipped";
    log.skipReason = "no_owner_specified";
    return log;
  }

  try {
    if (entity === "lead") {
      const leadId = context.lead?.id;
      if (!leadId) {
        log.status = "skipped";
        log.skipReason = "no_lead_in_context";
        return log;
      }

      const { error } = await supabase.from("contacts").update({ owner_user_id: ownerId }).eq("id", leadId);
      if (error) {
        log.status = "error";
        log.error = error.message;
      }
    } else if (entity === "deal" || entity === "appointment") {
      const dealId = context.deal?.id || context.appointment?.id;
      if (!dealId) {
        log.status = "skipped";
        log.skipReason = "no_deal_in_context";
        return log;
      }

      const { error } = await supabase.from("appointments").update({ closer_id: ownerId }).eq("id", dealId);
      if (error) {
        log.status = "error";
        log.error = error.message;
      }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Update Stage
export async function executeUpdateStage(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const entity = (config.entity as string) || "lead";
  const stageId = config.stageId as string | undefined;

  if (!stageId) {
    log.status = "skipped";
    log.skipReason = "no_stage_specified";
    return log;
  }

  try {
    if (entity === "lead") {
      const leadId = context.lead?.id;
      if (!leadId) {
        log.status = "skipped";
        log.skipReason = "no_lead_in_context";
        return log;
      }

      const { error } = await supabase.from("contacts").update({ stage_id: stageId }).eq("id", leadId);
      if (error) {
        log.status = "error";
        log.error = error.message;
      }
    } else if (entity === "deal" || entity === "appointment") {
      const dealId = context.deal?.id || context.appointment?.id;
      if (!dealId) {
        log.status = "skipped";
        log.skipReason = "no_deal_in_context";
        return log;
      }

      const { error } = await supabase.from("appointments").update({ pipeline_stage: stageId }).eq("id", dealId);
      if (error) {
        log.status = "error";
        log.error = error.message;
      }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Create Deal
export async function executeCreateDeal(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    // Get lead info from context
    const lead = context.lead;
    const appointment = context.appointment;

    // Determine deal name - render template or fall back to lead name
    const rawDealName = (config.name as string) || "";
    const dealName = renderTemplate(rawDealName, context) || 
                     lead?.name || 
                     appointment?.lead_name || 
                     "New Deal";

    // Determine value
    const dealValue = Number(config.value) || 0;

    // Determine stage - use config or default to 'booked'
    const stageId = (config.stageId as string) || "booked";

    // Render template variables in notes and event type
    const eventType = renderTemplate((config.eventType as string) || "", context) || "Deal from Automation";
    const notes = renderTemplate((config.notes as string) || "", context) || `Created by automation at ${new Date().toISOString()}`;

    // Create deal as an appointment record (deals are appointments in this system)
    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          team_id: context.teamId,
          lead_name: dealName,
          lead_email: lead?.email || appointment?.lead_email || null,
          lead_phone: lead?.phone || appointment?.lead_phone || null,
          pipeline_stage: stageId,
          revenue: dealValue,
          status: "NEW",
          start_at_utc: new Date().toISOString(),
          event_type_name: eventType,
          setter_id: lead?.owner_user_id || null,
          appointment_notes: notes,
        },
      ])
      .select("id")
      .single();

    if (error) {
      log.status = "error";
      log.error = error.message;
      return log;
    }

    log.output = { dealId: data?.id, stage: stageId, value: dealValue };
    log.entity = "deal";

    // Log activity
    await supabase.from("activity_logs").insert([
      {
        team_id: context.teamId,
        appointment_id: data?.id,
        action_type: "deal_created",
        actor_name: "Automation",
        note: `Deal created: ${dealName} - $${dealValue}`,
      },
    ]);

  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Close Deal
export async function executeCloseDeal(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    // Get deal from context
    const dealId = context.deal?.id || context.appointment?.id;

    if (!dealId) {
      log.status = "skipped";
      log.skipReason = "no_deal_in_context";
      return log;
    }

    const closeStatus = (config.status as string) || "won";
    // Render template variables in reason
    const reason = renderTemplate((config.reason as string) || "", context);

    if (closeStatus === "won") {
      // For won deals, we need more info - use RPC if available, else direct update
      const ccAmount = Number(config.ccAmount) || 0;
      const mrrAmount = Number(config.mrrAmount) || 0;
      const mrrMonths = Number(config.mrrMonths) || 0;
      // Render template variables in product name
      const productName = renderTemplate((config.productName as string) || "", context) || "Product";

      // Try using the close_deal_transaction RPC for full processing
      if (ccAmount > 0 || mrrAmount > 0) {
        const { data, error } = await supabase.rpc("close_deal_transaction", {
          p_appointment_id: dealId,
          p_closer_id: context.appointment?.closer_id || null,
          p_cc_amount: ccAmount,
          p_mrr_amount: mrrAmount,
          p_mrr_months: mrrMonths,
          p_product_name: productName,
          p_notes: reason,
          p_closer_name: context.appointment?.closer_name || "Automation",
        });

        if (error) {
          // Fall back to simple update if RPC fails
          console.warn("[CRM Action] RPC failed, falling back to direct update:", error.message);
          const { error: updateError } = await supabase
            .from("appointments")
            .update({
              status: "CLOSED",
              pipeline_stage: "won",
              cc_collected: ccAmount,
              mrr_amount: mrrAmount,
              mrr_months: mrrMonths,
              product_name: productName,
              closer_notes: reason ? `${reason}\n\nClosed by automation.` : "Closed by automation.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", dealId);

          if (updateError) {
            log.status = "error";
            log.error = updateError.message;
            return log;
          }
        }

        log.output = { closed: true, status: "won", dealId, ccAmount, mrrAmount };
      } else {
        // Simple won update without revenue
        const { error } = await supabase
          .from("appointments")
          .update({
            status: "CLOSED",
            pipeline_stage: "won",
            closer_notes: reason ? `${reason}\n\nClosed by automation.` : "Closed by automation.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", dealId);

        if (error) {
          log.status = "error";
          log.error = error.message;
          return log;
        }

        log.output = { closed: true, status: "won", dealId };
      }
    } else {
      // Lost deal - update to disqualified
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "CANCELLED",
          pipeline_stage: "disqualified",
          closer_notes: reason ? `Lost Reason: ${reason}` : "Marked as lost by automation.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", dealId);

      if (error) {
        log.status = "error";
        log.error = error.message;
        return log;
      }

      log.output = { closed: true, status: "lost", dealId, reason };
    }

    log.entity = "deal";

    // Log activity
    await supabase.from("activity_logs").insert([
      {
        team_id: context.teamId,
        appointment_id: dealId,
        action_type: closeStatus === "won" ? "deal_won" : "deal_lost",
        actor_name: "Automation",
        note: closeStatus === "won" ? "Deal closed as won by automation" : `Deal lost: ${reason || "No reason provided"}`,
      },
    ]);

  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Find Contact (lookup by email, phone, or custom field)
export async function executeFindContact(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const searchField = (config.searchField as string) || "email";
    const rawSearchValue = (config.searchValue as string) || "";
    const searchValue = renderTemplate(rawSearchValue, context);

    if (!searchValue) {
      log.status = "skipped";
      log.skipReason = "no_search_value";
      return log;
    }

    let query = supabase
      .from("contacts")
      .select("*")
      .eq("team_id", context.teamId);

    if (searchField === "email") {
      query = query.eq("email", searchValue);
    } else if (searchField === "phone") {
      query = query.eq("phone", searchValue);
    } else if (searchField === "name") {
      query = query.ilike("name", `%${searchValue}%`);
    } else if (searchField.startsWith("custom_fields.")) {
      const cfKey = searchField.replace("custom_fields.", "");
      query = query.contains("custom_fields", { [cfKey]: searchValue });
    } else {
      query = query.eq(searchField, searchValue);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      log.status = "error";
      log.error = error.message;
      return log;
    }

    if (data) {
      log.output = { found: true, contactId: data.id, contact: data };
    } else {
      log.output = { found: false };
      if (config.failIfNotFound) {
        log.status = "skipped";
        log.skipReason = "contact_not_found";
      }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Delete Contact
export async function executeDeleteContact(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const leadId = context.lead?.id;
  if (!leadId) {
    log.status = "skipped";
    log.skipReason = "no_lead_in_context";
    return log;
  }

  try {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", leadId)
      .eq("team_id", context.teamId);

    if (error) {
      log.status = "error";
      log.error = error.message;
    } else {
      log.output = { deletedContactId: leadId };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Remove Owner
export async function executeRemoveOwner(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const entity = (config.entity as string) || "lead";

  try {
    if (entity === "lead") {
      const leadId = context.lead?.id;
      if (!leadId) {
        log.status = "skipped";
        log.skipReason = "no_lead_in_context";
        return log;
      }
      const { error } = await supabase.from("contacts").update({ owner_user_id: null }).eq("id", leadId);
      if (error) { log.status = "error"; log.error = error.message; }
    } else if (entity === "deal" || entity === "appointment") {
      const dealId = context.deal?.id || context.appointment?.id;
      if (!dealId) {
        log.status = "skipped";
        log.skipReason = "no_deal_in_context";
        return log;
      }
      const { error } = await supabase.from("appointments").update({ closer_id: null }).eq("id", dealId);
      if (error) { log.status = "error"; log.error = error.message; }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Toggle Do Not Disturb
export async function executeToggleDnd(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const leadId = context.lead?.id;
  if (!leadId) {
    log.status = "skipped";
    log.skipReason = "no_lead_in_context";
    return log;
  }

  try {
    const enableDnd = config.enable !== false; // Default to enabling DND
    const channels = (config.channels as string[]) || ["all"];

    // Get current DND settings
    const { data: contact, error: fetchError } = await supabase
      .from("contacts")
      .select("custom_fields")
      .eq("id", leadId)
      .single();

    if (fetchError) {
      log.status = "error";
      log.error = fetchError.message;
      return log;
    }

    const customFields = contact?.custom_fields || {};
    customFields.dnd_enabled = enableDnd;
    customFields.dnd_channels = channels;
    customFields.dnd_updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("contacts")
      .update({ custom_fields: customFields })
      .eq("id", leadId);

    if (updateError) {
      log.status = "error";
      log.error = updateError.message;
    } else {
      log.output = { dndEnabled: enableDnd, channels };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Update Deal
export async function executeUpdateDeal(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const dealId = context.deal?.id || context.appointment?.id;
  if (!dealId) {
    log.status = "skipped";
    log.skipReason = "no_deal_in_context";
    return log;
  }

  const field = config.field as string;
  const rawValue = (config.value as string) || "";
  const value = renderTemplate(rawValue, context);

  if (!field) {
    log.status = "skipped";
    log.skipReason = "no_field_specified";
    return log;
  }

  try {
    const { error } = await supabase
      .from("appointments")
      .update({ [field]: value })
      .eq("id", dealId);

    if (error) {
      log.status = "error";
      log.error = error.message;
    } else {
      log.output = { dealId, field, value };
      log.entity = "deal";
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Find Opportunity (GHL-style: search by filters, earliest/latest, AND logic)
export async function executeFindOpportunity(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const teamId = context.teamId;

    // Build query
    let query = supabase
      .from("appointments")
      .select("*")
      .eq("team_id", teamId)
      .neq("status", "CLOSED"); // Exclude closed deals

    // Search filters (AND logic - all must match)
    if (config.email) {
      const email = renderTemplate(String(config.email), context);
      query = query.eq("lead_email", email);
    }
    if (config.phone) {
      const phone = renderTemplate(String(config.phone), context);
      query = query.eq("lead_phone", phone);
    }
    // Default: search for opportunities linked to the current contact via email/phone
    // Only apply if no explicit email/phone filters provided
    if (!config.email && !config.phone && context.lead) {
      if (context.lead.email) {
        query = query.eq("lead_email", context.lead.email);
      } else if (context.lead.phone) {
        query = query.eq("lead_phone", context.lead.phone);
      }
    }
    if (config.pipelineStage) {
      query = query.eq("pipeline_stage", config.pipelineStage);
    }
    if (config.status) {
      query = query.eq("status", config.status);
    }

    // Order by recency (GHL supports earliest/latest)
    const ascending = (config.searchOrder as string) === "earliest";
    query = query.order("created_at", { ascending }).limit(1);

    const { data, error } = await query.maybeSingle();

    if (error) {
      log.status = "error";
      log.error = `Failed to find opportunity: ${error.message}`;
      return log;
    }

    if (data) {
      // Found - update context so subsequent steps can use it
      context.deal = data;
      context.appointment = data;
      log.output = { found: true, dealId: data.id, deal: data };
      log.entity = "deal";
    } else {
      log.output = { found: false };
      if (config.failIfNotFound) {
        log.status = "skipped";
        log.skipReason = "opportunity_not_found";
      }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Remove Opportunity (GHL-style: remove specific or all for contact)
export async function executeRemoveOpportunity(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const teamId = context.teamId;
    const removeAll = Boolean(config.removeAll);
    const contactEmail = (config.contactEmail as string) || context.lead?.email;
    const contactPhone = (config.contactPhone as string) || context.lead?.phone;

    if (removeAll && (contactEmail || contactPhone)) {
      // Remove all non-closed opportunities for this contact via email/phone match
      let deleteQuery = supabase
        .from("appointments")
        .delete()
        .eq("team_id", teamId)
        .neq("status", "CLOSED"); // Don't remove closed deals

      if (contactEmail) {
        deleteQuery = deleteQuery.eq("lead_email", contactEmail);
      } else if (contactPhone) {
        deleteQuery = deleteQuery.eq("lead_phone", contactPhone);
      }

      const { error } = await deleteQuery;

      if (error) {
        log.status = "error";
        log.error = `Failed to remove opportunities: ${error.message}`;
        return log;
      }

      log.output = { removed: "all", contactEmail: contactEmail || contactPhone };
      log.entity = "deal";
      return log;
    }

    // Remove specific opportunity
    const dealId = (config.dealId as string) || context.deal?.id || context.appointment?.id;
    if (!dealId) {
      log.status = "skipped";
      log.skipReason = "no_opportunity_in_context";
      return log;
    }

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", dealId)
      .eq("team_id", teamId);

    if (error) {
      log.status = "error";
      log.error = `Failed to remove opportunity: ${error.message}`;
      return log;
    }

    log.output = { removed: "specific", dealId };
    log.entity = "deal";

    // Clear from context
    if (context.deal?.id === dealId) context.deal = null;
    if (context.appointment?.id === dealId) context.appointment = null;
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Copy Contact
export async function executeCopyContact(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const sourceContactId = context.lead?.id;
  if (!sourceContactId) {
    log.status = "skipped";
    log.skipReason = "no_lead_in_context";
    return log;
  }

  try {
    // Get the source contact
    const { data: source, error: fetchError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", sourceContactId)
      .single();

    if (fetchError || !source) {
      log.status = "error";
      log.error = fetchError?.message || "Source contact not found";
      return log;
    }

    const copyTags = config.copyTags !== false; // default true
    const copyCustomFields = config.copyCustomFields !== false; // default true

    // Build the new contact data
    const newEmail = config.newEmail
      ? renderTemplate(config.newEmail as string, context)
      : null;
    const newPhone = config.newPhone
      ? renderTemplate(config.newPhone as string, context)
      : null;

    const newContactData: Record<string, unknown> = {
      team_id: source.team_id,
      first_name: source.first_name,
      last_name: source.last_name,
      name: source.name ? source.name + " (Copy)" : null,
      email: newEmail,
      phone: newPhone,
      tags: copyTags ? (source.tags || []) : [],
      source: source.source,
      custom_fields: copyCustomFields
        ? {
            ...(source.custom_fields || {}),
            copied_from_contact_id: sourceContactId,
          }
        : { copied_from_contact_id: sourceContactId },
    };

    const { data: newContact, error: insertError } = await supabase
      .from("contacts")
      .insert(newContactData)
      .select()
      .single();

    if (insertError) {
      log.status = "error";
      log.error = `Failed to copy contact: ${insertError.message}`;
      return log;
    }

    log.output = {
      contactId: newContact.id,
      sourceContactId,
      email: newEmail,
      phone: newPhone,
      copiedTags: copyTags,
      copiedCustomFields: copyCustomFields,
    };
    log.entity = "lead";
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// AI Intent (stub - requires OpenAI integration)
export async function executeAiIntent(
  _config: FlexibleConfig,
  _context: AutomationContext,
  _supabase: any,
): Promise<StepExecutionLog> {
  return {
    status: "error",
    error:
      "AI Intent requires an OpenAI API key. Please add your OpenAI API key in Team Settings → Integrations → OpenAI to enable AI-powered automation actions.",
  };
}

// AI Decision (stub - requires OpenAI integration)
export async function executeAiDecision(
  _config: FlexibleConfig,
  _context: AutomationContext,
  _supabase: any,
): Promise<StepExecutionLog> {
  return {
    status: "error",
    error:
      "AI Decision requires an OpenAI API key. Please add your OpenAI API key in Team Settings → Integrations → OpenAI to enable AI-powered automation actions.",
  };
}

// AI Translate (stub - requires OpenAI integration)
export async function executeAiTranslate(
  _config: FlexibleConfig,
  _context: AutomationContext,
  _supabase: any,
): Promise<StepExecutionLog> {
  return {
    status: "error",
    error:
      "AI Translate requires an OpenAI API key. Please add your OpenAI API key in Team Settings → Integrations → OpenAI to enable AI-powered automation actions.",
  };
}

// AI Summarize (stub - requires OpenAI integration)
export async function executeAiSummarize(
  _config: FlexibleConfig,
  _context: AutomationContext,
  _supabase: any,
): Promise<StepExecutionLog> {
  return {
    status: "error",
    error:
      "AI Summarize requires an OpenAI API key. Please add your OpenAI API key in Team Settings → Integrations → OpenAI to enable AI-powered automation actions.",
  };
}

// AI Message (stub - requires OpenAI integration)
export async function executeAiMessage(
  _config: FlexibleConfig,
  _context: AutomationContext,
  _supabase: any,
): Promise<StepExecutionLog> {
  return {
    status: "error",
    error:
      "AI Message requires an OpenAI API key. Please add your OpenAI API key in Team Settings → Integrations → OpenAI to enable AI-powered automation actions.",
  };
}

// Add Followers (stub - requires followers infrastructure)
export async function executeAddFollowers(
  _config: FlexibleConfig,
  _context: AutomationContext,
  _supabase: any,
): Promise<StepExecutionLog> {
  return {
    status: "error",
    error:
      "Add Followers requires the followers system to be set up. A 'followers' column or table must be created for contacts and opportunities. This feature is planned for a future release.",
  };
}

// Remove Followers (stub - requires followers infrastructure)
export async function executeRemoveFollowers(
  _config: FlexibleConfig,
  _context: AutomationContext,
  _supabase: any,
): Promise<StepExecutionLog> {
  return {
    status: "error",
    error:
      "Remove Followers requires the followers system to be set up. A 'followers' column or table must be created for contacts and opportunities. This feature is planned for a future release.",
  };
}

// Add to Audience (Coming Soon - requires Facebook Marketing API)
export async function executeAddToAudience(
  _config: FlexibleConfig,
  _context: AutomationContext,
  _supabase: any,
): Promise<StepExecutionLog> {
  console.warn("[Automation] add_to_audience action is not yet implemented (Coming Soon)");
  return {
    status: "skipped",
    skipReason: "coming_soon",
    error:
      "Add to Audience is coming soon. Facebook Custom Audience management will be available in a future update. Your automation will continue with the next step.",
  };
}

// Remove from Audience (Coming Soon - requires Facebook Marketing API)
export async function executeRemoveFromAudience(
  _config: FlexibleConfig,
  _context: AutomationContext,
  _supabase: any,
): Promise<StepExecutionLog> {
  console.warn("[Automation] remove_from_audience action is not yet implemented (Coming Soon)");
  return {
    status: "skipped",
    skipReason: "coming_soon",
    error:
      "Remove from Audience is coming soon. Facebook Custom Audience management will be available in a future update. Your automation will continue with the next step.",
  };
}
