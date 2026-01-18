/**
 * InteractiveBlockInspector
 * 
 * Inspector for standalone interactive blocks (form-field, open-question, etc.)
 * 
 * Provides editing controls for:
 * - Question/heading text
 * - Input type and settings
 * - Button TEXT only (styling handled by unified button inspector)
 * - Background styling (solid/gradient)
 * - Popup opt-in settings (for contact info blocks)
 * - Field validation settings
 * 
 * NOTE: Button styling is NOT controlled here - click the button on canvas
 * to access the unified button inspector. This ensures all buttons use
 * the same styling system.
 */

import React, { useState, useCallback } from 'react';
import { Block, Element } from '../../../types/infostack';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  HelpCircle, 
  Type, 
  Settings2, 
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  ListChecks,
  Plus,
  Trash2,
  GripVertical,
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
import { ButtonActionSelector, type ButtonAction } from '../ButtonActionSelector';
import { CollapsibleSection, FieldGroup } from './shared';

// Sortable checkbox item for drag-and-drop reordering
import { SortableInspectorRow } from './SortableInspectorRow';

interface SortableCheckboxItemProps {
  element: Element;
  index: number;
  onUpdateContent: (content: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function SortableCheckboxItem({ element, index, onUpdateContent, onRemove, canRemove }: SortableCheckboxItemProps) {
  return (
    <SortableInspectorRow id={element.id}>
      <Input
        value={element.content || ''}
        onChange={(e) => onUpdateContent(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        className="h-7 text-xs bg-background border-border flex-1"
        placeholder={`Option ${index + 1}`}
      />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className={cn(
          "p-1 rounded transition-all",
          !canRemove 
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-destructive/10 text-builder-text-dim hover:text-destructive opacity-0 group-hover:opacity-100"
        )}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </SortableInspectorRow>
  );
}

interface InteractiveBlockInspectorProps {
  block: Block;
  onUpdateBlock: (updates: Partial<Block>) => void;
  steps?: { id: string; name: string }[];
}

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
  // Find all checkbox elements (for multi-choice blocks)
  const checkboxElements = elements.filter(el => el.type === 'checkbox');
  const isMultiChoiceBlock = checkboxElements.length > 0;
  
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

  // ═══════════════════════════════════════════════════════════════
  // MULTI-CHOICE OPTION MANAGEMENT (matches StepContentEditor pattern)
  // ═══════════════════════════════════════════════════════════════
  
  // Drag-and-drop sensors for checkbox reordering - zero distance for immediate response
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 0 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCheckboxDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const checkboxIds = checkboxElements.map(el => el.id);
      const oldIndex = checkboxIds.indexOf(active.id as string);
      const newIndex = checkboxIds.indexOf(over.id as string);
      
      // Reorder just the checkbox elements while preserving other elements
      const reorderedCheckboxes = arrayMove(checkboxElements, oldIndex, newIndex);
      const otherElements = elements.filter(el => el.type !== 'checkbox');
      
      // Keep checkboxes in their relative position in the elements array
      const firstCheckboxIndex = elements.findIndex(el => el.type === 'checkbox');
      const newElements = [
        ...elements.slice(0, firstCheckboxIndex).filter(el => el.type !== 'checkbox'),
        ...reorderedCheckboxes,
        ...elements.slice(firstCheckboxIndex).filter(el => el.type !== 'checkbox'),
      ];
      
      onUpdateBlock({ elements: newElements });
    }
  }, [checkboxElements, elements, onUpdateBlock]);
  
  const addCheckboxOption = () => {
    const newCheckbox: Element = {
      id: `checkbox-${Date.now()}`,
      type: 'checkbox',
      content: `Option ${checkboxElements.length + 1}`,
      props: {},
      styles: {},
    };
    onUpdateBlock({ elements: [...elements, newCheckbox] });
  };

  const updateCheckboxContent = (elementId: string, content: string) => {
    const newElements = elements.map(el =>
      el.id === elementId ? { ...el, content } : el
    );
    onUpdateBlock({ elements: newElements });
  };

  const removeCheckboxOption = (elementId: string) => {
    if (checkboxElements.length > 1) {
      const newElements = elements.filter(el => el.id !== elementId);
      onUpdateBlock({ elements: newElements });
    }
  };

