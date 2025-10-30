import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorUtils";
import { Loader2, Zap } from "lucide-react";
import { WorkflowBuilder } from "./workflows/WorkflowBuilder";

interface WorkflowSettingsProps {
  teamId: string;
}

export function WorkflowSettings({ teamId }: WorkflowSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoCreateTasks, setAutoCreateTasks] = useState(true);
  const [automationRules, setAutomationRules] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadAutomationRules();
  }, [teamId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("auto_create_tasks")
        .eq("id", teamId)
        .single();

      if (error) throw error;
      if (data) {
        setAutoCreateTasks(data.auto_create_tasks ?? true);
      }
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAutomationRules = async () => {
    try {
      const { data, error } = await supabase
        .from("team_automation_rules")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAutomationRules(data || []);
    } catch (error: any) {
      console.error("Error loading automation rules:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update({ auto_create_tasks: autoCreateTasks })
        .eq("id", teamId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Workflow settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Basic Workflow Settings
          </CardTitle>
          <CardDescription>
            Core automation settings for your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="auto-tasks" className="text-base font-medium">
                Auto-create confirmation tasks
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, new appointments automatically create confirmation tasks for setters. 
                Disable this if your offer doesn't need call confirmations.
              </p>
            </div>
            <Switch
              id="auto-tasks"
              checked={autoCreateTasks}
              onCheckedChange={setAutoCreateTasks}
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Workflows */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Custom Workflows
          </CardTitle>
          <CardDescription>
            Build automated workflows with triggers, conditions, and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowBuilder
            teamId={teamId}
            rules={automationRules}
            onRulesChange={loadAutomationRules}
          />
        </CardContent>
      </Card>
    </div>
  );
}
