import { supabase } from "@/integrations/supabase/client";

export interface ActionPipelineMappings {
  double_book: string | null;
  rebook: string | null;
  no_show: string | null;
  cancelled: string | null;
  rescheduled: string | null;
  no_answer: string | null;
}

const DEFAULT_MAPPINGS: ActionPipelineMappings = {
  double_book: "booked",
  rebook: "booked",
  no_show: "no_show",
  cancelled: "canceled",
  rescheduled: "rescheduled",
  no_answer: null,
};

export async function getActionPipelineMappings(teamId: string): Promise<ActionPipelineMappings> {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("action_pipeline_mappings")
      .eq("id", teamId)
      .single();

    if (error || !data?.action_pipeline_mappings) {
      return DEFAULT_MAPPINGS;
    }

    const savedMappings = data.action_pipeline_mappings as Record<string, string | null>;
    return {
      ...DEFAULT_MAPPINGS,
      ...savedMappings,
    };
  } catch {
    return DEFAULT_MAPPINGS;
  }
}

export function getPipelineStageForAction(
  mappings: ActionPipelineMappings,
  action: keyof ActionPipelineMappings
): string | null {
  return mappings[action] ?? DEFAULT_MAPPINGS[action];
}

export async function applyActionPipelineMapping(
  teamId: string,
  appointmentId: string,
  action: keyof ActionPipelineMappings
): Promise<{ success: boolean; newStage: string | null }> {
  try {
    const mappings = await getActionPipelineMappings(teamId);
    const newStage = getPipelineStageForAction(mappings, action);

    if (!newStage) {
      // No mapping configured - no change
      return { success: true, newStage: null };
    }

    const { error } = await supabase
      .from("appointments")
      .update({ pipeline_stage: newStage })
      .eq("id", appointmentId);

    if (error) {
      console.error(`Failed to apply pipeline mapping for ${action}:`, error);
      return { success: false, newStage: null };
    }

    return { success: true, newStage };
  } catch (error) {
    console.error(`Error applying pipeline mapping for ${action}:`, error);
    return { success: false, newStage: null };
  }
}
