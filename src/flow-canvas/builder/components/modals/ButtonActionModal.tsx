import React, { useState, useEffect } from 'react';
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
  Sparkles,
  ChevronDown,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useButtonContext, type ButtonContext } from '@/flow-canvas/builder/hooks/useButtonContext';

export type ButtonActionType = 
  | 'next-step' 
  | 'go-to-step' 
  | 'url' 
  | 'scroll' 
  | 'submit' 
  | 'download' 
  | 'phone' 
  | 'email';

export interface ButtonAction {
  type: ButtonActionType;
  value?: string;
  openNewTab?: boolean;
}

interface ButtonActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: ButtonAction | null;
  onSave: (action: ButtonAction) => void;
  steps?: { id: string; name: string }[];
  // Smart context props
  buttonContext?: Partial<ButtonContext>;
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
}

const actionOptions: ActionOption[] = [
  { 
    type: 'next-step', 
    label: 'Continue', 
    icon: <ArrowRight className="w-4 h-4" />, 
    description: 'Continue to next step' 
  },
  { 
    type: 'go-to-step', 
    label: 'Go to Step', 
    icon: <Layers className="w-4 h-4" />, 
    description: 'Jump to a specific step you choose',
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
];

export const ButtonActionModal: React.FC<ButtonActionModalProps> = ({
  isOpen,
  onClose,
  action,
  onSave,
  steps = [],
  buttonContext = {},
}) => {
  // Get smart recommendations based on button context
  const { recommendedAction, allRecommendations } = useButtonContext(buttonContext);
  
  const [selectedType, setSelectedType] = useState<ButtonActionType>(action?.type || recommendedAction);
  const [inputValue, setInputValue] = useState(action?.value || '');
  const [openNewTab, setOpenNewTab] = useState(action?.openNewTab || false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update default when modal opens with no existing action
  useEffect(() => {
    if (isOpen && !action) {
      setSelectedType(recommendedAction);
    }
  }, [isOpen, action, recommendedAction]);

  const selectedOption = actionOptions.find(o => o.type === selectedType);
  const recommendedOptions = allRecommendations.filter(r => r.isRecommended);
  const otherOptions = actionOptions.filter(
    opt => !recommendedOptions.some(r => r.action === opt.type)
  );

  const handleSave = () => {
    onSave({
      type: selectedType,
      value: inputValue || undefined,
      openNewTab: openNewTab || undefined,
    });
    onClose();
  };

  const handleTypeSelect = (type: ButtonActionType) => {
    setSelectedType(type);
    setInputValue('');
    setOpenNewTab(false);
  };

  const renderActionOption = (option: ActionOption, isRecommended: boolean = false) => {
    const recommendation = allRecommendations.find(r => r.action === option.type);
    
    return (
      <button
        key={option.type}
        onClick={() => handleTypeSelect(option.type)}
        className={cn(
          'p-3 rounded-lg border text-left transition-all relative',
          selectedType === option.type
            ? 'border-builder-accent bg-builder-accent/10'
            : 'border-builder-border hover:border-builder-text-muted hover:bg-builder-surface-hover'
        )}
      >
        {isRecommended && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-builder-accent text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" />
            Recommended
          </div>
        )}
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
          {recommendation?.reason || option.description}
        </p>
      </button>
    );
  };

  // Get primary recommended options (show at top)
  const primaryOptions = actionOptions.filter(opt => 
    allRecommendations.some(r => r.action === opt.type && r.isRecommended)
  );
  const secondaryOptions = actionOptions.filter(opt => 
    !allRecommendations.some(r => r.action === opt.type && r.isRecommended)
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
          {/* Recommended Actions */}
          {primaryOptions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-builder-text-muted uppercase tracking-wide">
                Recommended
              </div>
              <div className="grid grid-cols-2 gap-2">
                {primaryOptions.map(opt => renderActionOption(opt, true))}
              </div>
            </div>
          )}

          {/* Other Actions - Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-builder-text-muted hover:text-builder-text transition-colors w-full">
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showAdvanced && "rotate-180"
              )} />
              {showAdvanced ? 'Hide other actions' : 'Show all actions'}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid grid-cols-2 gap-2">
                {secondaryOptions.map(opt => renderActionOption(opt, false))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Input Field for actions that need it */}
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
