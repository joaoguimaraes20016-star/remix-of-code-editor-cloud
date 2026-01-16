// ApplicationStepInspector - Unified inspector for ALL interactive step types
// Works with the unified ApplicationStep type for consistent UX across:
// - Flow Container steps (Typeform-style multi-step experience)
// - Inline interactive blocks (standalone questions/capture fields)

import React, { useState, useCallback } from 'react';
import {
  Type,
  Settings2,
  Workflow,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { 
  ApplicationStep, 
  ApplicationStepType,
  ApplicationStepSettings,
  ApplicationStepChoice,
} from '@/flow-canvas/shared/types/applicationEngine';

// ============ TYPES ============

interface ApplicationStepInspectorProps {
  step: ApplicationStep;
  onUpdate: (updates: Partial<ApplicationStep>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  // For navigation targets
  availableSteps?: Array<{ id: string; name: string }>;
}

// ============ STEP TYPE LABELS ============

const STEP_TYPE_LABELS: Record<ApplicationStepType, string> = {
  'open-ended': 'Text Question',
  'single-choice': 'Single Choice',
  'multi-choice': 'Multiple Choice',
  'email': 'Email',
  'phone': 'Phone',
  'name': 'Name',
  'full-identity': 'Contact Info',
  'date': 'Date',
  'scale': 'Scale/Rating',
  'yes-no': 'Yes/No',
  'welcome': 'Welcome',
  'ending': 'Ending',
};

// ============ COLLAPSIBLE SECTION ============

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-builder-border">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-builder-surface-hover transition-colors">
        <div className="flex items-center gap-2 text-sm font-medium text-builder-text">
          {icon && <span className="text-builder-text-muted">{icon}</span>}
          {title}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-builder-text-muted transition-transform",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============ FIELD GROUP ============

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-builder-text-muted">{label}</Label>
    {children}
  </div>
);

// ============ MAIN COMPONENT ============

export const ApplicationStepInspector: React.FC<ApplicationStepInspectorProps> = ({
  step,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  availableSteps = [],
}) => {
  // Update settings helper
  const updateSettings = useCallback((key: keyof ApplicationStepSettings, value: any) => {
    onUpdate({
      settings: {
        ...step.settings,
        [key]: value,
      },
    });
  }, [step.settings, onUpdate]);

  // Update navigation helper
  const updateNavigation = useCallback((key: string, value: any) => {
    onUpdate({
      navigation: {
        ...step.navigation,
        [key]: value,
      },
    });
  }, [step.navigation, onUpdate]);

  // Update choices helper
  const updateChoice = useCallback((index: number, updates: Partial<ApplicationStepChoice>) => {
    const choices = [...(step.settings.choices || [])];
    choices[index] = { ...choices[index], ...updates };
    updateSettings('choices', choices);
  }, [step.settings.choices, updateSettings]);

  const addChoice = useCallback(() => {
    const choices = [...(step.settings.choices || [])];
    choices.push({
      id: `opt_${Date.now()}`,
      label: `Option ${choices.length + 1}`,
    });
    updateSettings('choices', choices);
  }, [step.settings.choices, updateSettings]);

  const removeChoice = useCallback((index: number) => {
    const choices = [...(step.settings.choices || [])];
    choices.splice(index, 1);
    updateSettings('choices', choices);
  }, [step.settings.choices, updateSettings]);

  const isChoiceStep = ['single-choice', 'multi-choice', 'yes-no'].includes(step.type);
  const isIdentityStep = ['email', 'phone', 'name', 'full-identity'].includes(step.type);
  const isScaleStep = step.type === 'scale';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-builder-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-builder-accent" />
          <span className="text-sm font-medium text-builder-text">
            {STEP_TYPE_LABELS[step.type] || step.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp}>
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
          )}
          {onMoveDown && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown}>
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDuplicate && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto builder-scroll">
        {/* Content Section */}
        <CollapsibleSection title="Content" icon={<Type className="w-4 h-4" />}>
          <div className="space-y-4">
            <FieldGroup label="Title">
              <Input
                value={step.settings.title || ''}
                onChange={(e) => updateSettings('title', e.target.value)}
                placeholder="Enter title..."
                className="builder-input"
              />
            </FieldGroup>

            <FieldGroup label="Description">
              <Textarea
                value={step.settings.description || ''}
                onChange={(e) => updateSettings('description', e.target.value)}
                placeholder="Optional description..."
                className="builder-input min-h-[80px] resize-none"
              />
            </FieldGroup>

            {!isChoiceStep && !isScaleStep && (
              <FieldGroup label="Placeholder">
                <Input
                  value={step.settings.placeholder || ''}
                  onChange={(e) => updateSettings('placeholder', e.target.value)}
                  placeholder="Input placeholder..."
                  className="builder-input"
                />
              </FieldGroup>
            )}

            <FieldGroup label="Button Text">
              <Input
                value={step.settings.buttonText || ''}
                onChange={(e) => updateSettings('buttonText', e.target.value)}
                placeholder="Continue"
                className="builder-input"
              />
            </FieldGroup>
          </div>
        </CollapsibleSection>

        {/* Choices Section (for choice-based steps) */}
        {isChoiceStep && step.type !== 'yes-no' && (
          <CollapsibleSection title="Options" icon={<Workflow className="w-4 h-4" />}>
            <div className="space-y-3">
              {(step.settings.choices || []).map((choice, index) => (
                <div key={choice.id} className="flex items-center gap-2">
                  <Input
                    value={choice.label}
                    onChange={(e) => updateChoice(index, { label: e.target.value })}
                    className="builder-input flex-1"
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-builder-text-muted hover:text-destructive"
                    onClick={() => removeChoice(index)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addChoice}
                className="w-full"
              >
                Add Option
              </Button>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-builder-text-muted">Randomize Order</span>
                <Switch
                  checked={step.settings.randomizeOrder || false}
                  onCheckedChange={(checked) => updateSettings('randomizeOrder', checked)}
                />
              </div>

              {step.type === 'multi-choice' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Allow Multiple</span>
                  <Switch
                    checked={step.settings.allowMultiple !== false}
                    onCheckedChange={(checked) => updateSettings('allowMultiple', checked)}
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Scale Settings */}
        {isScaleStep && (
          <CollapsibleSection title="Scale Settings" icon={<Settings2 className="w-4 h-4" />}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Min Value">
                  <Input
                    type="number"
                    value={step.settings.scaleMin ?? 1}
                    onChange={(e) => updateSettings('scaleMin', parseInt(e.target.value))}
                    className="builder-input"
                  />
                </FieldGroup>
                <FieldGroup label="Max Value">
                  <Input
                    type="number"
                    value={step.settings.scaleMax ?? 10}
                    onChange={(e) => updateSettings('scaleMax', parseInt(e.target.value))}
                    className="builder-input"
                  />
                </FieldGroup>
              </div>
              <FieldGroup label="Min Label">
                <Input
                  value={step.settings.scaleMinLabel || ''}
                  onChange={(e) => updateSettings('scaleMinLabel', e.target.value)}
                  placeholder="e.g., Not at all"
                  className="builder-input"
                />
              </FieldGroup>
              <FieldGroup label="Max Label">
                <Input
                  value={step.settings.scaleMaxLabel || ''}
                  onChange={(e) => updateSettings('scaleMaxLabel', e.target.value)}
                  placeholder="e.g., Extremely"
                  className="builder-input"
                />
              </FieldGroup>
            </div>
          </CollapsibleSection>
        )}

        {/* Identity Fields Settings */}
        {step.type === 'full-identity' && (
          <CollapsibleSection title="Fields to Collect" icon={<Settings2 className="w-4 h-4" />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Collect Name</span>
                <Switch
                  checked={step.settings.collectName !== false}
                  onCheckedChange={(checked) => updateSettings('collectName', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Collect Email</span>
                <Switch
                  checked={step.settings.collectEmail !== false}
                  onCheckedChange={(checked) => updateSettings('collectEmail', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Collect Phone</span>
                <Switch
                  checked={step.settings.collectPhone !== false}
                  onCheckedChange={(checked) => updateSettings('collectPhone', checked)}
                />
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Style Section */}
        <CollapsibleSection title="Style" icon={<AlignCenter className="w-4 h-4" />} defaultOpen={false}>
          <div className="space-y-4">
            <FieldGroup label="Alignment">
              <div className="flex gap-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1",
                      step.settings.align === value && "bg-builder-accent/10 border-builder-accent"
                    )}
                    onClick={() => updateSettings('align', value)}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Title Size">
              <Select
                value={step.settings.titleSize || 'medium'}
                onValueChange={(value) => updateSettings('titleSize', value)}
              >
                <SelectTrigger className="builder-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>

            <FieldGroup label="Spacing">
              <Select
                value={step.settings.spacing || 'normal'}
                onValueChange={(value) => updateSettings('spacing', value)}
              >
                <SelectTrigger className="builder-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="relaxed">Relaxed</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
        </CollapsibleSection>

        {/* Logic Section - Uses unified action system matching ButtonActionModal */}
        <CollapsibleSection title="Action" icon={<Workflow className="w-4 h-4" />} defaultOpen={false}>
          <div className="space-y-4">
            <FieldGroup label="On Continue">
              <Select
                value={step.navigation.action}
                onValueChange={(value) => updateNavigation('action', value as 'next' | 'go-to-step' | 'submit' | 'redirect')}
              >
                <SelectTrigger className="builder-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Continue</SelectItem>
                  <SelectItem value="go-to-step">Go to Step</SelectItem>
                  <SelectItem value="submit">Submit</SelectItem>
                  <SelectItem value="redirect">Open URL</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>

            {step.navigation.action === 'go-to-step' && (
              <FieldGroup label="Target Step">
                <Select
                  value={step.navigation.targetStepId || ''}
                  onValueChange={(value) => updateNavigation('targetStepId', value)}
                >
                  <SelectTrigger className="builder-input">
                    <SelectValue placeholder="Select step..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSteps.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
            )}

            {step.navigation.action === 'redirect' && (
              <FieldGroup label="URL">
                <Input
                  value={step.navigation.redirectUrl || ''}
                  onChange={(e) => updateNavigation('redirectUrl', e.target.value)}
                  placeholder="https://example.com"
                  className="builder-input"
                />
              </FieldGroup>
            )}

            <FieldGroup label="Field Key">
              <Input
                value={step.fieldKey || ''}
                onChange={(e) => onUpdate({ fieldKey: e.target.value })}
                placeholder="Auto-generated"
                className="builder-input"
              />
              <p className="text-[10px] text-builder-text-muted mt-1">
                Used to identify this answer in submissions
              </p>
            </FieldGroup>

            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Required</span>
              <Switch
                checked={step.validation?.required !== false}
                onCheckedChange={(checked) => onUpdate({
                  validation: { ...step.validation, required: checked }
                })}
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default ApplicationStepInspector;
