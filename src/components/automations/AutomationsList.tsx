import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { AutomationCard } from "./AutomationCard";
import type { TriggerType } from "@/lib/automations/types";

interface AutomationsListProps {
  teamId: string;
}

interface Automation {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  is_active: boolean;
  definition: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_run_at: string | null;
}

export function AutomationsList({ teamId }: AutomationsListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: automations, isLoading } = useQuery({
    queryKey: ["automations", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Automation[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("automations")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations", teamId] });
      toast.success("Automation updated");
    },
    onError: (err) => {
      toast.error("Failed to update automation");
      console.error(err);
    },
  });

  const handleEdit = (automation: Automation) => {
    navigate(`/team/${teamId}/workflows/${automation.id}/edit`);
  };

  const handleCreate = () => {
    navigate(`/team/${teamId}/workflows/new/edit`);
  };

  const getStepsCount = (automation: Automation): number => {
    return automation.definition?.steps?.length || 0;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!automations?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">No automations yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Create your first automation using the prompt above or click the button below
          </p>
        </div>
        <Button onClick={handleCreate} className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-foreground">Your Automations</h3>
          <p className="text-sm text-muted-foreground">
            {automations.length} automation{automations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((automation, index) => (
          <motion.div
            key={automation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <AutomationCard
              id={automation.id}
              name={automation.name}
              description={automation.description}
              triggerType={automation.trigger_type as TriggerType}
              isActive={automation.is_active}
              stepsCount={getStepsCount(automation)}
              lastRun={automation.last_run_at}
              onToggle={(isActive) =>
                toggleMutation.mutate({ id: automation.id, isActive })
              }
              onEdit={() => handleEdit(automation)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
