import React from 'react';
import { Block, ApplicationFlowSettings } from '../../../types/infostack';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Type, MousePointer2, Palette } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPickerPopover } from '../modals';

// Local type definitions (matches ApplicationFlowCard)
export type StepElementType = 'title' | 'description' | 'button' | 'option' | 'input';

export interface StepElementSelection {
  stepId: string;
  elementType: StepElementType;
  optionIndex?: number;
}

interface StepElementInspectorProps {
  block: Block;
  selection: StepElementSelection;
  onUpdateBlock: (updates: Partial<Block>) => void;
  onBack: () => void;
}

const elementTypeLabels: Record<StepElementType, string> = {
  title: 'Title',
  description: 'Description',
  button: 'Button',
  option: 'Option',
  input: 'Input Field',
};

export const StepElementInspector: React.FC<StepElementInspectorProps> = ({
  block,
  selection,
  onUpdateBlock,
  onBack,
}) => {
  const settings = block.props as Partial<ApplicationFlowSettings>;
  const steps = settings?.steps || [];
  const step = steps.find(s => s.id === selection.stepId);
  const stepSettings = (step as any)?.settings || {};

  if (!step) {
    return (
      <div className="p-4 text-center text-builder-text-muted text-sm">
        Step not found
      </div>
    );
  }

  // Update step settings helper
  const updateStepSetting = (key: string, value: any) => {
    const newSteps = steps.map(s => 
      s.id === step.id 
        ? { ...s, settings: { ...((s as any).settings || {}), [key]: value } }
        : s
    );
    onUpdateBlock({ props: { ...settings, steps: newSteps } });
  };

  // Update specific option
  const updateOption = (index: number, value: string) => {
    const options = [...(stepSettings.options || [])];
    options[index] = value;
    updateStepSetting('options', options);
  };

  const renderTitleEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Title Text</Label>
        <Input
          value={stepSettings.title || ''}
          onChange={(e) => updateStepSetting('title', e.target.value)}
          placeholder="Enter title..."
          className="text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Title Size</Label>
        <Select
          value={stepSettings.titleSize || 'xl'}
          onValueChange={(value) => updateStepSetting('titleSize', value)}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
            <SelectItem value="2xl">2XL</SelectItem>
            <SelectItem value="3xl">3XL</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderDescriptionEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Description Text</Label>
        <Textarea
          value={stepSettings.description || ''}
          onChange={(e) => updateStepSetting('description', e.target.value)}
          placeholder="Enter description..."
          className="text-sm min-h-[80px]"
        />
      </div>
    </div>
  );

  const renderButtonEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Button Text</Label>
        <Input
          value={stepSettings.buttonText || 'Continue'}
          onChange={(e) => updateStepSetting('buttonText', e.target.value)}
          placeholder="Continue"
          className="text-sm"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Button Color</Label>
        <ColorPickerPopover
          color={stepSettings.buttonBg || '#000000'}
          onChange={(color) => updateStepSetting('buttonBg', color)}
        >
          <button 
            className="w-full h-8 rounded border border-builder-border flex items-center gap-2 px-2"
            style={{ backgroundColor: stepSettings.buttonBg || '#000000' }}
          >
            <span className="text-xs text-white/80">{stepSettings.buttonBg || '#000000'}</span>
          </button>
        </ColorPickerPopover>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Text Color</Label>
        <ColorPickerPopover
          color={stepSettings.buttonTextColor || '#ffffff'}
          onChange={(color) => updateStepSetting('buttonTextColor', color)}
        >
          <button 
            className="w-full h-8 rounded border border-builder-border flex items-center gap-2 px-2"
            style={{ backgroundColor: stepSettings.buttonTextColor || '#ffffff' }}
          >
            <span className="text-xs" style={{ color: stepSettings.buttonBg || '#000000' }}>{stepSettings.buttonTextColor || '#ffffff'}</span>
          </button>
        </ColorPickerPopover>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Border Radius</Label>
        <div className="flex items-center gap-3">
          <Slider
            value={[stepSettings.buttonRadius || 8]}
            onValueChange={([value]) => updateStepSetting('buttonRadius', value)}
            min={0}
            max={24}
            step={2}
            className="flex-1"
          />
          <span className="text-xs text-builder-text-muted w-8">{stepSettings.buttonRadius || 8}px</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Button Action</Label>
        <Select
          value={stepSettings.buttonAction?.type || 'next-step'}
          onValueChange={(value) => updateStepSetting('buttonAction', { ...stepSettings.buttonAction, type: value })}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="next-step">Go to Next Step</SelectItem>
            <SelectItem value="prev-step">Go to Previous Step</SelectItem>
            <SelectItem value="submit">Submit Form</SelectItem>
            <SelectItem value="go-to-step">Go to Specific Step</SelectItem>
            <SelectItem value="open-url">Open URL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {stepSettings.buttonAction?.type === 'go-to-step' && (
        <div className="space-y-2">
          <Label className="text-xs text-builder-text-muted">Target Step</Label>
          <Select
            value={stepSettings.buttonAction?.value || ''}
            onValueChange={(value) => updateStepSetting('buttonAction', { ...stepSettings.buttonAction, value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select step..." />
            </SelectTrigger>
            <SelectContent>
              {steps.filter(s => s.id !== step.id).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {stepSettings.buttonAction?.type === 'open-url' && (
        <div className="space-y-2">
          <Label className="text-xs text-builder-text-muted">URL</Label>
          <Input
            value={stepSettings.buttonAction?.value || ''}
            onChange={(e) => updateStepSetting('buttonAction', { ...stepSettings.buttonAction, value: e.target.value })}
            placeholder="https://example.com"
            className="text-sm"
          />
        </div>
      )}
    </div>
  );

  const renderOptionEditor = () => {
    const optionIndex = selection.optionIndex ?? 0;
    const options = stepSettings.options || [];
    const optionValue = options[optionIndex] || '';
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-builder-text-muted">Option {optionIndex + 1} Text</Label>
          <Input
            value={optionValue}
            onChange={(e) => updateOption(optionIndex, e.target.value)}
            placeholder="Option text..."
            className="text-sm"
          />
        </div>
        
        <div className="pt-2 border-t border-builder-border">
          <p className="text-xs text-builder-text-dim mb-2">All Options</p>
          <div className="space-y-1.5">
            {options.map((opt: string, i: number) => (
              <div 
                key={i}
                className={cn(
                  "px-2 py-1.5 text-xs rounded",
                  i === optionIndex 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "bg-builder-surface text-builder-text-muted"
                )}
              >
                {opt || `Option ${i + 1}`}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInputEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Placeholder</Label>
        <Input
          value={stepSettings.placeholder || ''}
          onChange={(e) => updateStepSetting('placeholder', e.target.value)}
          placeholder="Type your answer..."
          className="text-sm"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs text-builder-text-muted">Input Style</Label>
        <Select
          value={stepSettings.inputStyle || 'outlined'}
          onValueChange={(value) => updateStepSetting('inputStyle', value)}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outlined">Outlined</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="underline">Underline</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderElementContent = () => {
    switch (selection.elementType) {
      case 'title':
        return renderTitleEditor();
      case 'description':
        return renderDescriptionEditor();
      case 'button':
        return renderButtonEditor();
      case 'option':
        return renderOptionEditor();
      case 'input':
        return renderInputEditor();
      default:
        return <div className="p-4 text-sm text-builder-text-muted">Unknown element type</div>;
    }
  };

  const getIcon = () => {
    switch (selection.elementType) {
      case 'title':
      case 'description':
        return <Type className="w-4 h-4" />;
      case 'button':
      case 'option':
        return <MousePointer2 className="w-4 h-4" />;
      case 'input':
        return <Palette className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header with back button */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-builder-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-7 px-2 text-builder-text-muted hover:text-builder-text"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-builder-text-muted">{getIcon()}</span>
          <span className="text-sm font-medium text-builder-text truncate">
            {elementTypeLabels[selection.elementType]}
            {selection.elementType === 'option' && selection.optionIndex !== undefined && (
              <span className="text-builder-text-muted ml-1">#{selection.optionIndex + 1}</span>
            )}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderElementContent()}
      </div>
    </div>
  );
};
