import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, GitBranch } from "lucide-react";
import type { AutomationCondition, ConditionOperator } from "@/lib/automations/types";

interface ConditionConfig {
  conditions: AutomationCondition[];
  conditionLogic: 'AND' | 'OR';
}

interface ConditionFormProps {
  config: ConditionConfig;
  onChange: (config: ConditionConfig) => void;
}

const FIELD_OPTIONS = [
  { value: 'lead.email', label: 'Lead Email' },
  { value: 'lead.name', label: 'Lead Name' },
  { value: 'lead.phone', label: 'Lead Phone' },
  { value: 'lead.source', label: 'Lead Source' },
  { value: 'lead.tags', label: 'Lead Tags' },
  { value: 'appointment.status', label: 'Appointment Status' },
  { value: 'deal.value', label: 'Deal Value' },
  { value: 'deal.stage', label: 'Deal Stage' },
];

const OPERATOR_OPTIONS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'tag_present', label: 'Has tag' },
  { value: 'tag_absent', label: 'Does not have tag' },
];

export function ConditionForm({ config, onChange }: ConditionFormProps) {
  const conditions = config.conditions || [];
  const conditionLogic = config.conditionLogic || 'AND';

  const addCondition = () => {
    onChange({
      ...config,
      conditions: [
        ...conditions,
        { id: crypto.randomUUID(), field: '', operator: 'equals', value: '' },
      ],
    });
  };

  const updateCondition = (index: number, update: Partial<AutomationCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...update };
    onChange({ ...config, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    onChange({
      ...config,
      conditions: conditions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <GitBranch className="h-5 w-5 text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">
              Branch the workflow based on conditions.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              If conditions are met → True path, otherwise → False path
            </p>
          </div>
        </div>
      </div>

      {conditions.length > 1 && (
        <div className="flex items-center gap-2">
          <Label className="text-foreground/70">Match</Label>
          <Select
            value={conditionLogic}
            onValueChange={(value) => onChange({ ...config, conditionLogic: value as 'AND' | 'OR' })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">ALL</SelectItem>
              <SelectItem value="OR">ANY</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">of these conditions</span>
        </div>
      )}

      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div key={condition.id || index} className="p-3 rounded-lg bg-muted/30 border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Select
                value={condition.field}
                onValueChange={(value) => updateCondition(index, { field: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(index)}
                className="shrink-0 text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={condition.operator as string}
                onValueChange={(value) => updateCondition(index, { operator: value as ConditionOperator })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!['is_empty', 'is_not_empty'].includes(condition.operator as string) && (
                <Input
                  placeholder="Value"
                  value={String(condition.value || '')}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                />
              )}
            </div>

            {index < conditions.length - 1 && (
              <div className="text-center text-xs text-muted-foreground uppercase">
                {conditionLogic}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addCondition} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Condition
      </Button>
    </div>
  );
}
