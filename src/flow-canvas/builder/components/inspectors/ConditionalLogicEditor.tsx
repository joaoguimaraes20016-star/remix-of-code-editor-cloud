import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface VisibilityCondition {
  id: string;
  fieldKey: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

interface ConditionalLogicEditorProps {
  conditions: VisibilityCondition[];
  onUpdate: (conditions: VisibilityCondition[]) => void;
  availableFields?: Array<{ key: string; label: string }>;
  className?: string;
}

const operatorLabels: Record<VisibilityCondition['operator'], string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  greater_than: 'is greater than',
  less_than: 'is less than',
};

const generateId = () => `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const ConditionalLogicEditor: React.FC<ConditionalLogicEditorProps> = ({
  conditions = [],
  onUpdate,
  availableFields = [],
  className,
}) => {
  const addCondition = () => {
    const newCondition: VisibilityCondition = {
      id: generateId(),
      fieldKey: '',
      operator: 'equals',
      value: '',
    };
    onUpdate([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<VisibilityCondition>) => {
    const newConditions = conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    onUpdate(newConditions);
  };

  const removeCondition = (id: string) => {
    onUpdate(conditions.filter(c => c.id !== id));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-builder-text-muted" />
          <Label className="text-xs font-medium text-builder-text">
            Conditional Logic
          </Label>
        </div>
      </div>

      {/* Info text */}
      <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <p className="text-[10px] text-amber-700 dark:text-amber-300">
          Show this element only when conditions are met
        </p>
      </div>

      {/* Conditions List */}
      {conditions.length > 0 ? (
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <div
              key={condition.id}
              className="p-3 rounded-lg border border-builder-border bg-builder-surface space-y-2"
            >
              {index > 0 && (
                <div className="text-[10px] font-medium text-builder-text-muted uppercase tracking-wide mb-2">
                  AND
                </div>
              )}

              {/* Field Key */}
              <div className="space-y-1">
                <Label className="text-[10px] text-builder-text-muted">Field</Label>
                {availableFields.length > 0 ? (
                  <Select
                    value={condition.fieldKey}
                    onValueChange={(value) => updateCondition(condition.id, { fieldKey: value })}
                  >
                    <SelectTrigger className="h-7 text-xs bg-builder-surface border-builder-border">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent className="bg-builder-surface border-builder-border">
                      {availableFields.map(field => (
                        <SelectItem key={field.key} value={field.key} className="text-xs">
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={condition.fieldKey}
                    onChange={(e) => updateCondition(condition.id, { fieldKey: e.target.value })}
                    placeholder="field_key"
                    className="h-7 text-xs bg-builder-surface border-builder-border"
                  />
                )}
              </div>

              {/* Operator */}
              <div className="space-y-1">
                <Label className="text-[10px] text-builder-text-muted">Operator</Label>
                <Select
                  value={condition.operator}
                  onValueChange={(value: VisibilityCondition['operator']) => 
                    updateCondition(condition.id, { operator: value })
                  }
                >
                  <SelectTrigger className="h-7 text-xs bg-builder-surface border-builder-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-builder-surface border-builder-border">
                    {Object.entries(operatorLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              <div className="space-y-1">
                <Label className="text-[10px] text-builder-text-muted">Value</Label>
                <Input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                  placeholder="Enter value"
                  className="h-7 text-xs bg-builder-surface border-builder-border"
                />
              </div>

              {/* Delete button */}
              <button
                onClick={() => removeCondition(condition.id)}
                className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-600 mt-2"
              >
                <Trash2 className="w-3 h-3" />
                Remove condition
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-builder-text-muted">
          No conditions set. This element will always be visible.
        </div>
      )}

      {/* Add Condition Button */}
      <button
        onClick={addCondition}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
          'border border-dashed border-builder-border hover:border-builder-accent',
          'text-xs text-builder-text-muted hover:text-builder-accent',
          'transition-colors'
        )}
      >
        <Plus className="w-3 h-3" />
        Add Condition
      </button>
    </div>
  );
};