  // Get input type and properties
  const inputType = inputElement?.props?.type as string || inputElement?.props?.inputType as string || 'text';
  const placeholder = inputElement?.props?.placeholder as string || '';
  const isRequired = inputElement?.props?.required as boolean || false;
  const fieldKey = inputElement?.props?.fieldKey as string || '';
  
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
            <FieldGroup label="On Click">
              <ButtonActionSelector
                action={buttonElement.props?.buttonAction as ButtonAction | undefined}
                onChange={(action) => updateElementProps(buttonElement.id, { buttonAction: action })}
                availableSteps={steps}
                compact
              />
            </FieldGroup>
          )}

          {/* Button Styling Hint */}
          {buttonElement && (
            <div className="px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="font-medium">Tip:</span> To style this button (colors, size, shadow), click the button directly on the canvas to open the button inspector.
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Options Section - for multi-choice blocks with checkbox elements */}
        {isMultiChoiceBlock && (
          <CollapsibleSection title="Options" icon={<ListChecks className="w-3.5 h-3.5" />} defaultOpen>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCheckboxDragEnd}
            >
              <SortableContext
                items={checkboxElements.map(el => el.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {checkboxElements.map((checkbox, index) => (
                    <SortableCheckboxItem
                      key={checkbox.id}
                      element={checkbox}
                      index={index}
                      onUpdateContent={(content) => updateCheckboxContent(checkbox.id, content)}
                      onRemove={() => removeCheckboxOption(checkbox.id)}
                      canRemove={checkboxElements.length > 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <button
              onClick={addCheckboxOption}
              className="flex items-center gap-1.5 text-[10px] text-builder-text-muted hover:text-builder-text mt-2"
            >
              <Plus className="w-3 h-3" />
              Add Option
            </button>
          </CollapsibleSection>
        )}

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

            {/* Phone-specific settings */}
            {inputType === 'tel' && (
              <>
                <FieldGroup label="Default Country">
                  <Select
                    value={(inputElement.props?.defaultCountryCode as string) || '+1'}
                    onValueChange={(value) => updateElementProps(inputElement.id, { defaultCountryCode: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="+1">🇺🇸 United States (+1)</SelectItem>
                      <SelectItem value="+44">🇬🇧 United Kingdom (+44)</SelectItem>
                      <SelectItem value="+61">🇦🇺 Australia (+61)</SelectItem>
                      <SelectItem value="+49">🇩🇪 Germany (+49)</SelectItem>
                      <SelectItem value="+33">🇫🇷 France (+33)</SelectItem>
                      <SelectItem value="+52">🇲🇽 Mexico (+52)</SelectItem>
                      <SelectItem value="+91">🇮🇳 India (+91)</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Phone Format">
                  <Select
                    value={(inputElement.props?.phoneFormat as string) || 'us'}
                    onValueChange={(value) => updateElementProps(inputElement.id, { phoneFormat: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">(XXX) XXX-XXXX</SelectItem>
                      <SelectItem value="international">+X XXX XXX XXXX</SelectItem>
                      <SelectItem value="none">No formatting</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </>
            )}

            {/* Field Key */}
            <FieldGroup label="Field Key">
              <Input
                value={fieldKey}
                onChange={(e) => updateElementProps(inputElement.id, { fieldKey: e.target.value })}
                placeholder="email, phone, name..."
                className="h-8 text-sm font-mono"
              />
              <p className="text-[10px] text-builder-text-dim">Used to identify this field in form data</p>
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
              <Label className="text-xs text-builder-text-muted">Required</Label>
              <Switch
                checked={isRequired}
                onCheckedChange={(checked) => updateElementProps(inputElement.id, { required: checked })}
              />
            </div>

            {/* Validation - Min/Max length for text inputs */}
            {(inputType === 'text' || inputType === 'textarea') && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <FieldGroup label="Min Length">
                  <Input
                    type="number"
                    value={(inputElement.props?.minLength as number) || ''}
                    onChange={(e) => updateElementProps(inputElement.id, { 
                      minLength: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </FieldGroup>
                <FieldGroup label="Max Length">
                  <Input
                    type="number"
                    value={(inputElement.props?.maxLength as number) || ''}
                    onChange={(e) => updateElementProps(inputElement.id, { 
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="∞"
                    className="h-8 text-sm"
                  />
                </FieldGroup>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Note: Button styling removed - click the button on canvas for styling via unified button inspector */}

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
