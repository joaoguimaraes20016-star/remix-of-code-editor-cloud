/**
 * InteractiveBlockInspector
 * 
 * Inspector for standalone interactive blocks (form-field, open-question, etc.)
 * These blocks represent individual form inputs that can be placed anywhere on the canvas.
 * 
 * Provides editing controls for:
 * - Question/heading text
 * - Input type and settings
 * - Button text and styling
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
  ToggleLeft,
  MessageSquare,
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
import { ColorPickerPopover } from '../modals';

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

  // Get input type
  const inputType = inputElement?.props?.inputType as string || 'text';
  const placeholder = inputElement?.props?.placeholder as string || '';
  const isRequired = inputElement?.props?.required as boolean || false;
  const fieldKey = inputElement?.props?.fieldKey as string || '';

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
                onValueChange={(value) => updateElementProps(inputElement.id, { inputType: value })}
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

        {/* Appearance Section */}
        <CollapsibleSection title="Appearance" icon={<Palette className="w-3.5 h-3.5" />}>
          {/* Heading alignment */}
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

          {/* Button styling hint */}
          {buttonElement && (
            <div className="p-2 rounded bg-muted/50 border border-border">
              <p className="text-[10px] text-muted-foreground">
                <MessageSquare className="w-3 h-3 inline mr-1" />
                Click the button on the canvas to edit its styling.
              </p>
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default InteractiveBlockInspector;
