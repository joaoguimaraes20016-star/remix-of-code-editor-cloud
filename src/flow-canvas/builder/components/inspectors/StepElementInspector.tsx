import React, { useState } from 'react';
import { Block, ApplicationFlowSettings } from '../../../types/infostack';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronDown,
  ChevronRight,
  Type, 
  MousePointer2, 
  Palette,
  Settings2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  TextCursor,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPickerPopover } from '../modals';
import { ButtonActionSelector, type ButtonAction } from '../ButtonActionSelector';

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

// Collapsible section component
const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-builder-border">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-builder-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-builder-text-muted">{icon}</span>}
          <span className="text-xs font-medium text-builder-text">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-builder-text-dim" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-builder-text-dim" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

// Field group with label
const FieldGroup: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-builder-text-muted">{label}</Label>
    {children}
    {hint && <p className="text-[10px] text-builder-text-dim">{hint}</p>}
  </div>
);

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

  // Update capture field
  const updateCaptureField = (fieldIndex: number, updates: Record<string, any>) => {
    const fields = [...(stepSettings.captureFields || [])];
    fields[fieldIndex] = { ...fields[fieldIndex], ...updates };
    updateStepSetting('captureFields', fields);
  };

  const renderTitleEditor = () => (
    <div className="flex flex-col h-full min-h-0 bg-builder-bg">
      <CollapsibleSection title="Content" icon={<Type className="w-3.5 h-3.5" />} defaultOpen>
        <FieldGroup label="Title Text">
          <Input
            value={stepSettings.title || ''}
            onChange={(e) => updateStepSetting('title', e.target.value)}
            placeholder="Enter title..."
            className="text-sm"
          />
        </FieldGroup>
      </CollapsibleSection>
      
      <CollapsibleSection title="Style" icon={<Palette className="w-3.5 h-3.5" />} defaultOpen>
        <FieldGroup label="Size">
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
              <SelectItem value="xl">X-Large</SelectItem>
              <SelectItem value="2xl">Huge</SelectItem>
              <SelectItem value="3xl">Giant</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>
        
        <FieldGroup label="Alignment">
          <div className="flex rounded-md overflow-hidden border border-builder-border">
            {[
              { value: 'left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
              { value: 'center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
              { value: 'right', icon: <AlignRight className="w-3.5 h-3.5" /> },
            ].map((align) => (
              <button
                key={align.value}
                type="button"
                onClick={() => updateStepSetting('titleAlign', align.value)}
                className={cn(
                  'flex-1 px-2 py-1.5 transition-colors',
                  (stepSettings.titleAlign || 'center') === align.value
                    ? 'bg-foreground text-background' 
                    : 'bg-background text-muted-foreground hover:bg-accent'
                )}
              >
                {align.icon}
              </button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Color">
          <ColorPickerPopover
            color={stepSettings.titleColor || '#000000'}
            onChange={(color) => updateStepSetting('titleColor', color)}
          >
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
              <div 
                className="w-5 h-5 rounded border border-border"
                style={{ backgroundColor: stepSettings.titleColor || '#000000' }}
              />
              <span className="text-xs text-foreground font-mono">{stepSettings.titleColor || '#000000'}</span>
            </button>
          </ColorPickerPopover>
        </FieldGroup>
      </CollapsibleSection>
    </div>
  );

  const renderDescriptionEditor = () => (
    <div className="flex flex-col h-full min-h-0 bg-builder-bg">
      <CollapsibleSection title="Content" icon={<Type className="w-3.5 h-3.5" />} defaultOpen>
        <FieldGroup label="Description Text">
          <Textarea
            value={stepSettings.description || ''}
            onChange={(e) => updateStepSetting('description', e.target.value)}
            placeholder="Enter description..."
            className="text-sm min-h-[80px]"
          />
        </FieldGroup>
      </CollapsibleSection>
      
      <CollapsibleSection title="Style" icon={<Palette className="w-3.5 h-3.5" />} defaultOpen>
        <FieldGroup label="Alignment">
          <div className="flex rounded-md overflow-hidden border border-builder-border">
            {[
              { value: 'left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
              { value: 'center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
              { value: 'right', icon: <AlignRight className="w-3.5 h-3.5" /> },
            ].map((align) => (
              <button
                key={align.value}
                type="button"
                onClick={() => updateStepSetting('descriptionAlign', align.value)}
                className={cn(
                  'flex-1 px-2 py-1.5 transition-colors',
                  (stepSettings.descriptionAlign || 'center') === align.value
                    ? 'bg-foreground text-background' 
                    : 'bg-background text-muted-foreground hover:bg-accent'
                )}
              >
                {align.icon}
              </button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Color">
          <ColorPickerPopover
            color={stepSettings.descriptionColor || '#666666'}
            onChange={(color) => updateStepSetting('descriptionColor', color)}
          >
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
              <div 
                className="w-5 h-5 rounded border border-border"
                style={{ backgroundColor: stepSettings.descriptionColor || '#666666' }}
              />
              <span className="text-xs text-foreground font-mono">{stepSettings.descriptionColor || '#666666'}</span>
            </button>
          </ColorPickerPopover>
        </FieldGroup>
      </CollapsibleSection>
    </div>
  );

  const renderButtonEditor = () => {
    const buttonAction = stepSettings.buttonAction as ButtonAction | undefined;
    
    // Get available steps for "Go To Step" action (exclude current step)
    const availableSteps = steps
      .filter(s => s.id !== step.id)
      .map(s => ({ id: s.id, name: s.name }));

    return (
      <div className="flex flex-col h-full min-h-0 bg-builder-bg">
        <CollapsibleSection title="Content" icon={<Type className="w-3.5 h-3.5" />} defaultOpen>
          <FieldGroup label="Button Text">
            <Input
              value={stepSettings.buttonText || 'Continue'}
              onChange={(e) => updateStepSetting('buttonText', e.target.value)}
              placeholder="Continue"
              className="text-sm"
            />
          </FieldGroup>
        </CollapsibleSection>
        
        <CollapsibleSection title="On Click" icon={<MousePointer2 className="w-3.5 h-3.5" />} defaultOpen>
          <ButtonActionSelector
            action={buttonAction}
            onChange={(action) => updateStepSetting('buttonAction', action)}
            availableSteps={availableSteps}
            stepType={step.type as 'welcome' | 'question' | 'capture' | 'ending'}
          />
        </CollapsibleSection>
        
        <CollapsibleSection title="Preset" icon={<Palette className="w-3.5 h-3.5" />}>
          <FieldGroup label="Button Preset" hint="Button styling is controlled by the shared Button system">
            <Select
              value={stepSettings.buttonPreset || 'primary'}
              onValueChange={(value) => updateStepSetting('buttonPreset', value)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </CollapsibleSection>
      </div>
    );
  };

  const renderOptionEditor = () => {
    const optionIndex = selection.optionIndex ?? 0;
    const options = stepSettings.options || [];
    const optionValue = options[optionIndex] || '';
    
    return (
      <div className="flex flex-col h-full min-h-0 bg-builder-bg">
        <CollapsibleSection title="Content" icon={<Type className="w-3.5 h-3.5" />} defaultOpen>
          <FieldGroup label={`Option ${optionIndex + 1} Text`}>
            <Input
              value={optionValue}
              onChange={(e) => updateOption(optionIndex, e.target.value)}
              placeholder="Option text..."
              className="text-sm"
            />
          </FieldGroup>
          
          <div className="pt-2 border-t border-builder-border">
            <Label className="text-xs text-builder-text-dim mb-2 block">All Options</Label>
            <div className="space-y-1.5">
              {options.map((opt: string, i: number) => (
                <div 
                  key={i}
                  className={cn(
                    "px-2 py-1.5 text-xs rounded cursor-pointer transition-colors",
                    i === optionIndex 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "bg-builder-surface text-builder-text-muted hover:bg-builder-surface-hover"
                  )}
                  onClick={() => onBack()}
                >
                  {opt || `Option ${i + 1}`}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Style" icon={<Palette className="w-3.5 h-3.5" />}>
          <FieldGroup label="Option Style">
            <Select
              value={stepSettings.optionStyle || 'outlined'}
              onValueChange={(value) => updateStepSetting('optionStyle', value)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outlined">Outlined</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Border Radius">
            <div className="flex items-center gap-3">
              <Slider
                value={[stepSettings.optionRadius || 8]}
                onValueChange={([value]) => updateStepSetting('optionRadius', value)}
                min={0}
                max={24}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-builder-text-muted w-10 text-right">{stepSettings.optionRadius || 8}px</span>
            </div>
          </FieldGroup>
          
          <FieldGroup label="Selected Color">
            <ColorPickerPopover
              color={stepSettings.optionSelectedBg || '#000000'}
              onChange={(color) => updateStepSetting('optionSelectedBg', color)}
            >
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <div 
                  className="w-5 h-5 rounded border border-border"
                  style={{ backgroundColor: stepSettings.optionSelectedBg || '#000000' }}
                />
                <span className="text-xs text-foreground font-mono">{stepSettings.optionSelectedBg || '#000000'}</span>
              </button>
            </ColorPickerPopover>
          </FieldGroup>
        </CollapsibleSection>
        
        <CollapsibleSection title="Settings" icon={<Settings2 className="w-3.5 h-3.5" />}>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-builder-text">Allow Multiple</Label>
              <p className="text-[10px] text-builder-text-dim">Let users select multiple options</p>
            </div>
            <Switch
              checked={stepSettings.multiSelect || false}
              onCheckedChange={(checked) => updateStepSetting('multiSelect', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-builder-text">Required</Label>
              <p className="text-[10px] text-builder-text-dim">Must select to continue</p>
            </div>
            <Switch
              checked={stepSettings.required ?? true}
              onCheckedChange={(checked) => updateStepSetting('required', checked)}
            />
          </div>
        </CollapsibleSection>
      </div>
    );
  };

  const renderInputEditor = () => {
    // For capture steps, we may have multiple fields - get the specific field
    const captureFields = stepSettings.captureFields || [];
    const fieldIndex = selection.optionIndex ?? 0; // Reuse optionIndex for field index
    const field = captureFields[fieldIndex] || {};
    
    return (
      <div className="flex flex-col h-full min-h-0 bg-builder-bg">
        <CollapsibleSection title="Content" icon={<Type className="w-3.5 h-3.5" />} defaultOpen>
          <FieldGroup label="Label">
            <Input
              value={field.label || stepSettings.placeholder || ''}
              onChange={(e) => {
                if (captureFields.length > 0) {
                  updateCaptureField(fieldIndex, { label: e.target.value });
                } else {
                  updateStepSetting('placeholder', e.target.value);
                }
              }}
              placeholder="Field label..."
              className="text-sm"
            />
          </FieldGroup>
          
          <FieldGroup label="Placeholder">
            <Input
              value={field.placeholder || stepSettings.inputPlaceholder || ''}
              onChange={(e) => {
                if (captureFields.length > 0) {
                  updateCaptureField(fieldIndex, { placeholder: e.target.value });
                } else {
                  updateStepSetting('inputPlaceholder', e.target.value);
                }
              }}
              placeholder="Type your answer..."
              className="text-sm"
            />
          </FieldGroup>
        </CollapsibleSection>
        
        <CollapsibleSection title="Field" icon={<TextCursor className="w-3.5 h-3.5" />} defaultOpen>
          <FieldGroup label="Accepts">
            <Select
              value={field.type || stepSettings.inputType || 'text'}
              onValueChange={(value) => {
                if (captureFields.length > 0) {
                  updateCaptureField(fieldIndex, { type: value });
                } else {
                  updateStepSetting('inputType', value);
                }
              }}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Short Text</SelectItem>
                <SelectItem value="email">Email Address</SelectItem>
                <SelectItem value="phone">Phone Number</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="textarea">Paragraph</SelectItem>
                <SelectItem value="url">Website</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </CollapsibleSection>
        
        <CollapsibleSection title="Style" icon={<Palette className="w-3.5 h-3.5" />}>
          <FieldGroup label="Input Style">
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
          </FieldGroup>
          
          <FieldGroup label="Border Radius">
            <div className="flex items-center gap-3">
              <Slider
                value={[stepSettings.inputRadius || 8]}
                onValueChange={([value]) => updateStepSetting('inputRadius', value)}
                min={0}
                max={24}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-builder-text-muted w-10 text-right">{stepSettings.inputRadius || 8}px</span>
            </div>
          </FieldGroup>
        </CollapsibleSection>
        
        <CollapsibleSection title="Validation" icon={<Settings2 className="w-3.5 h-3.5" />}>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-builder-text">Required</Label>
              <p className="text-[10px] text-builder-text-dim">Must fill to continue</p>
            </div>
            <Switch
              checked={field.required ?? stepSettings.inputRequired ?? true}
              onCheckedChange={(checked) => {
                if (captureFields.length > 0) {
                  updateCaptureField(fieldIndex, { required: checked });
                } else {
                  updateStepSetting('inputRequired', checked);
                }
              }}
            />
          </div>
        </CollapsibleSection>
      </div>
    );
  };

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
        return <TextCursor className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header with back button */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-builder-border bg-gradient-to-r from-primary/10 to-transparent">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-7 px-2 text-builder-text-muted hover:text-builder-text"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-primary">{getIcon()}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-builder-text truncate block">
              {elementTypeLabels[selection.elementType]}
              {selection.elementType === 'option' && selection.optionIndex !== undefined && (
                <span className="text-builder-text-muted ml-1">#{selection.optionIndex + 1}</span>
              )}
            </span>
            <span className="text-[10px] text-builder-text-muted">{step.name}</span>
          </div>
        </div>
      </div>
      
      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto builder-scroll">
        {renderElementContent()}
      </div>
    </div>
  );
};