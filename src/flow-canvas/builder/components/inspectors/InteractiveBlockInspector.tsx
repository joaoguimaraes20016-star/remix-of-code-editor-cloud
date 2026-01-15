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
  MousePointer2,
  ArrowRight,
  Layers,
  Send,
  ExternalLink,
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
import type { ButtonAction, ButtonActionType } from '../modals/ButtonActionModal';

interface InteractiveBlockInspectorProps {
  block: Block;
  onUpdateBlock: (updates: Partial<Block>) => void;
  steps?: { id: string; name: string }[];
}

// Collapsible section component - uses builder tokens for consistency
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

// Field group with label - uses builder tokens
const FieldGroup: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-builder-text-muted">{label}</Label>
    {children}
    {hint && <p className="text-[10px] text-builder-text-dim">{hint}</p>}
  </div>
);

export const InteractiveBlockInspector: React.FC<InteractiveBlockInspectorProps> = ({
  block,
  onUpdateBlock,
  steps = [],
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

  // Helper to update element styles
  const updateElementStyles = (elementId: string, styleUpdates: Record<string, string | undefined>) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      updateElement(elementId, { 
        styles: { ...element.styles, ...styleUpdates } as Record<string, string>
      });
    }
  };

  // Helper to update both element props and styles atomically
  const updateButtonStyle = (updates: {
    props?: Record<string, unknown>;
    styles?: Record<string, string | undefined>;
  }) => {
    if (!buttonElement) return;
    const newElements = elements.map(el => {
      if (el.id === buttonElement.id) {
        return {
          ...el,
          props: updates.props ? { ...el.props, ...updates.props } : el.props,
          styles: updates.styles ? { ...el.styles, ...updates.styles } as Record<string, string> : el.styles,
        };
      }
      return el;
    });
    onUpdateBlock({ elements: newElements });
  };

  // Helper to update block props (for non-styling settings like popup behavior)
  const updateBlockProps = (propUpdates: Record<string, unknown>) => {
    onUpdateBlock({ props: { ...blockProps, ...propUpdates } });
  };

  // Helper to update block styles (for background, border, etc.) - SINGLE SOURCE OF TRUTH
  const updateBlockStyles = (styleUpdates: Record<string, string | undefined>) => {
    const currentStyles = block.styles || {};
    onUpdateBlock({ 
      styles: { ...currentStyles, ...styleUpdates } as Record<string, string>
    });
  };

  // Get input type
  const inputType = inputElement?.props?.type as string || inputElement?.props?.inputType as string || 'text';
  const placeholder = inputElement?.props?.placeholder as string || '';
  const isRequired = inputElement?.props?.required as boolean || false;
  const fieldKey = inputElement?.props?.fieldKey as string || '';

  // Get button styling from the ELEMENT (where CanvasRenderer reads from)
  // This is the source of truth - element.props.fillType, element.props.gradient, element.styles.backgroundColor
  const buttonFillType = (buttonElement?.props?.fillType as 'solid' | 'gradient') || 'solid';
  const buttonColor = (buttonElement?.styles?.backgroundColor as string) || '#18181b';
  const buttonGradient = buttonElement?.props?.gradient as GradientValue | undefined;
  const buttonTextColor = (buttonElement?.props?.textColor as string) || '#ffffff';
  const buttonSize = (buttonElement?.props?.buttonSize as 'sm' | 'md' | 'lg') || 'md';
  const buttonRadius = (buttonElement?.styles?.borderRadius as string) || '12px';
  const buttonFullWidth = buttonElement?.styles?.width === '100%';
  
  // Background styling - read from block.styles (SINGLE SOURCE OF TRUTH)
  const blockStyles = block.styles || {};
  // Detect gradient if block.styles.background contains 'gradient'
  const hasGradientBg = typeof blockStyles.background === 'string' && blockStyles.background.includes('gradient');
  const backgroundType = hasGradientBg ? 'gradient' : 'solid';
  const backgroundColor = (blockStyles.backgroundColor as string) || 'transparent';
  // Parse gradient from CSS string or use stored object
  const backgroundGradient = blockProps.backgroundGradient as GradientValue | undefined;
  
  // Popup opt-in settings
  const showAsPopup = blockProps.showAsPopup as boolean || false;
  const requireCompletion = blockProps.requireCompletion as boolean || false;

  return (
    <div className="flex flex-col h-full min-h-0 bg-builder-bg">
      {/* Header - Uses builder accent (purple) for block-level consistency */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-builder-border bg-gradient-to-r from-[hsl(280,75%,55%,0.12)] to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[hsl(280,75%,55%,0.2)] flex items-center justify-center">
            <HelpCircle className="w-3 h-3 text-[hsl(280,75%,70%)]" />
          </div>
          <div>
            <div className="text-sm font-medium text-builder-text">{block.label || 'Input Field'}</div>
            <div className="text-[10px] text-builder-text-muted">Interactive Block</div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto builder-scroll">
        {/* Popup Opt-In Settings (for Contact Info blocks) */}
        {isContactInfoBlock && (
          <CollapsibleSection title="Popup Behavior" icon={<Eye className="w-3.5 h-3.5" />}>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-builder-text">Show as Popup</Label>
                <p className="text-[10px] text-builder-text-dim">Display as modal on page load</p>
              </div>
              <Switch
                checked={showAsPopup}
                onCheckedChange={(checked) => updateBlockProps({ showAsPopup: checked })}
              />
            </div>
            
            {showAsPopup && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-builder-text">Require Completion</Label>
                  <p className="text-[10px] text-builder-text-dim">Must submit before seeing content</p>
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

          {/* Button Action - What happens on click */}
          {buttonElement && (
            <FieldGroup label="Button Action">
              {(() => {
                const buttonAction = buttonElement.props?.buttonAction as ButtonAction | undefined;
                const actionType = buttonAction?.type || 'next-step';
                const actionValue = buttonAction?.value || '';
                
                const handleActionChange = (type: ButtonActionType, value?: string) => {
                  updateElementProps(buttonElement.id, {
                    buttonAction: { type, value, openNewTab: type === 'url' ? buttonAction?.openNewTab : undefined }
                  });
                };

                return (
                  <div className="space-y-2">
                    {/* Action Type Selector */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { type: 'next-step' as ButtonActionType, label: 'Next Step', icon: <ArrowRight className="w-3 h-3" /> },
                        { type: 'go-to-step' as ButtonActionType, label: 'Go to Step', icon: <Layers className="w-3 h-3" /> },
                        { type: 'submit' as ButtonActionType, label: 'Submit', icon: <Send className="w-3 h-3" /> },
                        { type: 'url' as ButtonActionType, label: 'Open URL', icon: <ExternalLink className="w-3 h-3" /> },
                      ].map((action) => (
                        <button
                          key={action.type}
                          onClick={() => handleActionChange(action.type, action.type === actionType ? actionValue : '')}
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors',
                            actionType === action.type
                              ? 'bg-builder-accent text-white'
                              : 'bg-builder-surface-hover hover:bg-builder-surface text-builder-text-muted'
                          )}
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>

                    {/* Step Selector for go-to-step */}
                    {actionType === 'go-to-step' && steps.length > 0 && (
                      <Select value={actionValue} onValueChange={(v) => handleActionChange('go-to-step', v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select step..." />
                        </SelectTrigger>
                        <SelectContent>
                          {steps.map((step) => (
                            <SelectItem key={step.id} value={step.id}>
                              {step.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* URL Input for url action */}
                    {actionType === 'url' && (
                      <Input
                        value={actionValue}
                        onChange={(e) => handleActionChange('url', e.target.value)}
                        placeholder="https://example.com"
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                );
              })()}
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

        {/* Button Style Section - Updates ELEMENT props/styles directly for CanvasRenderer to read */}
        {buttonElement && (
          <CollapsibleSection title="Button Style" icon={<Palette className="w-3.5 h-3.5" />}>
            {/* Tip for advanced styling */}
            <p className="text-[10px] text-muted-foreground pb-2">
              Tip: Click the button on canvas for more styling options.
            </p>
            
            {/* Button Fill Type - writes to element.props.fillType */}
            <FieldGroup label="Fill Type">
              <div className="flex rounded-md overflow-hidden border border-border">
                <button
                  onClick={() => updateButtonStyle({ props: { fillType: 'solid' } })}
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
                  onClick={() => {
                    // When switching to gradient, set a default gradient if none exists
                    const gradient = buttonGradient || {
                      type: 'linear' as const,
                      angle: 135,
                      stops: [
                        { color: '#8B5CF6', position: 0 },
                        { color: '#D946EF', position: 100 },
                      ],
                    };
                    updateButtonStyle({ props: { fillType: 'gradient', gradient } });
                  }}
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

            {/* Button Color (Solid) - writes to element.styles.backgroundColor */}
            <FieldGroup label="Button Color">
              <ColorPickerPopover
                color={buttonColor}
                onChange={(color) => updateButtonStyle({ styles: { backgroundColor: color } })}
              >
                <button className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors border border-border",
                  buttonFillType === 'gradient' ? 'opacity-50 bg-muted/30' : 'bg-muted/50 hover:bg-muted'
                )}>
                  <div 
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: buttonColor }}
                  />
                  <span className="text-xs text-foreground font-mono">{buttonColor}</span>
                  {buttonFillType === 'gradient' && <span className="text-[10px] text-muted-foreground ml-auto">(inactive)</span>}
                </button>
              </ColorPickerPopover>
            </FieldGroup>

            {/* Button Gradient - writes to element.props.gradient */}
            <FieldGroup label="Button Gradient">
              <GradientPickerPopover
                value={buttonGradient || null}
                onChange={(gradient) => updateButtonStyle({ props: { gradient } })}
              >
                <button className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors border border-border",
                  buttonFillType === 'solid' ? 'opacity-50 bg-muted/30' : 'bg-muted/50 hover:bg-muted'
                )}>
                  <div 
                    className="w-6 h-6 rounded border border-border"
                    style={{ background: buttonGradient ? gradientToCSS(buttonGradient) : gradientToCSS(defaultGradient) }}
                  />
                  <span className="text-xs text-foreground">Edit Gradient</span>
                  {buttonFillType === 'solid' && <span className="text-[10px] text-muted-foreground ml-auto">(inactive)</span>}
                </button>
              </GradientPickerPopover>
            </FieldGroup>

            {/* Button Text Color - writes to element.props.textColor */}
            <FieldGroup label="Button Text Color">
              <ColorPickerPopover
                color={buttonTextColor}
                onChange={(color) => updateButtonStyle({ props: { textColor: color } })}
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

            {/* Button Size - writes to element.props.buttonSize */}
            <FieldGroup label="Button Size">
              <div className="flex rounded-md overflow-hidden border border-border">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateButtonStyle({ props: { buttonSize: size } })}
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

            {/* Button Corners - writes to element.styles.borderRadius */}
            <FieldGroup label="Button Corners">
              <div className="flex rounded-md overflow-hidden border border-border">
                <button
                  onClick={() => updateButtonStyle({ styles: { borderRadius: '0px' } })}
                  className={cn(
                    'flex-1 px-2 py-1.5 transition-colors flex items-center justify-center',
                    buttonRadius === '0px'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateButtonStyle({ styles: { borderRadius: '12px' } })}
                  className={cn(
                    'flex-1 px-2 py-1.5 transition-colors flex items-center justify-center',
                    buttonRadius === '12px' || (!buttonRadius || buttonRadius === 'undefined')
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <div className="w-3.5 h-3.5 border-2 border-current rounded" />
                </button>
                <button
                  onClick={() => updateButtonStyle({ styles: { borderRadius: '9999px' } })}
                  className={cn(
                    'flex-1 px-2 py-1.5 transition-colors flex items-center justify-center',
                    buttonRadius === '9999px'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Circle className="w-3.5 h-3.5" />
                </button>
              </div>
            </FieldGroup>

            {/* Full Width Toggle - writes to element.styles.width */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Full Width Button</Label>
              <Switch
                checked={buttonFullWidth}
                onCheckedChange={(checked) => updateButtonStyle({ 
                  styles: { width: checked ? '100%' : undefined } 
                })}
              />
            </div>
          </CollapsibleSection>
        )}

        {/* Background Section - writes to block.styles (single source of truth) */}
        <CollapsibleSection title="Background" icon={<Palette className="w-3.5 h-3.5" />}>
          {/* Background Type */}
          <FieldGroup label="Background Type">
            <div className="flex rounded-md overflow-hidden border border-border">
              <button
                onClick={() => {
                  // Switch to solid: apply backgroundColor, clear background gradient
                  updateBlockStyles({ 
                    backgroundColor: backgroundColor || 'transparent',
                    background: undefined 
                  });
                }}
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
                onClick={() => {
                  // Switch to gradient: apply gradient, keep backgroundColor preserved
                  if (backgroundGradient) {
                    updateBlockStyles({ background: gradientToCSS(backgroundGradient) });
                  } else {
                    updateBlockStyles({ background: gradientToCSS(defaultGradient) });
                    updateBlockProps({ backgroundGradient: defaultGradient });
                  }
                }}
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

          {/* Background Color - always shown, preserved when switching */}
          <FieldGroup label="Background Color">
            <ColorPickerPopover
              color={backgroundColor || 'transparent'}
              onChange={(color) => {
                updateBlockStyles({ backgroundColor: color });
                // If currently solid, this is the active value
              }}
            >
              <button className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors border border-border",
                backgroundType === 'gradient' ? 'opacity-50 bg-muted/30' : 'bg-muted/50 hover:bg-muted'
              )}>
                <div 
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: backgroundColor || 'transparent' }}
                />
                <span className="text-xs text-foreground font-mono">{backgroundColor || 'transparent'}</span>
                {backgroundType === 'gradient' && <span className="text-[10px] text-muted-foreground ml-auto">(inactive)</span>}
              </button>
            </ColorPickerPopover>
          </FieldGroup>

          {/* Background Gradient - always shown, preserved when switching */}
          <FieldGroup label="Background Gradient">
            <GradientPickerPopover
              value={backgroundGradient || null}
              onChange={(gradient) => {
                // Store the gradient object in props for editing, render CSS in styles
                updateBlockProps({ backgroundGradient: gradient });
                updateBlockStyles({ background: gradientToCSS(gradient) });
              }}
            >
              <button className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors border border-border",
                backgroundType === 'solid' ? 'opacity-50 bg-muted/30' : 'bg-muted/50 hover:bg-muted'
              )}>
                <div 
                  className="w-6 h-6 rounded border border-border"
                  style={{ background: backgroundGradient ? gradientToCSS(backgroundGradient) : gradientToCSS(defaultGradient) }}
                />
                <span className="text-xs text-foreground">Edit Gradient</span>
                {backgroundType === 'solid' && <span className="text-[10px] text-muted-foreground ml-auto">(inactive)</span>}
              </button>
            </GradientPickerPopover>
          </FieldGroup>

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
