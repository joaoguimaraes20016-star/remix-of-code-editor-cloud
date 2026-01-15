/**
 * InteractiveBlockInspector
 * 
 * Full-featured inspector for standalone interactive blocks (form-field, open-question, etc.)
 * Provides the same styling controls as StepContentEditor for parity.
 * 
 * Provides editing controls for:
 * - Question/heading text
 * - Input type and settings
 * - Button text, colors, gradients, size, corners
 * - Background styling (solid/gradient)
 * - Popup opt-in settings (for contact info blocks)
 * - Field validation settings
 */

import React, { useState } from 'react';
import { Block, Element } from '../../../types/infostack';
import { cn } from '@/lib/utils';
import { 
  HelpCircle, 
  Type, 
  Settings2, 
  Palette,
  ChevronDown,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Circle,
  Square,
  Maximize2,
  Eye,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPickerPopover, GradientPickerPopover, gradientToCSS, defaultGradient, GradientValue } from '../modals';

interface InteractiveBlockInspectorProps {
  block: Block;
  onUpdateBlock: (updates: Partial<Block>) => void;
}

// Collapsible section component
const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-xs font-medium text-foreground">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
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
const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</Label>
    {children}
  </div>
);

export const InteractiveBlockInspector: React.FC<InteractiveBlockInspectorProps> = ({
  block,
  onUpdateBlock,
}) => {
  // Extract elements from the block
  const elements = block.elements || [];
  
  // Find key elements by type
  const headingElement = elements.find(el => el.type === 'heading');
  const textElement = elements.find(el => el.type === 'text' && el.id !== headingElement?.id);
  const inputElement = elements.find(el => el.type === 'input');
  const buttonElement = elements.find(el => el.type === 'button');
  
  // Get block props for styling
  const blockProps = block.props || {};
  
  // Check if this is a contact info block (can show as popup)
  const isContactInfoBlock = block.label?.toLowerCase().includes('contact') || 
    elements.filter(el => el.type === 'input').length >= 2;

  // Helper to update a specific element
  const updateElement = (elementId: string, updates: Partial<Element>) => {
    const newElements = elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    onUpdateBlock({ elements: newElements });
  };

  // Helper to update element props
  const updateElementProps = (elementId: string, propUpdates: Record<string, unknown>) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      updateElement(elementId, { 
        props: { ...element.props, ...propUpdates } 
      });
    }
  };

  // Helper to update block props
  const updateBlockProps = (propUpdates: Record<string, unknown>) => {
    onUpdateBlock({ props: { ...blockProps, ...propUpdates } });
  };

  // Get input type
  const inputType = inputElement?.props?.type as string || inputElement?.props?.inputType as string || 'text';
  const placeholder = inputElement?.props?.placeholder as string || '';
  const isRequired = inputElement?.props?.required as boolean || false;
  const fieldKey = inputElement?.props?.fieldKey as string || '';

  // Get styling props
  const buttonColor = buttonElement?.props?.buttonColor as string || blockProps.buttonColor as string || '#18181b';
  const buttonTextColor = buttonElement?.props?.buttonTextColor as string || blockProps.buttonTextColor as string || '#ffffff';
  const buttonFillType = blockProps.buttonFillType as 'solid' | 'gradient' || 'solid';
  const buttonGradient = blockProps.buttonGradient as GradientValue | undefined;
  const buttonSize = blockProps.buttonSize as 'sm' | 'md' | 'lg' || 'md';
  const buttonRadius = blockProps.buttonRadius as 'none' | 'rounded' | 'full' || 'rounded';
  const buttonFullWidth = blockProps.buttonFullWidth as boolean || false;
  
  // Background styling
  const backgroundType = blockProps.backgroundType as 'solid' | 'gradient' || 'solid';
  const backgroundColor = blockProps.backgroundColor as string || '#ffffff';
  const backgroundGradient = blockProps.backgroundGradient as GradientValue | undefined;
  
  // Popup opt-in settings
  const showAsPopup = blockProps.showAsPopup as boolean || false;
  const requireCompletion = blockProps.requireCompletion as boolean || false;

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
            <HelpCircle className="w-3 h-3 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{block.label || 'Input Field'}</div>
            <div className="text-[10px] text-muted-foreground">Interactive Block</div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Popup Opt-In Settings (for Contact Info blocks) */}
        {isContactInfoBlock && (
          <CollapsibleSection title="Popup Behavior" icon={<Eye className="w-3.5 h-3.5" />}>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-foreground">Show as Popup</Label>
                <p className="text-[10px] text-muted-foreground">Display as modal on page load</p>
              </div>
              <Switch
                checked={showAsPopup}
                onCheckedChange={(checked) => updateBlockProps({ showAsPopup: checked })}
              />
            </div>
            
            {showAsPopup && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-foreground">Require Completion</Label>
                  <p className="text-[10px] text-muted-foreground">Must submit before seeing content</p>
                </div>
                <Switch
                  checked={requireCompletion}
                  onCheckedChange={(checked) => updateBlockProps({ requireCompletion: checked })}
                />
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Content Section */}
        <CollapsibleSection title="Content" icon={<Type className="w-3.5 h-3.5" />} defaultOpen>
          {/* Heading */}
          {headingElement && (
            <FieldGroup label="Heading">
              <Input
                value={headingElement.content || ''}
                onChange={(e) => updateElement(headingElement.id, { content: e.target.value })}
                placeholder="Enter heading..."
                className="h-8 text-sm"
              />
            </FieldGroup>
          )}

          {/* Description */}
          {textElement && (
            <FieldGroup label="Description">
              <Textarea
                value={textElement.content || ''}
                onChange={(e) => updateElement(textElement.id, { content: e.target.value })}
                placeholder="Enter description..."
                className="text-sm resize-none"
                rows={2}
              />
            </FieldGroup>
          )}

          {/* Button Text */}
          {buttonElement && (
            <FieldGroup label="Button Text">
              <Input
                value={buttonElement.content || ''}
                onChange={(e) => updateElement(buttonElement.id, { content: e.target.value })}
                placeholder="Continue"
                className="h-8 text-sm"
              />
            </FieldGroup>
          )}
        </CollapsibleSection>

        {/* Input Settings Section */}
        {inputElement && (
          <CollapsibleSection title="Input Settings" icon={<Settings2 className="w-3.5 h-3.5" />} defaultOpen>
            {/* Input Type */}
            <FieldGroup label="Input Type">
              <Select 
                value={inputType}
                onValueChange={(value) => updateElementProps(inputElement.id, { type: value, inputType: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>

            {/* Field Key */}
            <FieldGroup label="Field Key">
              <Input
                value={fieldKey}
                onChange={(e) => updateElementProps(inputElement.id, { fieldKey: e.target.value })}
                placeholder="email, phone, name..."
                className="h-8 text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Used to identify this field in form data</p>
            </FieldGroup>

            {/* Placeholder */}
            <FieldGroup label="Placeholder">
              <Input
                value={placeholder}
                onChange={(e) => updateElementProps(inputElement.id, { placeholder: e.target.value })}
                placeholder="Enter placeholder text..."
                className="h-8 text-sm"
              />
            </FieldGroup>

            {/* Required Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Required</Label>
              <Switch
                checked={isRequired}
                onCheckedChange={(checked) => updateElementProps(inputElement.id, { required: checked })}
              />
            </div>
          </CollapsibleSection>
        )}

        {/* Button Style Section */}
        {buttonElement && (
          <CollapsibleSection title="Button Style" icon={<Palette className="w-3.5 h-3.5" />}>
            {/* Button Fill Type */}
            <FieldGroup label="Fill Type">
              <div className="flex rounded-md overflow-hidden border border-border">
                <button
                  onClick={() => updateBlockProps({ buttonFillType: 'solid' })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                    buttonFillType === 'solid'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  Solid
                </button>
                <button
                  onClick={() => updateBlockProps({ buttonFillType: 'gradient' })}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                    buttonFillType === 'gradient'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  Gradient
                </button>
              </div>
            </FieldGroup>

            {/* Button Color (Solid) or Gradient */}
            {buttonFillType === 'gradient' ? (
              <FieldGroup label="Button Gradient">
                <GradientPickerPopover
                  value={buttonGradient || null}
                  onChange={(gradient) => updateBlockProps({ buttonGradient: gradient })}
                >
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors border border-border">
                    <div 
                      className="w-6 h-6 rounded border border-border"
                      style={{ background: buttonGradient ? gradientToCSS(buttonGradient) : gradientToCSS(defaultGradient) }}
                    />
                    <span className="text-xs text-foreground">Edit Gradient</span>
                  </button>
                </GradientPickerPopover>
              </FieldGroup>
            ) : (
              <FieldGroup label="Button Color">
                <ColorPickerPopover
                  color={buttonColor}
                  onChange={(color) => updateBlockProps({ buttonColor: color })}
                >
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors border border-border">
                    <div 
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: buttonColor }}
                    />
                    <span className="text-xs text-foreground font-mono">{buttonColor}</span>
                  </button>
                </ColorPickerPopover>
              </FieldGroup>
            )}

            {/* Button Text Color */}
            <FieldGroup label="Button Text Color">
              <ColorPickerPopover
                color={buttonTextColor}
                onChange={(color) => updateBlockProps({ buttonTextColor: color })}
              >
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors border border-border">
                  <div 
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: buttonTextColor }}
                  />
                  <span className="text-xs text-foreground font-mono">{buttonTextColor}</span>
                </button>
              </ColorPickerPopover>
            </FieldGroup>

            {/* Button Size */}
            <FieldGroup label="Button Size">
              <div className="flex rounded-md overflow-hidden border border-border">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateBlockProps({ buttonSize: size })}
                    className={cn(
                      'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors uppercase',
                      buttonSize === size
                        ? 'bg-foreground text-background'
                        : 'bg-background text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </FieldGroup>

            {/* Button Corners */}
            <FieldGroup label="Button Corners">
              <div className="flex rounded-md overflow-hidden border border-border">
                <button
                  onClick={() => updateBlockProps({ buttonRadius: 'none' })}
                  className={cn(
                    'flex-1 px-2 py-1.5 transition-colors flex items-center justify-center',
                    buttonRadius === 'none'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateBlockProps({ buttonRadius: 'rounded' })}
                  className={cn(
                    'flex-1 px-2 py-1.5 transition-colors flex items-center justify-center',
                    buttonRadius === 'rounded'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <div className="w-3.5 h-3.5 border-2 border-current rounded" />
                </button>
                <button
                  onClick={() => updateBlockProps({ buttonRadius: 'full' })}
                  className={cn(
                    'flex-1 px-2 py-1.5 transition-colors flex items-center justify-center',
                    buttonRadius === 'full'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Circle className="w-3.5 h-3.5" />
                </button>
              </div>
            </FieldGroup>

            {/* Full Width Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Full Width Button</Label>
              <Switch
                checked={buttonFullWidth}
                onCheckedChange={(checked) => updateBlockProps({ buttonFullWidth: checked })}
              />
            </div>
          </CollapsibleSection>
        )}

        {/* Background Section */}
        <CollapsibleSection title="Background" icon={<Palette className="w-3.5 h-3.5" />}>
          {/* Background Type */}
          <FieldGroup label="Background Type">
            <div className="flex rounded-md overflow-hidden border border-border">
              <button
                onClick={() => updateBlockProps({ backgroundType: 'solid' })}
                className={cn(
                  'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                  backgroundType === 'solid'
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:bg-accent'
                )}
              >
                Solid
              </button>
              <button
                onClick={() => updateBlockProps({ backgroundType: 'gradient' })}
                className={cn(
                  'flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors',
                  backgroundType === 'gradient'
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:bg-accent'
                )}
              >
                Gradient
              </button>
            </div>
          </FieldGroup>

          {/* Background Color/Gradient */}
          {backgroundType === 'gradient' ? (
            <FieldGroup label="Background Gradient">
              <GradientPickerPopover
                value={backgroundGradient || null}
                onChange={(gradient) => updateBlockProps({ backgroundGradient: gradient })}
              >
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors border border-border">
                  <div 
                    className="w-6 h-6 rounded border border-border"
                    style={{ background: backgroundGradient ? gradientToCSS(backgroundGradient) : gradientToCSS(defaultGradient) }}
                  />
                  <span className="text-xs text-foreground">Edit Gradient</span>
                </button>
              </GradientPickerPopover>
            </FieldGroup>
          ) : (
            <FieldGroup label="Background Color">
              <ColorPickerPopover
                color={backgroundColor}
                onChange={(color) => updateBlockProps({ backgroundColor: color })}
              >
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors border border-border">
                  <div 
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: backgroundColor }}
                  />
                  <span className="text-xs text-foreground font-mono">{backgroundColor}</span>
                </button>
              </ColorPickerPopover>
            </FieldGroup>
          )}

          {/* Text Alignment */}
          {headingElement && (
            <FieldGroup label="Text Alignment">
              <div className="flex gap-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateElementProps(headingElement.id, { textAlign: value })}
                    className={cn(
                      'flex-1 p-2 rounded border transition-colors',
                      (headingElement.props?.textAlign || 'center') === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <Icon className="w-4 h-4 mx-auto text-muted-foreground" />
                  </button>
                ))}
              </div>
            </FieldGroup>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default InteractiveBlockInspector;
