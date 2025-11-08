import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorUtils';

interface FollowUpSettingsProps {
  teamId: string;
}

const STAGES = [
  { value: 'no_show', label: 'No Show' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'disqualified', label: 'Disqualified' },
];

export function FollowUpSettings({ teamId }: FollowUpSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, { days: number; role: string }>>({
    no_show: { days: 1, role: 'setter' },
    canceled: { days: 2, role: 'setter' },
    disqualified: { days: 7, role: 'setter' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [teamId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('team_follow_up_flow_config')
        .select('*')
        .eq('team_id', teamId)
        .eq('sequence', 1);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedSettings: Record<string, { days: number; role: string }> = {};
        data.forEach(config => {
          loadedSettings[config.pipeline_stage] = {
            days: Math.round(config.hours_after / 24),
            role: config.assigned_role,
          };
        });
        setSettings(prev => ({ ...prev, ...loadedSettings }));
      }
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

  const updateSetting = (stage: string, field: 'days' | 'role', value: number | string) => {
    setSettings(prev => ({
      ...prev,
      [stage]: { ...prev[stage], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configs = Object.entries(settings).map(([stage, config]) => ({
        team_id: teamId,
        pipeline_stage: stage,
        sequence: 1,
        label: 'Follow-Up',
        hours_after: config.days * 24,
        assigned_role: config.role,
        enabled: true,
      }));

      const { error } = await supabase
        .from('team_follow_up_flow_config')
        .upsert(configs, {
          onConflict: 'team_id,pipeline_stage,sequence',
        });

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Follow-up settings updated successfully',
      });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-Up Settings</CardTitle>
        <CardDescription>
          Configure when follow-up tasks are created after stage changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {STAGES.map(stage => (
          <div key={stage.value} className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">{stage.label}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Days After</Label>
                <Select
                  value={settings[stage.value].days.toString()}
                  onValueChange={(value) => updateSetting(stage.value, 'days', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select
                  value={settings[stage.value].role}
                  onValueChange={(value) => updateSetting(stage.value, 'role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setter">Setter</SelectItem>
                    <SelectItem value="closer">Closer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
