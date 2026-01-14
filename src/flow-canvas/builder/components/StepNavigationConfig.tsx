import React from 'react';
import { Step, StepNavigation } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowRight, 
  SkipForward, 
  Send, 
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface StepNavigationConfigProps {
  currentStep: Step;
  allSteps: Step[];
  navigation?: StepNavigation;
  onUpdate: (navigation: StepNavigation) => void;
}

const actionOptions: { value: StepNavigation['action']; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: 'next', 
    label: 'Go to next step', 
    description: 'Continue to the following step',
    icon: <ArrowRight className="w-4 h-4" />
  },
  { 
    value: 'go-to-step', 
    label: 'Jump to specific step', 
    description: 'Skip to a particular step',
    icon: <SkipForward className="w-4 h-4" />
  },
  { 
    value: 'submit', 
    label: 'Submit form', 
    description: 'Save all collected data',
    icon: <Send className="w-4 h-4" />
  },
  { 
    value: 'redirect', 
    label: 'Redirect to URL', 
    description: 'Send user to external page',
    icon: <ExternalLink className="w-4 h-4" />
  },
];

export const StepNavigationConfig: React.FC<StepNavigationConfigProps> = ({
  currentStep,
  allSteps,
  navigation = { action: 'next' },
  onUpdate,
}) => {
  const currentIndex = allSteps.findIndex(s => s.id === currentStep.id);
  const availableSteps = allSteps.filter((s, i) => i !== currentIndex);
  const isLastStep = currentIndex === allSteps.length - 1;

  const handleActionChange = (action: StepNavigation['action']) => {
    const updated: StepNavigation = { action };
    
    // Set defaults based on action
    if (action === 'go-to-step' && availableSteps.length > 0) {
      updated.targetStepId = availableSteps[0].id;
    }
    if (action === 'redirect') {
      updated.redirectUrl = navigation.redirectUrl || '';
    }
    
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-builder-border-subtle">
        <ArrowRight className="w-4 h-4 text-builder-accent" />
        <span className="text-xs font-semibold text-builder-text uppercase tracking-wide">
          After This Step
        </span>
      </div>

      {/* Action Selection */}
      <div className="space-y-3">
        {actionOptions.map((option) => {
          const isSelected = navigation.action === option.value;
          const isDisabled = option.value === 'next' && isLastStep;
          
          return (
            <div key={option.value}>
              <button
                onClick={() => !isDisabled && handleActionChange(option.value)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all',
                  isSelected 
                    ? 'bg-builder-accent/15 ring-1 ring-builder-accent/40' 
                    : 'bg-builder-surface-hover hover:bg-builder-surface-active',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  isSelected ? 'bg-builder-accent text-white' : 'bg-builder-bg text-builder-text-muted'
                )}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-builder-accent' : 'text-builder-text'
                  )}>
                    {option.label}
                    {isDisabled && ' (no next step)'}
                  </div>
                  <div className="text-xs text-builder-text-dim truncate">
                    {option.description}
                  </div>
                </div>
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                  isSelected ? 'border-builder-accent bg-builder-accent' : 'border-builder-border'
                )}>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </button>

              {/* Conditional inputs */}
              {isSelected && option.value === 'go-to-step' && (
                <div className="mt-3 ml-11 pr-3">
                  <Label className="text-xs text-builder-text-muted mb-1.5 block">
                    Target Step
                  </Label>
                  <Select
                    value={navigation.targetStepId || ''}
                    onValueChange={(value) => onUpdate({ ...navigation, targetStepId: value })}
                  >
                    <SelectTrigger className="w-full bg-builder-bg border-builder-border text-builder-text">
                      <SelectValue placeholder="Select a step" />
                    </SelectTrigger>
                    <SelectContent className="bg-builder-surface border-builder-border">
                      {availableSteps.map((step, i) => (
                        <SelectItem 
                          key={step.id} 
                          value={step.id}
                          className="text-builder-text hover:bg-builder-surface-hover"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-builder-text-muted text-xs">
                              {allSteps.findIndex(s => s.id === step.id) + 1}.
                            </span>
                            {step.name || `Step ${i + 1}`}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isSelected && option.value === 'redirect' && (
                <div className="mt-3 ml-11 pr-3 space-y-3">
                  <div>
                    <Label className="text-xs text-builder-text-muted mb-1.5 block">
                      Redirect URL
                    </Label>
                    <Input
                      type="url"
                      value={navigation.redirectUrl || ''}
                      onChange={(e) => onUpdate({ ...navigation, redirectUrl: e.target.value })}
                      placeholder="https://example.com/thank-you"
                      className="bg-builder-bg border-builder-border text-builder-text placeholder:text-builder-text-dim"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={navigation.submitAndContinue || false}
                      onChange={(e) => onUpdate({ ...navigation, submitAndContinue: e.target.checked })}
                      className="w-4 h-4 rounded border-builder-border bg-builder-bg text-builder-accent focus:ring-builder-accent"
                    />
                    <span className="text-xs text-builder-text">
                      Submit form data before redirect
                    </span>
                  </label>
                </div>
              )}

              {isSelected && option.value === 'submit' && (
                <div className="mt-3 ml-11 pr-3">
                  <div className="text-xs text-builder-text-dim bg-builder-bg rounded-lg p-3">
                    <p className="mb-2">Form data will be saved to:</p>
                    <ul className="list-disc list-inside space-y-1 text-builder-text-muted">
                      <li>CRM Contacts</li>
                      <li>Funnel Leads</li>
                      <li>Configured webhooks</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview of next step */}
      {navigation.action === 'next' && !isLastStep && (
        <div className="mt-4 pt-4 border-t border-builder-border-subtle">
          <div className="text-xs text-builder-text-dim mb-2">Next step:</div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-builder-bg">
            <span className="text-xs font-medium text-builder-text-muted">
              {currentIndex + 2}.
            </span>
            <span className="text-sm text-builder-text">
              {allSteps[currentIndex + 1]?.name || `Step ${currentIndex + 2}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
