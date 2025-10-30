import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap, Filter, Play, Trash2, Edit, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface WorkflowRule {
  id: string;
  rule_name: string;
  trigger_event: string;
  trigger_conditions: any;
  action_type: string;
  action_config: any;
  is_active: boolean;
}

interface WorkflowBuilderProps {
  teamId: string;
  rules: WorkflowRule[];
  onRulesChange: () => void;
}

const TRIGGER_EVENTS = [
  { value: "appointment_created", label: "New Appointment Booked", icon: "📅" },
  { value: "appointment_confirmed", label: "Appointment Confirmed", icon: "✅" },
  { value: "appointment_rescheduled", label: "Appointment Rescheduled", icon: "🔄" },
  { value: "appointment_cancelled", label: "Appointment Cancelled", icon: "❌" },
  { value: "deal_closed", label: "Deal Closed", icon: "💰" },
  { value: "deal_stage_changed", label: "Pipeline Stage Changed", icon: "📊" },
  { value: "task_completed", label: "Task Completed", icon: "✓" },
];

const ACTION_TYPES = [
  { value: "create_task", label: "Create Task", icon: "📋" },
  { value: "send_notification", label: "Send Notification", icon: "🔔" },
  { value: "assign_to_user", label: "Assign to User", icon: "👤" },
  { value: "update_stage", label: "Move Pipeline Stage", icon: "➡️" },
  { value: "add_tag", label: "Add Tag", icon: "🏷️" },
];

export function WorkflowBuilder({ teamId, rules, onRulesChange }: WorkflowBuilderProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  
  // Form state
  const [ruleName, setRuleName] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("");
  const [actionType, setActionType] = useState("");
  const [conditions, setConditions] = useState("");
  const [actionConfig, setActionConfig] = useState("");

  const resetForm = () => {
    setRuleName("");
    setTriggerEvent("");
    setActionType("");
    setConditions("");
    setActionConfig("");
    setEditingRule(null);
  };

  const handleCreateRule = async () => {
    if (!ruleName || !triggerEvent || !actionType) {
      toast({
        title: "Missing fields",
        description: "Please fill in rule name, trigger, and action",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("team_automation_rules").insert({
        team_id: teamId,
        rule_name: ruleName,
        trigger_event: triggerEvent,
        trigger_conditions: conditions ? JSON.parse(conditions) : {},
        action_type: actionType,
        action_config: actionConfig ? JSON.parse(actionConfig) : {},
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Workflow created",
        description: "Your custom workflow is now active",
      });

      resetForm();
      setIsCreating(false);
      onRulesChange();
    } catch (error: any) {
      toast({
        title: "Error creating workflow",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("team_automation_rules")
        .update({ is_active: !isActive })
        .eq("id", ruleId);

      if (error) throw error;

      toast({
        title: isActive ? "Workflow paused" : "Workflow activated",
        description: `Workflow is now ${!isActive ? "active" : "paused"}`,
      });

      onRulesChange();
    } catch (error: any) {
      toast({
        title: "Error updating workflow",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from("team_automation_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;

      toast({
        title: "Workflow deleted",
        description: "The workflow has been removed",
      });

      onRulesChange();
    } catch (error: any) {
      toast({
        title: "Error deleting workflow",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Workflows */}
      <div className="grid gap-4">
        {rules.map((rule) => {
          const trigger = TRIGGER_EVENTS.find((t) => t.value === rule.trigger_event);
          const action = ACTION_TYPES.find((a) => a.value === rule.action_type);
          
          return (
            <Card key={rule.id} className={`border-l-4 ${rule.is_active ? 'border-l-primary' : 'border-l-muted'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                      {rule.is_active ? (
                        <Badge variant="default" className="gap-1">
                          <Play className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Paused</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                        <Zap className="h-3 w-3" />
                        {trigger?.icon} {trigger?.label || rule.trigger_event}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                        <Play className="h-3 w-3" />
                        {action?.icon} {action?.label || rule.action_type}
                      </span>
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Create New Workflow Button */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2" size="lg" variant="outline">
            <Plus className="h-5 w-5" />
            Create Custom Workflow
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Build Your Workflow
            </DialogTitle>
            <DialogDescription>
              Create automated actions triggered by specific events
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Rule Name */}
            <div className="space-y-2">
              <Label htmlFor="rule-name">Workflow Name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Auto-assign hot leads"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
              />
            </div>

            {/* Trigger Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                When this happens...
              </Label>
              <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger event" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.icon} {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditions (Optional) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                If these conditions match... (Optional)
              </Label>
              <Textarea
                placeholder='{"status": "confirmed", "lead_source": "website"}'
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="font-mono text-xs"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                JSON format. Leave empty to run on all events.
              </p>
            </div>

            {/* Action Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Then do this...
              </Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.icon} {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Config */}
            <div className="space-y-2">
              <Label>Action Configuration</Label>
              <Textarea
                placeholder='{"message": "New lead assigned!", "user_id": "..."}'
                value={actionConfig}
                onChange={(e) => setActionConfig(e.target.value)}
                className="font-mono text-xs"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                JSON configuration for the action. Customize behavior here.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Create Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {rules.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom workflow to automate your sales process
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
