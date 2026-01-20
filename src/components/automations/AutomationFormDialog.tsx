import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AutomationVisualBuilder } from "./builder/AutomationVisualBuilder";
import type { AutomationDefinition, TriggerType } from "@/lib/automations/types";

interface AutomationFormDialogProps {
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

export function AutomationFormDialog({
  open,
  onOpenChange,
  teamId,
  automation,
}: AutomationFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!automation;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [definition, setDefinition] = useState<AutomationDefinition>(DEFAULT_DEFINITION);

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setDescription(automation.description || "");
      // Parse existing definition or create default
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
      setDescription("");
      setDefinition({
        ...DEFAULT_DEFINITION,
        id: crypto.randomUUID(),
        teamId,
      });
    }
  }, [automation, open, teamId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Build the complete definition
      const finalDefinition: AutomationDefinition = {
        ...definition,
        id: automation?.id || definition.id,
        teamId,
        name,
        description,
      };

      if (isEditing && automation) {
        const { error } = await supabase
          .from("automations")
          .update({
            name,
            description,
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
          description,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Automation" : "New Automation"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome SMS for new appointments"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this automation do?"
                rows={2}
              />
            </div>
          </div>

          {/* Visual Builder */}
          <AutomationVisualBuilder
            teamId={teamId}
            value={definition}
            onChange={setDefinition}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
