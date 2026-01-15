import React, { useState } from 'react';
import { 
  MousePointer2, 
  ExternalLink, 
  ArrowRight, 
  Hash, 
  Send, 
  Download, 
  Phone, 
  Mail,
  Layers,
  X,
  Play,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ButtonActionType = 
  | 'next-step' 
  | 'go-to-step' 
  | 'url' 
  | 'scroll' 
  | 'submit' 
  | 'modal' 
  | 'download' 
  | 'phone' 
  | 'email'
  // CaptureFlow actions (Phase 5)
  | 'advance-capture-flow'
  | 'open-capture-flow'
  | 'submit-capture-flow';

export interface ButtonAction {
  type: ButtonActionType;
  value?: string;
  openNewTab?: boolean;
  captureFlowId?: string; // For open-capture-flow action
}

interface ButtonActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: ButtonAction | null;
  onSave: (action: ButtonAction) => void;
  steps?: { id: string; name: string }[];
  captureFlows?: { id: string; name: string }[]; // Available CaptureFlows
  isInsideCaptureFlow?: boolean; // Context: is button inside a CaptureFlow?
}

interface ActionOption {
  type: ButtonActionType;
  label: string;
  icon: React.ReactNode;
  description: string;
  hasInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  hasNewTab?: boolean;
  isCaptureFlowAction?: boolean; // Mark as CaptureFlow-specific
  hasCaptureFlowSelect?: boolean; // Needs CaptureFlow selection
}

const actionOptions: ActionOption[] = [
  { 
    type: 'next-step', 
    label: 'Next Step', 
    icon: <ArrowRight className="w-4 h-4" />, 
    description: 'Go to the next step in the funnel' 
  },
  { 
    type: 'go-to-step', 
    label: 'Go to Step', 
    icon: <Layers className="w-4 h-4" />, 
    description: 'Jump to a specific step',
    hasInput: true,
    inputLabel: 'Select Step'
  },
  { 
    type: 'url', 
    label: 'Open URL', 
    icon: <ExternalLink className="w-4 h-4" />, 
    description: 'Navigate to an external URL',
    hasInput: true,
    inputLabel: 'URL',
    inputPlaceholder: 'https://example.com',
    hasNewTab: true
  },
  { 
    type: 'scroll', 
    label: 'Scroll to Section', 
    icon: <Hash className="w-4 h-4" />, 
    description: 'Scroll to an element on the page',
    hasInput: true,
    inputLabel: 'Element ID',
    inputPlaceholder: '#section-name'
  },
  { 
    type: 'submit', 
    label: 'Submit Form', 
    icon: <Send className="w-4 h-4" />, 
    description: 'Submit the current form' 
  },
  { 
    type: 'download', 
    label: 'Download File', 
    icon: <Download className="w-4 h-4" />, 
    description: 'Download a file',
    hasInput: true,
    inputLabel: 'File URL',
    inputPlaceholder: 'https://example.com/file.pdf'
  },
  { 
    type: 'phone', 
    label: 'Call Phone', 
    icon: <Phone className="w-4 h-4" />, 
    description: 'Start a phone call',
    hasInput: true,
    inputLabel: 'Phone Number',
    inputPlaceholder: '+1 (555) 123-4567'
  },
  { 
    type: 'email', 
    label: 'Send Email', 
    icon: <Mail className="w-4 h-4" />, 
    description: 'Open email client',
    hasInput: true,
    inputLabel: 'Email Address',
    inputPlaceholder: 'hello@example.com'
  },
  // CaptureFlow Actions
  { 
    type: 'advance-capture-flow', 
    label: 'Next Node', 
    icon: <Play className="w-4 h-4" />, 
    description: 'Move to next capture node',
    isCaptureFlowAction: true,
  },
  { 
    type: 'open-capture-flow', 
    label: 'Open Flow', 
    icon: <Maximize2 className="w-4 h-4" />, 
    description: 'Open CaptureFlow as modal',
    isCaptureFlowAction: true,
    hasCaptureFlowSelect: true,
  },
  { 
    type: 'submit-capture-flow', 
    label: 'Submit Flow', 
    icon: <CheckCircle2 className="w-4 h-4" />, 
    description: 'Submit the CaptureFlow',
    isCaptureFlowAction: true,
  },
];

