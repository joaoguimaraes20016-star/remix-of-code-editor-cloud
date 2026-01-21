import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AutomationEditorShell } from "@/components/automations/editor/AutomationEditorShell";
import type { AutomationDefinition, TriggerType } from "@/lib/automations/types";
import { Loader2 } from "lucide-react";

const DEFAULT_DEFINITION: AutomationDefinition = {
  id: "",
  teamId: "",
  name: "",
  description: "",
  isActive: true,
  trigger: {
    type: "appointment_booked",
    config: {},
  },
  steps: [],
};

export default function AutomationEditor() {
  const { teamId, automationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = automationId === "new";

  const [name, setName] = useState("");
  const [definition, setDefinition] = useState<AutomationDefinition>(DEFAULT_DEFINITION);

  // Fetch existing automation
  const { data: automation, isLoading } = useQuery({
    queryKey: ["automation", automationId],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("id", automationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!automationId,
  });

  // Initialize state from fetched data
  useEffect(() => {
    if (automation) {
      setName(automation.name);
      const existingDef = automation.definition as unknown as AutomationDefinition;
      setDefinition({
        ...DEFAULT_DEFINITION,
        ...existingDef,
        id: automation.id,
        teamId: teamId || "",
        name: automation.name,
        description: automation.description || "",
        trigger: existingDef?.trigger || {
          type: automation.trigger_type as TriggerType,
          config: {},
        },
        steps: existingDef?.steps || [],
      });
    } else if (isNew && teamId) {
      setName("New Automation");
      setDefinition({
        ...DEFAULT_DEFINITION,
        id: crypto.randomUUID(),
        teamId,
      });
    }
  }, [automation, isNew, teamId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalDefinition: AutomationDefinition = {
        ...definition,
        teamId: teamId || "",
        name,
      };

      if (!isNew && automation) {
        const { error } = await supabase
          .from("automations")
          .update({
            name,
            trigger_type: finalDefinition.trigger.type,
            definition: finalDefinition as unknown as Record<string, any>,
            updated_at: new Date().toISOString(),
          })
          .eq("id", automation.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("automations")
          .insert({
            team_id: teamId,
            name,
            trigger_type: finalDefinition.trigger.type,
            definition: finalDefinition as unknown as Record<string, any>,
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;
        // Navigate to the new automation's edit page
        if (data && isNew) {
          navigate(`/team/${teamId}/workflows/${data.id}/edit`, { replace: true });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations", teamId] });
      toast.success(isNew ? "Automation created" : "Automation saved");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save");
      console.error(err);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    saveMutation.mutate();
  };

  const handleBack = () => {
    navigate(`/team/${teamId}/workflows`);
  };

  if (isLoading && !isNew) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <AutomationEditorShell
      teamId={teamId || ""}
      definition={definition}
      onChange={setDefinition}
      name={name}
      onNameChange={setName}
      onSave={handleSave}
      onBack={handleBack}
      isSaving={saveMutation.isPending}
      isNew={isNew}
    />
  );
}
