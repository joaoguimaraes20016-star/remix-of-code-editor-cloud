/**
 * ButtonActionSelector - UNIFIED action selector for ALL buttons
 * 
 * ONE component, ONE action model, used everywhere.
 * No "(auto)" labels - all actions are explicitly visible.
 * 
 * DEFAULT BEHAVIOR:
 * - If action is unset and button is inside a flow → defaults to "Next Step"
 * - But this is ALWAYS shown explicitly in the UI
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Layers,
  Send,
  ExternalLink,
  Hash,
  Phone,
  Mail,
  Download,
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

// ═══════════════════════════════════════════════════════════════
// ACTION TYPES - Single source of truth
// ═══════════════════════════════════════════════════════════════

export type ButtonActionType = 
  | 'next-step'
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
// ACTION DEFINITIONS - Labels and icons
// ═══════════════════════════════════════════════════════════════

interface ActionDefinition {
  type: ButtonActionType;
  label: string;
  icon: React.ReactNode;
  category: 'primary' | 'navigation' | 'external';
  requiresValue?: boolean;
  valueLabel?: string;
  valuePlaceholder?: string;
}

const ACTION_DEFINITIONS: ActionDefinition[] = [
  // Primary flow actions
  { type: 'next-step', label: 'Next Step', icon: <ArrowRight className="w-3.5 h-3.5" />, category: 'primary' },
  { type: 'go-to-step', label: 'Go To Step', icon: <Layers className="w-3.5 h-3.5" />, category: 'navigation', requiresValue: true, valueLabel: 'Target Step' },
  { type: 'submit', label: 'Submit', icon: <Send className="w-3.5 h-3.5" />, category: 'primary' },
  
  // External actions
  { type: 'url', label: 'Open URL', icon: <ExternalLink className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'URL', valuePlaceholder: 'https://...' },
  { type: 'scroll', label: 'Scroll To', icon: <Hash className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'Element ID', valuePlaceholder: '#section-id' },
  { type: 'phone', label: 'Call', icon: <Phone className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'Phone Number', valuePlaceholder: '+1234567890' },
  { type: 'email', label: 'Email', icon: <Mail className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'Email Address', valuePlaceholder: 'hello@example.com' },
  { type: 'download', label: 'Download', icon: <Download className="w-3.5 h-3.5" />, category: 'external', requiresValue: true, valueLabel: 'File URL', valuePlaceholder: 'https://...' },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════

interface ButtonActionSelectorProps {
  /** Current action */
  action: ButtonAction | undefined;
  /** Called when action changes */
  onChange: (action: ButtonAction) => void;
  /** Available steps for "Go To Step" action */
  availableSteps?: { id: string; name: string }[];
  /** Compact mode for smaller UI */
  compact?: boolean;
  /** Show only primary actions (Next Step, Submit) */
  primaryOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const ButtonActionSelector: React.FC<ButtonActionSelectorProps> = ({
  action,
  onChange,
  availableSteps = [],
  compact = false,
  primaryOnly = false,
}) => {
  // Default to 'next-step' if unset - but this is ALWAYS shown explicitly
  const currentType: ButtonActionType = action?.type || 'next-step';
  const currentValue = action?.value || '';
  const openNewTab = action?.openNewTab ?? false;

  const handleTypeChange = (type: ButtonActionType, value?: string) => {
    onChange({ type, value, openNewTab: type === 'url' ? openNewTab : undefined });
  };

  const handleValueChange = (value: string) => {
    onChange({ type: currentType, value, openNewTab: currentType === 'url' ? openNewTab : undefined });
  };

  const handleNewTabChange = (checked: boolean) => {
    onChange({ type: currentType, value: currentValue, openNewTab: checked });
  };

  const primaryActions = ACTION_DEFINITIONS.filter(a => a.category === 'primary');
  const navigationActions = ACTION_DEFINITIONS.filter(a => a.category === 'navigation');
  const externalActions = ACTION_DEFINITIONS.filter(a => a.category === 'external');
  
  const currentDefinition = ACTION_DEFINITIONS.find(a => a.type === currentType);

  // Filter actions based on primaryOnly prop
  const visiblePrimaryActions = primaryActions;
  const visibleNavigationActions = primaryOnly ? [] : navigationActions;
  const visibleExternalActions = primaryOnly ? [] : externalActions;

  return (
    <div className="space-y-3">
      {/* Current Action Display - Always visible */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/30 border border-border/50">
        <span className="text-[10px] text-muted-foreground">On Click:</span>
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
          {currentDefinition?.icon}
          {currentDefinition?.label || 'Next Step'}
        </span>
      </div>

      {/* Primary Actions - Always shown */}
      <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-3")}>
        {visiblePrimaryActions.map((actionDef) => (
          <button
            key={actionDef.type}
            type="button"
            onClick={() => handleTypeChange(actionDef.type)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
              currentType === actionDef.type
                ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {actionDef.icon}
            {actionDef.label}
          </button>
        ))}
      </div>

      {/* Navigation Actions */}
      {visibleNavigationActions.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5">
          {visibleNavigationActions.map((actionDef) => (
            <button
              key={actionDef.type}
              type="button"
              onClick={() => handleTypeChange(actionDef.type, currentType === actionDef.type ? currentValue : '')}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                currentType === actionDef.type
                  ? "bg-builder-accent text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {actionDef.icon}
              {actionDef.label}
            </button>
          ))}
        </div>
      )}

      {/* External Actions */}
      {visibleExternalActions.length > 0 && (
        <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-4")}>
          {visibleExternalActions.map((actionDef) => (
            <button
              key={actionDef.type}
              type="button"
              onClick={() => handleTypeChange(actionDef.type, currentType === actionDef.type ? currentValue : '')}
              className={cn(
                "flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] transition-colors",
                currentType === actionDef.type
                  ? "bg-builder-accent text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {actionDef.icon}
              {actionDef.label}
            </button>
          ))}
        </div>
      )}

      {/* Value Input - For actions that require a value */}
      {currentDefinition?.requiresValue && (
        <div className="space-y-2 pt-2 border-t border-border/50">
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
