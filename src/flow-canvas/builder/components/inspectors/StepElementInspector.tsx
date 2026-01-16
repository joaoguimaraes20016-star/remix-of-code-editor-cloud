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
  User,
  UserCircle,
  Mail,
  AtSign,
  Phone,
  Smartphone,
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
import { ButtonStyleInspector, type ButtonStyleSettings } from '@/components/builder/ButtonStyleInspector';
import { 
  getDefaultCaptureIcon, 
  getDefaultCapturePlaceholder,
  type CaptureIconType 
} from '../../utils/stepRenderHelpers';

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

// Collapsible section component - using forwardRef to avoid Radix warnings
interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection = React.forwardRef<HTMLDivElement, CollapsibleSectionProps>(
  ({ title, icon, defaultOpen = false, children }, ref) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <div ref={ref} className="border-b border-builder-border">
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
  }
);
CollapsibleSection.displayName = 'CollapsibleSection';

// Field group with label - using forwardRef to avoid Radix warnings
interface FieldGroupProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ label, children, hint }, ref) => (
    <div ref={ref} className="space-y-1.5">
      <Label className="text-xs text-builder-text-muted">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-builder-text-dim">{hint}</p>}
    </div>
  )
);
FieldGroup.displayName = 'FieldGroup';

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
  const updateStepSettings = (updates: Record<string, any>) => {
    const newSteps = steps.map((s) =>
      s.id === step.id
        ? { ...s, settings: { ...((s as any).settings || {}), ...updates } }
        : s
    );
    onUpdateBlock({ props: { ...settings, steps: newSteps } });
  };

  const updateStepSetting = (key: string, value: any) => {
    updateStepSettings({ [key]: value });
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
        <FieldGroup label="Text Size">
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
        
        <FieldGroup label="Alignment" hint="Aligns all step content">
          <div className="flex rounded-md overflow-hidden border border-builder-border">
            {[
              { value: 'left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
              { value: 'center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
              { value: 'right', icon: <AlignRight className="w-3.5 h-3.5" /> },
            ].map((alignOpt) => (
              <button
                key={alignOpt.value}
                type="button"
                onClick={() => updateStepSetting('align', alignOpt.value)}
                className={cn(
                  'flex-1 px-2 py-1.5 transition-colors',
                  (stepSettings.align || 'center') === alignOpt.value
                    ? 'bg-foreground text-background' 
                    : 'bg-background text-muted-foreground hover:bg-accent'
                )}
              >
                {alignOpt.icon}
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
        <FieldGroup label="Text Size">
          <Select
            value={stepSettings.descriptionSize || 'sm'}
            onValueChange={(value) => updateStepSetting('descriptionSize', value)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xs">Extra Small</SelectItem>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="base">Normal</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
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

    const currentFillType: ButtonStyleSettings['fillType'] =
      stepSettings.buttonPreset === 'outline'
        ? 'outline'
        : stepSettings.buttonPreset === 'gradient' || stepSettings.buttonGradient
          ? 'gradient'
          : 'solid';

    // Extract button style settings from step settings
    const buttonStyleSettings: ButtonStyleSettings = {
      preset: stepSettings.buttonPreset || 'primary',
      fillType: currentFillType,
      backgroundColor: stepSettings.buttonColor,
      textColor: stepSettings.buttonTextColor,
      gradient: stepSettings.buttonGradient,
      size: stepSettings.buttonSize || 'md',
      borderRadius: stepSettings.buttonRadius ?? 12,
      shadow: stepSettings.buttonShadow || 'none',
      fullWidth: stepSettings.buttonFullWidth ?? false,
      customWidth: stepSettings.buttonCustomWidth,
      icon: stepSettings.buttonIcon || 'ArrowRight',
      showIcon: stepSettings.buttonShowIcon,
    };

    // Handle button style updates (BATCHED to avoid lost updates)
    const handleButtonStyleChange = (updates: Partial<ButtonStyleSettings>) => {
      const mapped: Record<string, any> = {};

      // Preset: ignore 'custom' as a stored preset (it's just a UI mode)
      if (updates.preset !== undefined && updates.preset !== 'custom') {
        mapped.buttonPreset = updates.preset;
      }

      // Fill mode: map to stored preset + supporting fields
      if (updates.fillType !== undefined) {
        if (updates.fillType === 'outline') {
          mapped.buttonPreset = 'outline';
          mapped.buttonGradient = undefined;
          mapped.buttonColor = 'transparent';
        }
        if (updates.fillType === 'solid') {
          // If we were outline/gradient, reset to primary for proper variant rendering
          if (stepSettings.buttonPreset === 'outline' || stepSettings.buttonPreset === 'gradient') {
            mapped.buttonPreset = 'primary';
          }
          mapped.buttonGradient = undefined;
        }
        if (updates.fillType === 'gradient') {
          mapped.buttonPreset = 'gradient';
          // buttonGradient will be set below from updates.gradient
        }
      }

      if (updates.backgroundColor !== undefined) {
        mapped.buttonColor = updates.backgroundColor;
        // If user chooses a solid background while in outline, ensure we render as filled
        if (stepSettings.buttonPreset === 'outline') {
          mapped.buttonPreset = 'primary';
        }
      }

      if (updates.textColor !== undefined) mapped.buttonTextColor = updates.textColor;

      if (updates.gradient !== undefined) {
        mapped.buttonGradient = updates.gradient;
        mapped.buttonPreset = 'gradient';
      }

      if (updates.size !== undefined) mapped.buttonSize = updates.size;
      if (updates.borderRadius !== undefined) mapped.buttonRadius = updates.borderRadius;
      if (updates.shadow !== undefined) mapped.buttonShadow = updates.shadow;
      if (updates.icon !== undefined) mapped.buttonIcon = updates.icon;
      if (updates.showIcon !== undefined) mapped.buttonShowIcon = updates.showIcon;

      // Width handling
      if (updates.widthMode !== undefined) {
        if (updates.widthMode === 'full') {
          mapped.buttonFullWidth = true;
          mapped.buttonCustomWidth = undefined;
        } else if (updates.widthMode === 'fixed') {
          mapped.buttonFullWidth = false;
          mapped.buttonCustomWidth = updates.customWidth ?? stepSettings.buttonCustomWidth ?? 200;
        } else {
          mapped.buttonFullWidth = false;
          mapped.buttonCustomWidth = undefined;
        }
      }

      // Direct updates (e.g. numeric input)
      if (updates.fullWidth !== undefined) {
        mapped.buttonFullWidth = updates.fullWidth;
        if (updates.fullWidth) mapped.buttonCustomWidth = undefined;
      }
      if (updates.customWidth !== undefined) {
        mapped.buttonCustomWidth = updates.customWidth;
        mapped.buttonFullWidth = false;
      }

      if (Object.keys(mapped).length > 0) {
        updateStepSettings(mapped);
      }
    };

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
        
        {/* Shared Button Style Inspector - same controls for ALL buttons */}
        <ButtonStyleInspector
          settings={buttonStyleSettings}
          onChange={handleButtonStyleChange}
          showPreset
          showFullWidth
          primaryColor={stepSettings.buttonColor || '#3B82F6'}
        />
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
    const isCaptureStep = step.type === 'capture';
    const fieldIndex = selection.optionIndex ?? 0;
    
    // For capture steps, map index to field type (name=0, email=1, phone=2)
    const captureFieldTypes: Array<'name' | 'email' | 'phone'> = ['name', 'email', 'phone'];
    const fieldType = isCaptureStep ? captureFieldTypes[fieldIndex] : null;
    
    // Icon options for capture fields
    const CAPTURE_ICON_OPTIONS: Array<{ value: CaptureIconType; label: string; icon: React.ReactNode }> = [
      { value: 'none', label: 'None', icon: null },
      { value: 'user', label: 'User', icon: <User className="w-4 h-4" /> },
      { value: 'user-circle', label: 'User Circle', icon: <UserCircle className="w-4 h-4" /> },
      { value: 'mail', label: 'Mail', icon: <Mail className="w-4 h-4" /> },
      { value: 'at-sign', label: 'At Sign', icon: <AtSign className="w-4 h-4" /> },
      { value: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
      { value: 'smartphone', label: 'Smartphone', icon: <Smartphone className="w-4 h-4" /> },
    ];
    
    // Helpers to get/set field-specific values for capture steps
    const getPlaceholder = (): string => {
      if (isCaptureStep && fieldType) {
        const key = `capture${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}Placeholder` as keyof typeof stepSettings;
        return (stepSettings[key] as string) || getDefaultCapturePlaceholder(fieldType);
      }
      return stepSettings.inputPlaceholder || '';
    };
    
    const setPlaceholder = (value: string) => {
      if (isCaptureStep && fieldType) {
        const key = `capture${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}Placeholder`;
        updateStepSetting(key, value);
      } else {
        updateStepSetting('inputPlaceholder', value);
      }
    };
    
    const getIcon = (): CaptureIconType => {
      if (isCaptureStep && fieldType) {
        const key = `capture${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}Icon` as keyof typeof stepSettings;
        return (stepSettings[key] as CaptureIconType) || getDefaultCaptureIcon(fieldType);
      }
      return 'none';
    };
    
    const setIcon = (value: CaptureIconType) => {
      if (isCaptureStep && fieldType) {
        const key = `capture${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}Icon`;
        updateStepSetting(key, value);
      }
    };
    
    // Get field label for display
    const getFieldLabel = (): string => {
      if (fieldType) {
        return fieldType.charAt(0).toUpperCase() + fieldType.slice(1);
      }
      return 'Input';
    };
    
    return (
      <div className="flex flex-col h-full min-h-0 bg-builder-bg">
        <CollapsibleSection title="Content" icon={<Type className="w-3.5 h-3.5" />} defaultOpen>
          {isCaptureStep && (
            <div className="mb-2 px-2 py-1.5 bg-primary/10 rounded text-xs text-primary">
              Editing: {getFieldLabel()} Field
            </div>
          )}
          
          <FieldGroup label="Placeholder">
            <Input
              value={getPlaceholder()}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Type your answer..."
              className="text-sm"
            />
          </FieldGroup>
          
          {isCaptureStep && fieldType && (
            <FieldGroup label="Icon">
              <Select
                value={getIcon()}
                onValueChange={(value) => setIcon(value as CaptureIconType)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAPTURE_ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
        </CollapsibleSection>
        
        {!isCaptureStep && (
          <CollapsibleSection title="Field" icon={<TextCursor className="w-3.5 h-3.5" />} defaultOpen>
            <FieldGroup label="Accepts">
              <Select
                value={stepSettings.inputType || 'text'}
                onValueChange={(value) => updateStepSetting('inputType', value)}
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
        )}
        
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
              checked={stepSettings.inputRequired ?? true}
              onCheckedChange={(checked) => updateStepSetting('inputRequired', checked)}
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