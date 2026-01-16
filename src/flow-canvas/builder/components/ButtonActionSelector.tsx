/**
 * ButtonActionSelector - UNIFIED action selector for ALL buttons
 * 
 * DESIGN PHILOSOPHY:
 * - "Continue to next step" is the DEFAULT behavior, NOT a selectable action
 * - Users only see EXPLICIT actions they can choose
 * - No internal flow mechanics exposed to users
 * 
 * Internally: unset action → intent: NEXT_VISIBLE_STEP (automatic)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Layers,
  Send,
  ExternalLink,
  Hash,
  Phone,
  Mail,
  Download,
  ArrowRight,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════
// ACTION TYPES - Internal representation
// ═══════════════════════════════════════════════════════════════

export type ButtonActionType = 
  | 'next-step'      // Internal default - NOT shown in UI
  | 'go-to-step'
  | 'submit'
  | 'url'
  | 'scroll'
  | 'phone'
  | 'email'
  | 'download';

export interface ButtonAction {
  type: ButtonActionType;
  value?: string;
  openNewTab?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// VISIBLE ACTION DEFINITIONS - Only what users can explicitly choose
// ═══════════════════════════════════════════════════════════════

interface ActionDefinition {
  type: ButtonActionType;
  label: string;
  icon: React.ReactNode;
  category: 'flow' | 'external';
  requiresValue?: boolean;
  valueLabel?: string;
  valuePlaceholder?: string;
}

// Only EXPLICIT actions - "next-step" is NOT listed (it's the default)
const VISIBLE_ACTIONS: ActionDefinition[] = [
  // Flow actions - explicit navigation
  { type: 'go-to-step', label: 'Go to step', icon: <Layers className="w-3.5 h-3.5" />, category: 'flow', requiresValue: true, valueLabel: 'Target Step' },
  { type: 'submit', label: 'Submit form', icon: <Send className="w-3.5 h-3.5" />, category: 'flow' },
  
  // External actions
  { type: 'url', label: 'Open link', icon: <ExternalLink className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'URL', valuePlaceholder: 'https://...' },
  { type: 'scroll', label: 'Scroll to', icon: <Hash className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'Section ID', valuePlaceholder: '#section' },
  { type: 'phone', label: 'Call', icon: <Phone className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'Phone', valuePlaceholder: '+1234567890' },
  { type: 'email', label: 'Email', icon: <Mail className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'Email', valuePlaceholder: 'hello@example.com' },
  { type: 'download', label: 'Download', icon: <Download className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'File URL', valuePlaceholder: 'https://...' },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════

interface ButtonActionSelectorProps {
  /** Current action - undefined means "continue flow" (default) */
  action: ButtonAction | undefined;
  /** Called when action changes */
  onChange: (action: ButtonAction | undefined) => void;
  /** Available steps for "Go To Step" action */
  availableSteps?: { id: string; name: string }[];
  /** Compact mode for smaller UI */
  compact?: boolean;
  /** Show only flow actions (hide external) */
  flowOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const ButtonActionSelector: React.FC<ButtonActionSelectorProps> = ({
  action,
  onChange,
  availableSteps = [],
  compact = false,
  flowOnly = false,
}) => {
  // Check if user has an explicit action set (anything other than next-step)
  const hasExplicitAction = action && action.type !== 'next-step';
  const currentType = action?.type;
  const currentValue = action?.value || '';
  const openNewTab = action?.openNewTab ?? false;

  const handleSelectAction = (type: ButtonActionType) => {
    onChange({ type, value: '', openNewTab: type === 'url' ? false : undefined });
  };

  const handleClearAction = () => {
    // Clear to undefined = default "continue flow" behavior
    onChange(undefined);
  };

  const handleValueChange = (value: string) => {
    if (currentType) {
      onChange({ type: currentType, value, openNewTab: currentType === 'url' ? openNewTab : undefined });
    }
  };

  const handleNewTabChange = (checked: boolean) => {
    if (currentType) {
      onChange({ type: currentType, value: currentValue, openNewTab: checked });
    }
  };

  const flowActions = VISIBLE_ACTIONS.filter(a => a.category === 'flow');
  const externalActions = VISIBLE_ACTIONS.filter(a => a.category === 'external');
  const currentDefinition = VISIBLE_ACTIONS.find(a => a.type === currentType);

  return (
    <div className="space-y-3">
      {/* Default State - No explicit action */}
      {!hasExplicitAction && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-muted/40 border border-border/40">
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Continues to next step</span>
        </div>
      )}

      {/* Explicit Action Display */}
      {hasExplicitAction && currentDefinition && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md bg-primary/10 border border-primary/20">
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
            {currentDefinition.icon}
            {currentDefinition.label}
          </span>
          <button
            type="button"
            onClick={handleClearAction}
            className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Reset to default"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Selector Grid */}
      <div className="space-y-2">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {hasExplicitAction ? 'Change action' : 'Add action'}
        </Label>
        
        {/* Flow Actions */}
        <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-2")}>
          {flowActions.map((actionDef) => (
            <button
              key={actionDef.type}
              type="button"
              onClick={() => handleSelectAction(actionDef.type)}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                currentType === actionDef.type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {actionDef.icon}
              {actionDef.label}
            </button>
          ))}
        </div>

        {/* External Actions */}
        {!flowOnly && externalActions.length > 0 && (
          <div className={cn("grid gap-1", compact ? "grid-cols-3" : "grid-cols-5")}>
            {externalActions.map((actionDef) => (
              <button
                key={actionDef.type}
                type="button"
                onClick={() => handleSelectAction(actionDef.type)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded text-[10px] transition-colors",
                  currentType === actionDef.type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {actionDef.icon}
                <span className="truncate">{actionDef.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Value Input - For actions that require configuration */}
      {currentDefinition?.requiresValue && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          {currentType === 'go-to-step' ? (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Target Step</Label>
              <Select value={currentValue} onValueChange={handleValueChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select step..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSteps.map((step) => (
                    <SelectItem key={step.id} value={step.id} className="text-xs">
                      {step.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{currentDefinition.valueLabel}</Label>
              <Input
                value={currentValue}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder={currentDefinition.valuePlaceholder}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Open in new tab toggle for URL action */}
          {currentType === 'url' && (
            <div className="flex items-center justify-between py-1">
              <Label className="text-[10px] text-muted-foreground">Open in new tab</Label>
              <Switch checked={openNewTab} onCheckedChange={handleNewTabChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ButtonActionSelector;
