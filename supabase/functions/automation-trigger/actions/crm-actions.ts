// supabase/functions/automation-trigger/actions/crm-actions.ts

import type { AutomationContext, StepExecutionLog } from "../types.ts";

// Flexible config types to allow Record<string, any> from step.config
type FlexibleConfig = Record<string, unknown>;

// Add Tag
export async function executeAddTag(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };
  const tag = (config.tag as string)?.trim();

  if (!tag) {
    log.status = "skipped";
    log.skipReason = "no_tag_specified";
    return log;
  }

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
  const tag = (config.tag as string)?.trim();

  if (!tag) {
    log.status = "skipped";
    log.skipReason = "no_tag_specified";
    return log;
  }

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
    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          team_id: context.teamId,
          name: (config.name as string) || (context.meta as any)?.name || null,
          email: (config.email as string) || (context.meta as any)?.email || null,
          phone: (config.phone as string) || (context.meta as any)?.phone || null,
          source: (config.source as string) || "automation",
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
  const value = config.value as string;

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
  const note = config.note as string | undefined;
  const entityType = (config.entity as string) || "lead";
  const entityId = entityType === "lead" ? context.lead?.id : context.appointment?.id;

  if (!entityId) {
    log.status = "skipped";
    log.skipReason = `no_${entityType}_in_context`;
    return log;
  }

  if (!note) {
    log.status = "skipped";
    log.skipReason = "no_note_content";
    return log;
  }

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

      const { error } = await supabase.from("contacts").update({ owner_id: ownerId }).eq("id", leadId);
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
