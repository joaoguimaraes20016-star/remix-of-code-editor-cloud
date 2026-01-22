// src/hooks/useAutomationVersioning.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AutomationDefinition } from "@/lib/automations/types";
import type { Json } from "@/integrations/supabase/types";

export interface WorkflowVersion {
  id: string;
  automation_id: string;
  version_number: number;
  definition_json: Json;
  trigger_type: string;
  published_at: string;
  published_by: string | null;
  is_active: boolean | null;
  team_id: string;
}

export type PublishStatus = "unpublished" | "published" | "has_changes";

/**
 * Fetch the latest published version for an automation
 */
export function useLatestVersion(automationId: string | null) {
  return useQuery({
    queryKey: ["workflow-version-latest", automationId],
    queryFn: async (): Promise<WorkflowVersion | null> => {
      if (!automationId) return null;
      
      const { data, error } = await supabase
        .from("workflow_versions")
        .select("*")
        .eq("automation_id", automationId)
        .eq("is_active", true)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching latest version:", error);
        return null;
      }
      
      return data as WorkflowVersion | null;
    },
    enabled: !!automationId,
  });
}

/**
 * Fetch version history for an automation
 */
export function useVersionHistory(automationId: string | null) {
  return useQuery({
    queryKey: ["workflow-versions", automationId],
    queryFn: async (): Promise<WorkflowVersion[]> => {
      if (!automationId) return [];
      
      const { data, error } = await supabase
        .from("workflow_versions")
        .select("*")
        .eq("automation_id", automationId)
        .order("version_number", { ascending: false });
      
      if (error) {
        console.error("Error fetching version history:", error);
        return [];
      }
      
      return (data || []) as WorkflowVersion[];
    },
    enabled: !!automationId,
  });
}

/**
 * Determine publish status by comparing current definition to latest published version
 */
export function getPublishStatus(
  currentDefinition: AutomationDefinition,
  latestVersion: WorkflowVersion | null | undefined,
  automationId: string | null,
): PublishStatus {
  // New automation that hasn't been saved yet
  if (!automationId || automationId === "new") {
    return "unpublished";
  }
  
  // No published version exists
  if (!latestVersion) {
    return "unpublished";
  }
  
  // Compare definitions (excluding metadata like id, teamId, name that may differ)
  const currentSteps = JSON.stringify(currentDefinition.steps);
  const publishedDef = latestVersion.definition_json as Record<string, any> | null;
  const publishedSteps = JSON.stringify(publishedDef?.steps || []);
  
  const currentTrigger = JSON.stringify(currentDefinition.trigger);
  const publishedTrigger = JSON.stringify(publishedDef?.trigger || {});
  
  if (currentSteps !== publishedSteps || currentTrigger !== publishedTrigger) {
    return "has_changes";
  }
  
  return "published";
}

/**
 * Hook for publishing a new version of an automation
 */
export function usePublishVersion(automationId: string | null, teamId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (definition: AutomationDefinition) => {
      if (!automationId || automationId === "new") {
        throw new Error("Cannot publish an unsaved automation");
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get next version number
      const { data: versions } = await supabase
        .from("workflow_versions")
        .select("version_number")
        .eq("automation_id", automationId)
        .order("version_number", { ascending: false })
        .limit(1);
      
      const nextVersion = (versions?.[0]?.version_number || 0) + 1;
      
      // Create new version
      const { data: newVersion, error: versionError } = await supabase
        .from("workflow_versions")
        .insert({
          automation_id: automationId,
          team_id: teamId,
          version_number: nextVersion,
          definition_json: definition as unknown as Record<string, any>,
          trigger_type: definition.trigger.type,
          published_by: user?.id || null,
          is_active: true,
        })
        .select()
        .single();
      
      if (versionError) throw versionError;
      
      // Update automation's current_version_id and version counter
      const { error: updateError } = await supabase
        .from("automations")
        .update({
          current_version_id: newVersion.id,
          version: nextVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", automationId);
      
      if (updateError) throw updateError;
      
      return newVersion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-version-latest", automationId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-versions", automationId] });
      queryClient.invalidateQueries({ queryKey: ["automations", teamId] });
      toast.success(`Published v${data.version_number}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
      console.error("Publish error:", err);
    },
  });
}

/**
 * Hook for rolling back to a previous version
 */
export function useRollbackVersion(automationId: string | null, teamId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (versionId: string) => {
      if (!automationId) {
        throw new Error("No automation ID");
      }
      
      // Fetch the version to rollback to
      const { data: version, error: fetchError } = await supabase
        .from("workflow_versions")
        .select("*")
        .eq("id", versionId)
        .single();
      
      if (fetchError || !version) throw fetchError || new Error("Version not found");
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get next version number
      const { data: versions } = await supabase
        .from("workflow_versions")
        .select("version_number")
        .eq("automation_id", automationId)
        .order("version_number", { ascending: false })
        .limit(1);
      
      const nextVersion = (versions?.[0]?.version_number || 0) + 1;
      
      // Create new version with the old definition
      const { data: newVersion, error: versionError } = await supabase
        .from("workflow_versions")
        .insert({
          automation_id: automationId,
          team_id: teamId,
          version_number: nextVersion,
          definition_json: version.definition_json,
          trigger_type: version.trigger_type,
          published_by: user?.id || null,
          is_active: true,
        })
        .select()
        .single();
      
      if (versionError) throw versionError;
      
      // Update automation
      const { error: updateError } = await supabase
        .from("automations")
        .update({
          current_version_id: newVersion.id,
          version: nextVersion,
          definition: version.definition_json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", automationId);
      
      if (updateError) throw updateError;
      
      return { newVersion, rolledBackFrom: version.version_number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-version-latest", automationId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-versions", automationId] });
      queryClient.invalidateQueries({ queryKey: ["automations", teamId] });
      queryClient.invalidateQueries({ queryKey: ["automation", automationId] });
      toast.success(`Rolled back to v${data.rolledBackFrom} (now v${data.newVersion.version_number})`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to rollback");
      console.error("Rollback error:", err);
    },
  });
}