export const ButtonActionModal: React.FC<ButtonActionModalProps> = ({
  isOpen,
  onClose,
  action,
  onSave,
  steps = [],
  captureFlows = [],
  isInsideCaptureFlow = false,
}) => {
  // Set default based on context - if inside CaptureFlow, default to advance
  const defaultType = isInsideCaptureFlow ? 'advance-capture-flow' : 'next-step';
  const [selectedType, setSelectedType] = useState<ButtonActionType>(action?.type || defaultType);
  const [inputValue, setInputValue] = useState(action?.value || '');
  const [openNewTab, setOpenNewTab] = useState(action?.openNewTab || false);
  const [captureFlowId, setCaptureFlowId] = useState(action?.captureFlowId || '');

  const selectedOption = actionOptions.find(o => o.type === selectedType);

  // Filter options based on context
  const filteredOptions = actionOptions.filter(option => {
    // If inside CaptureFlow, show CaptureFlow actions prominently
    if (isInsideCaptureFlow) {
      // Hide standard flow actions that don't make sense inside CaptureFlow
      if (option.type === 'next-step' || option.type === 'go-to-step') {
        return false;
      }
    }
    return true;
  });

  // Separate CaptureFlow actions for grouped display
  const standardActions = filteredOptions.filter(o => !o.isCaptureFlowAction);
  const captureFlowActions = filteredOptions.filter(o => o.isCaptureFlowAction);

  const handleSave = () => {
    onSave({
      type: selectedType,
      value: inputValue || undefined,
      openNewTab: openNewTab || undefined,
      captureFlowId: captureFlowId || undefined,
    });
    onClose();
  };

  const handleTypeSelect = (type: ButtonActionType) => {
    setSelectedType(type);
    setInputValue('');
    setOpenNewTab(false);
    setCaptureFlowId('');
  };

  const renderActionGrid = (options: ActionOption[], title?: string) => (
    <>
      {title && (
        <div className="text-xs font-medium text-builder-text-muted uppercase tracking-wide mb-2">
          {title}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.type}
            onClick={() => handleTypeSelect(option.type)}
            className={cn(
              'p-3 rounded-lg border text-left transition-all',
              selectedType === option.type
                ? 'border-builder-accent bg-builder-accent/10'
                : 'border-builder-border hover:border-builder-text-muted hover:bg-builder-surface-hover'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                selectedType === option.type ? 'text-builder-accent' : 'text-builder-text-muted'
              )}>
                {option.icon}
              </span>
              <span className={cn(
                'text-sm font-medium',
                selectedType === option.type ? 'text-builder-accent' : 'text-builder-text'
              )}>
                {option.label}
              </span>
            </div>
            <p className="text-xs text-builder-text-muted line-clamp-1">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-builder-surface border-builder-border max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-builder-text flex items-center gap-2">
            <MousePointer2 className="w-5 h-5 text-builder-accent" />
            Button Click Action
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* CaptureFlow Actions - show first if inside CaptureFlow */}
          {isInsideCaptureFlow && captureFlowActions.length > 0 && (
            <div className="pb-3 border-b border-builder-border">
              {renderActionGrid(captureFlowActions, 'Capture Flow')}
            </div>
          )}

          {/* Standard Action Type Grid */}
          {renderActionGrid(
            standardActions, 
            isInsideCaptureFlow ? 'Other Actions' : undefined
          )}

          {/* CaptureFlow Actions - show at bottom if NOT inside CaptureFlow */}
          {!isInsideCaptureFlow && captureFlowActions.length > 0 && (
            <div className="pt-3 border-t border-builder-border">
              {renderActionGrid(captureFlowActions, 'Capture Flow')}
            </div>
          )}

          {/* Input Field for standard actions */}
          {selectedOption?.hasInput && (
            <div className="space-y-2">
              <Label className="text-sm text-builder-text-muted">
                {selectedOption.inputLabel}
              </Label>
              {selectedOption.type === 'go-to-step' ? (
                <Select value={inputValue} onValueChange={setInputValue}>
                  <SelectTrigger className="builder-input">
                    <SelectValue placeholder="Select a step..." />
                  </SelectTrigger>
                  <SelectContent className="bg-builder-surface border-builder-border">
                    {steps.map((step) => (
                      <SelectItem key={step.id} value={step.id}>
                        {step.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={selectedOption.inputPlaceholder}
                  className="builder-input"
                />
              )}
            </div>
          )}

          {/* CaptureFlow Selection for open-capture-flow action */}
          {selectedOption?.hasCaptureFlowSelect && (
            <div className="space-y-2">
              <Label className="text-sm text-builder-text-muted">
                Select CaptureFlow
              </Label>
              <Select value={captureFlowId} onValueChange={setCaptureFlowId}>
                <SelectTrigger className="builder-input">
                  <SelectValue placeholder="Choose a CaptureFlow..." />
                </SelectTrigger>
                <SelectContent className="bg-builder-surface border-builder-border">
                  {captureFlows.length > 0 ? (
                    captureFlows.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>
                        {flow.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-builder-text-muted text-center">
                      No CaptureFlows available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* New Tab Toggle */}
          {selectedOption?.hasNewTab && (
            <div className="flex items-center justify-between py-2">
              <Label className="text-sm text-builder-text">Open in new tab</Label>
              <Switch
                checked={openNewTab}
                onCheckedChange={setOpenNewTab}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-builder-text-muted hover:text-builder-text"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-builder-accent text-white hover:brightness-110"
            >
              Save Action
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
