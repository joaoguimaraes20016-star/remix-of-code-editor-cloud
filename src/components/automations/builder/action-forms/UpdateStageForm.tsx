import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { UpdateStageConfig, CrmEntity } from "@/lib/automations/types";

interface PipelineStage {
  id: string;
  stage_id: string;
  stage_label: string;
  order_index: number;
}

interface UpdateStageFormProps {
  config: UpdateStageConfig;
  onChange: (config: UpdateStageConfig) => void;
  teamId: string;
}

export function UpdateStageForm({ config, onChange, teamId }: UpdateStageFormProps) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("team_pipeline_stages")
          .select("id, stage_id, stage_label, order_index")
          .eq("team_id", teamId)
          .order("order_index", { ascending: true });

        if (error) throw error;
        setStages(data || []);
      } catch (err) {
        console.error("Failed to load pipeline stages:", err);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      loadStages();
    }
  }, [teamId]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Entity Type</Label>
        <Select
          value={config.entity || "lead"}
          onValueChange={(value: CrmEntity) =>
            onChange({ ...config, entity: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="deal">Deal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Move To Stage</Label>
        {loading ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pipeline stages...
          </div>
        ) : stages.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
            No pipeline stages found. Create stages in your pipeline settings.
          </p>
        ) : (
          <Select
            value={config.stageId || ""}
            onValueChange={(value) => onChange({ ...config, stageId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.stage_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">
          The {config.entity || "lead"} will be moved to this pipeline stage
        </p>
      </div>
    </div>
  );
}
