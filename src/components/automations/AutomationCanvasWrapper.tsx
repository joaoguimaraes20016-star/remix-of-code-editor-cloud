import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AutomationCanvas } from "./canvas/AutomationCanvas";
import type { AutomationDefinition, TriggerType } from "@/lib/automations/types";
import { AnimatePresence } from "framer-motion";

interface AutomationCanvasWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  automation?: {
    id: string;
    name: string;
    description: string | null;
    trigger_type: string;
    definition: Record<string, any>;
  } | null;
}

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

export function AutomationCanvasWrapper({
  open,
  onOpenChange,
  teamId,
  automation,
}: AutomationCanvasWrapperProps) {
  const queryClient = useQueryClient();
  const isEditing = !!automation;

  const [name, setName] = useState("");
  const [definition, setDefinition] = useState<AutomationDefinition>(DEFAULT_DEFINITION);

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      const existingDef = automation.definition as AutomationDefinition;
      setDefinition({
        ...DEFAULT_DEFINITION,
        ...existingDef,
        id: automation.id,
        teamId,
        name: automation.name,
        description: automation.description || "",
        trigger: existingDef?.trigger || {
          type: automation.trigger_type as TriggerType,
          config: {},
        },
        steps: existingDef?.steps || [],
      });
    } else {
      setName("");
      setDefinition({
        ...DEFAULT_DEFINITION,
        id: crypto.randomUUID(),
        teamId,
      });
    }
  }, [automation, open, teamId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalDefinition: AutomationDefinition = {
        ...definition,
        id: automation?.id || definition.id,
        teamId,
        name,
        description: "",
      };

      if (isEditing && automation) {
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
        const { error } = await supabase.from("automations").insert({
          team_id: teamId,
          name,
          trigger_type: finalDefinition.trigger.type,
          definition: finalDefinition as unknown as Record<string, any>,
          is_active: true,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations", teamId] });
      toast.success(isEditing ? "Automation updated" : "Automation created");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save automation");
      console.error(err);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (definition.steps.length === 0) {
      toast.error("Add at least one action step");
      return;
    }
    saveMutation.mutate();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <AutomationCanvas
        teamId={teamId}
        definition={definition}
        onChange={setDefinition}
        onSave={handleSave}
        onClose={() => onOpenChange(false)}
        isSaving={saveMutation.isPending}
        name={name}
        onNameChange={setName}
      />
    </AnimatePresence>
  );
}
