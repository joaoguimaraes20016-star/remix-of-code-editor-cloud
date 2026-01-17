/**
 * ButtonActionSelector - Unified action selector for ALL buttons
 * 
 * UX MODEL:
 * ═══════════════════════════════════════════════════════════════
 * PRIMARY ACTIONS (Flow):
 * - Next Step → goes to next visible step (DEFAULT)
 * - Go to Step → jumps to specific step
 * - Submit → submits form (only on Capture/Final steps)
 * 
 * SECONDARY ACTIONS (External):
 * - Open URL
 * - Scroll To
 * - Call, Email, Download
 * 
 * RULES:
 * - "Next Step" ALWAYS means next visible step
 * - No user-facing concept of "auto"
 * - Default action for step buttons = Next Step
 * - No hidden defaults - everything is explicit
 * ═══════════════════════════════════════════════════════════════
 * 
 * INTERNAL MAPPING:
 * - "Next Step" → FlowContainer intent: next-step
 * - "Go to Step" → FlowContainer intent: go-to-step
 * - "Submit" → FlowContainer intent: submit
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
// ACTION TYPES - Internal representation (not exposed to users)
// ═══════════════════════════════════════════════════════════════

export type ButtonActionType = 
  | 'next-step'      // Primary: "Next Step"
  | 'go-to-step'     // Secondary: "Go to Step"
  | 'submit'         // Final: "Submit" (only on capture/final)
  | 'url'            // External: "Open URL"
  | 'scroll'         // External: "Scroll To"
  | 'phone'          // External: "Call"
  | 'email'          // External: "Email"
  | 'download';      // External: "Download"

export interface ButtonAction {
  type: ButtonActionType;
  value?: string;
  openNewTab?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ACTION DEFINITIONS - User-facing labels
// ═══════════════════════════════════════════════════════════════

interface ActionDefinition {
  type: ButtonActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'primary' | 'secondary' | 'external';
  requiresValue?: boolean;
  valueLabel?: string;
  valuePlaceholder?: string;
}

const ALL_ACTIONS: ActionDefinition[] = [
  // PRIMARY - Flow navigation
  { 
    type: 'next-step', 
    label: 'Next Step', 
    description: 'Go to the next visible step',
    icon: <ArrowRight className="w-4 h-4" />, 
    category: 'primary' 
  },
  { 
    type: 'go-to-step', 
    label: 'Go to Step', 
    description: 'Jump to a specific step',
    icon: <Layers className="w-4 h-4" />, 
    category: 'secondary', 
    requiresValue: true, 
    valueLabel: 'Target Step' 
  },
  { 
    type: 'submit', 
    label: 'Submit', 
    description: 'Submit the form',
    icon: <Send className="w-4 h-4" />, 
    category: 'secondary' 
  },
  
  // EXTERNAL - Opens links, triggers external actions
  { 
    type: 'url', 
    label: 'Open URL', 
    description: 'Open a link',
    icon: <ExternalLink className="w-3.5 h-3.5" />, 
    category: 'external', 
    requiresValue: true, 
    valueLabel: 'URL', 
    valuePlaceholder: 'https://...' 
  },
  { 
    type: 'scroll', 
    label: 'Scroll To', 
    description: 'Scroll to section',
    icon: <Hash className="w-3.5 h-3.5" />, 
    category: 'external', 
    requiresValue: true, 
    valueLabel: 'Section ID', 
    valuePlaceholder: '#section-id' 
  },
  { 
    type: 'phone', 
    label: 'Call', 
    description: 'Start phone call',
    icon: <Phone className="w-3.5 h-3.5" />, 
    category: 'external', 
    requiresValue: true, 
    valueLabel: 'Phone Number', 
    valuePlaceholder: '+1234567890' 
  },
  { 
    type: 'email', 
    label: 'Email', 
    description: 'Open email client',
    icon: <Mail className="w-3.5 h-3.5" />, 
    category: 'external', 
    requiresValue: true, 
    valueLabel: 'Email Address', 
    valuePlaceholder: 'hello@example.com' 
  },
  { 
    type: 'download', 
    label: 'Download', 
    description: 'Download a file',
    icon: <Download className="w-3.5 h-3.5" />, 
    category: 'external', 
    requiresValue: true, 
    valueLabel: 'File URL', 
    valuePlaceholder: 'https://...' 
  },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════

interface ButtonActionSelectorProps {
  /** Current action - undefined defaults to "Next Step" */
  action: ButtonAction | undefined;
  /** Called when action changes */
  onChange: (action: ButtonAction | undefined) => void;
  /** Available steps for "Go To Step" action */
  availableSteps?: { id: string; name: string }[];
  /** Step type - affects which actions are shown */
  stepType?: 'welcome' | 'question' | 'capture' | 'ending';
  /** Compact mode for smaller UI */
  compact?: boolean;
  /** Hide external actions */
  flowOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const ButtonActionSelector: React.FC<ButtonActionSelectorProps> = ({
  action,
  onChange,
  availableSteps = [],
  stepType,
  compact = false,
  flowOnly = false,
}) => {
  // Normalize: undefined or 'next-step' are both "Next Step"
  const currentType = action?.type || 'next-step';
  const currentValue = action?.value || '';
  const openNewTab = action?.openNewTab ?? false;

  // Determine which actions to show based on step type
  const getVisibleActions = (): ActionDefinition[] => {
    const primary = ALL_ACTIONS.filter(a => a.category === 'primary');
    const secondary = ALL_ACTIONS.filter(a => a.category === 'secondary');
    const external = flowOnly ? [] : ALL_ACTIONS.filter(a => a.category === 'external');
    
    // Filter actions based on step type
    let flowActions = [...primary];
    
    // "Go to Step" only if there are other steps
    if (availableSteps.length > 0) {
      const goToStep = secondary.find(a => a.type === 'go-to-step');
      if (goToStep) flowActions.push(goToStep);
    }
    
    // "Submit" only on capture/ending steps
    if (stepType === 'capture' || stepType === 'ending') {
      const submit = secondary.find(a => a.type === 'submit');
      if (submit) flowActions.push(submit);
    }
    
    return [...flowActions, ...external];
  };

  const visibleActions = getVisibleActions();
  const flowActions = visibleActions.filter(a => a.category === 'primary' || a.category === 'secondary');
  const externalActions = visibleActions.filter(a => a.category === 'external');
  const currentDefinition = ALL_ACTIONS.find(a => a.type === currentType);

  const handleSelectAction = (type: ButtonActionType) => {
    // "Next Step" is stored as undefined internally (cleaner data)
    if (type === 'next-step') {
      onChange(undefined);
    } else {
      onChange({ 
        type, 
        value: '', 
        openNewTab: type === 'url' ? false : undefined 
      });
    }
  };

  const handleValueChange = (value: string) => {
    if (currentType && currentType !== 'next-step') {
      onChange({ 
        type: currentType, 
        value, 
        openNewTab: currentType === 'url' ? openNewTab : undefined 
      });
    }
  };

  const handleNewTabChange = (checked: boolean) => {
    if (currentType) {
      onChange({ 
        type: currentType, 
        value: currentValue, 
        openNewTab: checked 
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Flow Actions - Primary selection */}
      <div className="space-y-1.5">
        <div className={cn(
          "grid gap-1.5",
          flowActions.length <= 2 ? "grid-cols-2" : "grid-cols-3"
        )}>
          {flowActions.map((actionDef) => (
            <button
              key={actionDef.type}
              type="button"
              onClick={() => handleSelectAction(actionDef.type)}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                currentType === actionDef.type
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {actionDef.icon}
              {actionDef.label}
            </button>
          ))}
        </div>
        
        {/* Show description of selected action */}
        {currentDefinition && (
          <p className="text-[10px] text-muted-foreground px-1">
            {currentDefinition.description}
          </p>
        )}
      </div>

      {/* External Actions */}
      {externalActions.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
            External
          </Label>
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
        </div>
      )}

      {/* Value Configuration - For actions that need input */}
      {currentDefinition?.requiresValue && (
        <div className="space-y-2 pt-2 border-t border-border/30">
          {currentType === 'go-to-step' ? (
            <div className={cn(
              "space-y-1 p-2 rounded-lg transition-colors",
              !currentValue && "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
            )}>
              <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                {currentDefinition.valueLabel}
                {!currentValue && <span className="text-amber-600 dark:text-amber-400">(required)</span>}
              </Label>
              <Select value={currentValue} onValueChange={handleValueChange}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Select step..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
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
              <Label className="text-[10px] text-muted-foreground">
                {currentDefinition.valueLabel}
              </Label>
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
