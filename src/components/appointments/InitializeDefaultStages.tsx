import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InitializeDefaultStagesProps {
  teamId: string;
}

// Semantic stage colors using HSL values that match design system
const STAGE_COLORS = {
  primary: 'hsl(217, 91%, 60%)',      // Primary blue - booked
  warning: 'hsl(24, 94%, 53%)',        // Orange - no show
  muted: 'hsl(220, 9%, 46%)',          // Gray - canceled
  amber: 'hsl(45, 93%, 47%)',          // Yellow - rescheduled
  teal: 'hsl(173, 80%, 40%)',          // Teal - deposit
  success: 'hsl(142, 71%, 45%)',       // Green - won
  destructive: 'hsl(0, 84%, 60%)',     // Red - disqualified
} as const;

const DEFAULT_STAGES = [
  { stage_id: 'booked', stage_label: 'Appointment Booked', stage_color: STAGE_COLORS.primary, order_index: 0 },
  { stage_id: 'no_show', stage_label: 'No-Show', stage_color: STAGE_COLORS.warning, order_index: 1 },
  { stage_id: 'canceled', stage_label: 'Canceled', stage_color: STAGE_COLORS.muted, order_index: 2 },
  { stage_id: 'rescheduled', stage_label: 'Rescheduled', stage_color: STAGE_COLORS.amber, order_index: 3 },
  { stage_id: 'deposit', stage_label: 'Deposit Collected', stage_color: STAGE_COLORS.teal, order_index: 4 },
  { stage_id: 'won', stage_label: 'Closed', stage_color: STAGE_COLORS.success, order_index: 5 },
  { stage_id: 'disqualified', stage_label: 'Disqualified', stage_color: STAGE_COLORS.destructive, order_index: 6 },
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
        .select('*')
        .eq('team_id', teamId);

      if (fetchError) throw fetchError;

      // Update existing stages that need label corrections or removal
      const stagesToUpdate = existingStages?.filter(stage => {
        if (stage.stage_label === 'Closed Won') return true;
        if (stage.stage_label === 'Closed Lost') return true;
        if (stage.stage_id === 'confirmed') return true;
        if (stage.stage_id === 'new') return true; // Remove 'new' stage
        if (stage.stage_label === 'New Leads') return true;
        if (stage.stage_label === 'Confirmed') return true;
        if (stage.stage_label === 'Contacted') return true;
        return false;
      }) || [];

      for (const stage of stagesToUpdate) {
        if (stage.stage_label === 'Closed Won') {
          await supabase
            .from('team_pipeline_stages')
            .update({ stage_label: 'Closed' })
            .eq('id', stage.id);
        } else if (stage.stage_label === 'Closed Lost' || stage.stage_id === 'confirmed' || stage.stage_id === 'new' || stage.stage_label === 'New Leads' || stage.stage_label === 'Confirmed' || stage.stage_label === 'Contacted') {
          // Delete these stages and move appointments to "booked"
          await supabase
            .from('appointments')
            .update({ pipeline_stage: 'booked' })
            .eq('team_id', teamId)
            .eq('pipeline_stage', stage.stage_id);
          
          await supabase
            .from('team_pipeline_stages')
            .delete()
            .eq('id', stage.id);
        }
      }

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

      if (stagesToUpdate.length > 0) {
        console.log(`Updated ${stagesToUpdate.length} stage labels`);
      }

      setInitialized(true);
    } catch (error) {
      console.error('Error initializing default stages:', error);
    }
  };

  return null; // This component doesn't render anything
}
