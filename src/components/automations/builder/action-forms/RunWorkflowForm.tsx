import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RunWorkflowConfig {
  workflowId: string;
  passContext: boolean;
}

interface RunWorkflowFormProps {
  config: RunWorkflowConfig;
  onChange: (config: RunWorkflowConfig) => void;
  teamId?: string;
}

export function RunWorkflowForm({ config, onChange, teamId }: RunWorkflowFormProps) {
  const { data: workflows } = useQuery({
    queryKey: ['automations', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from('automations')
        .select('id, name')
        .eq('team_id', teamId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!teamId,
  });

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
        <div className="flex items-start gap-3">
          <PlayCircle className="h-5 w-5 text-fuchsia-400 mt-0.5" />
          <div>
            <p className="text-sm text-white/80">
              Trigger another automation workflow from this one.
            </p>
            <p className="text-xs text-white/50 mt-1">
              Great for reusable sequences like onboarding or notifications.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Select Workflow</Label>
        <Select
          value={config.workflowId || ""}
          onValueChange={(value) => onChange({ ...config, workflowId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a workflow" />
          </SelectTrigger>
          <SelectContent>
            {workflows?.map((workflow) => (
              <SelectItem key={workflow.id} value={workflow.id}>
                {workflow.name}
              </SelectItem>
            ))}
            {(!workflows || workflows.length === 0) && (
              <SelectItem value="" disabled>
                No active workflows found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Pass Context Data</Label>
          <p className="text-xs text-muted-foreground">
            Share lead/appointment data with the triggered workflow
          </p>
        </div>
        <Switch
          checked={config.passContext ?? true}
          onCheckedChange={(checked) => onChange({ ...config, passContext: checked })}
        />
      </div>
    </div>
  );
}
