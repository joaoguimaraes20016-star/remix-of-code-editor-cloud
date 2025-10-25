import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InitializeDefaultStagesProps {
  teamId: string;
}

const DEFAULT_STAGES = [
  { stage_id: 'booked', stage_label: 'Appointment Booked', stage_color: '#3b82f6', order_index: 0 },
  { stage_id: 'confirmed', stage_label: 'Confirmed', stage_color: '#8b5cf6', order_index: 1 },
  { stage_id: 'no_show', stage_label: 'No-Show', stage_color: '#f97316', order_index: 2 },
  { stage_id: 'canceled', stage_label: 'Canceled', stage_color: '#6b7280', order_index: 3 },
  { stage_id: 'rescheduled', stage_label: 'Rescheduled', stage_color: '#eab308', order_index: 4 },
  { stage_id: 'deposit', stage_label: 'Deposit Collected', stage_color: '#14b8a6', order_index: 5 },
  { stage_id: 'won', stage_label: 'Closed', stage_color: '#22c55e', order_index: 6 },
  { stage_id: 'disqualified', stage_label: 'Disqualified', stage_color: '#ef4444', order_index: 7 },
];

export function InitializeDefaultStages({ teamId }: InitializeDefaultStagesProps) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeStages();
  }, [teamId]);

  const initializeStages = async () => {
    try {
      // Check if stages already exist
      const { data: existingStages, error: fetchError } = await supabase
        .from('team_pipeline_stages')
        .select('stage_id')
        .eq('team_id', teamId);

      if (fetchError) throw fetchError;

      const existingStageIds = new Set(existingStages?.map(s => s.stage_id) || []);
      
      // Only insert stages that don't exist
      const stagesToInsert = DEFAULT_STAGES.filter(
        stage => !existingStageIds.has(stage.stage_id)
      ).map(stage => ({
        ...stage,
        team_id: teamId,
        is_default: true
      }));

      if (stagesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('team_pipeline_stages')
          .insert(stagesToInsert);

        if (insertError) throw insertError;
        
        console.log(`Initialized ${stagesToInsert.length} default stages`);
      }

      setInitialized(true);
    } catch (error) {
      console.error('Error initializing default stages:', error);
    }
  };

  return null; // This component doesn't render anything
}
