import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, Save, Plus } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorUtils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FollowUpCard } from '@/components/task-flow/FollowUpCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowUpFlowConfig {
  id?: string;
  team_id: string;
  pipeline_stage: string;
  sequence: number;
  label: string;
  hours_after: number;
  assigned_role: string;
  enabled: boolean;
}

interface FollowUpSettingsProps {
  teamId: string;
}

const STAGE_LABELS: Record<string, string> = {
  no_show: 'No Show',
  canceled: 'Cancelled',
  disqualified: 'Disqualified',
};

export function FollowUpSettings({ teamId }: FollowUpSettingsProps) {
  const { toast } = useToast();
  const [flowConfigs, setFlowConfigs] = useState<FollowUpFlowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({
    no_show: true,
    canceled: false,
    disqualified: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSettings();
  }, [teamId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('team_follow_up_flow_config')
        .select('*')
        .eq('team_id', teamId)
        .order('pipeline_stage, sequence');

      if (error) throw error;

      setFlowConfigs(data || []);
    } catch (error) {
      toast({
        title: 'Error loading settings',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStageConfigs = (stage: string) => {
    return flowConfigs.filter(c => c.pipeline_stage === stage);
  };

  const updateConfig = (id: string, field: string, value: any) => {
    setFlowConfigs(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addFollowUp = (stage: string) => {
    const stageConfigs = getStageConfigs(stage);
    const nextSequence = stageConfigs.length + 1;
    
    const newConfig: FollowUpFlowConfig = {
      team_id: teamId,
      pipeline_stage: stage,
      sequence: nextSequence,
      label: `Follow-Up #${nextSequence}`,
      hours_after: 24,
      assigned_role: 'setter',
      enabled: true,
    };

    setFlowConfigs(prev => [...prev, newConfig]);
  };

  const removeFollowUp = (id: string) => {
    setFlowConfigs(prev => prev.filter(c => c.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent, stage: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const stageConfigs = getStageConfigs(stage);
    const oldIndex = stageConfigs.findIndex(c => c.id === active.id);
    const newIndex = stageConfigs.findIndex(c => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(stageConfigs, oldIndex, newIndex);
    
    // Update sequences
    const updatedConfigs = reordered.map((config, index) => ({
      ...config,
      sequence: index + 1,
    }));

    // Replace configs for this stage
    setFlowConfigs(prev => [
      ...prev.filter(c => c.pipeline_stage !== stage),
      ...updatedConfigs,
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete removed configs
      const existingIds = flowConfigs.filter(c => c.id).map(c => c.id);
      
      // Upsert all configs
      for (const config of flowConfigs) {
        const { error } = await supabase
          .from('team_follow_up_flow_config')
          .upsert({
            id: config.id,
            team_id: teamId,
            pipeline_stage: config.pipeline_stage,
            sequence: config.sequence,
            label: config.label,
            hours_after: config.hours_after,
            assigned_role: config.assigned_role,
            enabled: config.enabled,
          });

        if (error) throw error;
      }

      toast({
        title: 'Settings saved',
        description: 'Follow-up flow configurations have been updated successfully',
      });

      loadSettings(); // Reload to get IDs
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  const renderStageSection = (stage: string, stageLabel: string) => {
    const stageConfigs = getStageConfigs(stage).sort((a, b) => a.sequence - b.sequence);
    const isOpen = openStages[stage];

    return (
      <Collapsible
        key={stage}
        open={isOpen}
        onOpenChange={(open) => setOpenStages(prev => ({ ...prev, [stage]: open }))}
        className="border rounded-lg"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "transform rotate-180"
              )} />
              <h3 className="font-semibold text-lg">{stageLabel}</h3>
              <span className="text-sm text-muted-foreground">
                ({stageConfigs.length} follow-up{stageConfigs.length !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 pt-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEnd(event, stage)}
            >
              <SortableContext
                items={stageConfigs.map(c => c.id || `temp-${c.sequence}`)}
                strategy={verticalListSortingStrategy}
              >
                {stageConfigs.map((config) => (
                  <FollowUpCard
                    key={config.id || `temp-${config.sequence}`}
                    id={config.id || `temp-${config.sequence}`}
                    sequence={config.sequence}
                    label={config.label}
                    hoursAfter={config.hours_after}
                    assignedRole={config.assigned_role}
                    enabled={config.enabled}
                    stage={stage}
                    onUpdate={(field, value) => updateConfig(config.id || `temp-${config.sequence}`, field, value)}
                    onRemove={() => removeFollowUp(config.id || `temp-${config.sequence}`)}
                    canRemove={stageConfigs.length > 1}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => addFollowUp(stage)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-Up Attempt
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Follow-Up Flow Configuration
        </CardTitle>
        <CardDescription>
          Configure multiple follow-up attempts for each pipeline stage with precise timing in hours. Create sophisticated follow-up sequences that automatically progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderStageSection('no_show', 'No Show Follow-Ups')}
        {renderStageSection('canceled', 'Canceled Follow-Ups')}
        {renderStageSection('disqualified', 'Disqualified Follow-Ups')}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Follow-Up Flow'}
        </Button>
      </CardContent>
    </Card>
  );
}
