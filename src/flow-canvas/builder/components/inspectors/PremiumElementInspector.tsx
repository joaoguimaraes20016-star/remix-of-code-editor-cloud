/**
 * Premium Element Inspector
 * Provides editing controls for all premium element types:
 * - gradient-text, stat-number, avatar-group, ticker
 * - badge, process-step, video-thumbnail, underline-text
 */

import React, { useState, useCallback } from 'react';
import { BooleanToggle, coerceBoolean } from '../BooleanToggle';
import { Element } from '../../../types/infostack';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommitSlider } from '../CommitSlider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPickerPopover, GradientPickerPopover, gradientToCSS } from '../modals';
import type { GradientValue } from '../modals';
import { ButtonIconPicker } from '../ButtonIconPicker';
import {
  Sparkles,
  Hash,
  Users,
  Type,
  Award,
  Play,
  Underline,
  ListOrdered,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  GripVertical,
} from 'lucide-react';

// Sortable Ticker Item component
import { SortableInspectorRow } from './SortableInspectorRow';

interface SortableTickerItemProps {
  id: string;
  item: string;
  index: number;
  onUpdate: (value: string) => void;
  onRemove: () => void;
}

function SortableTickerItem({ id, item, index, onUpdate, onRemove }: SortableTickerItemProps) {
  return (
    <SortableInspectorRow id={id}>
      <Input
        value={item}
        onChange={(e) => onUpdate(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        className="builder-input text-xs flex-1"
      />
      <button
        onClick={onRemove}
        className="p-1.5 rounded-md hover:bg-destructive/10 text-builder-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </SortableInspectorRow>
  );
}

interface PremiumElementInspectorProps {
  element: Element;
  onUpdate: (updates: Partial<Element>) => void;
  primaryColor?: string;
}

// Collapsible section component
const Section: React.FC<{ 
  title: string; 
  icon?: React.ReactNode; 
  defaultOpen?: boolean; 
  children: React.ReactNode 
}> = ({ title, icon, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-builder-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-builder-surface-hover/50 transition-colors"
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
      {isOpen && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
};

// Field group helper
const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-builder-text-muted">{label}</Label>
    {children}
  </div>
);

const defaultGradient: GradientValue = {
  type: 'linear',
  angle: 135,
  stops: [
    { color: '#A855F7', position: 0 },
    { color: '#EC4899', position: 100 }
  ]
};

export const PremiumElementInspector: React.FC<PremiumElementInspectorProps> = ({
  element,
  onUpdate,
  primaryColor = '#8B5CF6',
}) => {
  // Move sensors to top level - zero distance for immediate response
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 0 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePropsChange = (key: string, value: unknown) => {
    onUpdate({ props: { ...element.props, [key]: value } });
  };

  const handleContentChange = (content: string) => {
    onUpdate({ content });
  };

  // ========== GRADIENT TEXT ==========
  if (element.type === 'gradient-text') {
    const gradient = (element.props?.gradient as GradientValue) || defaultGradient;
    
    return (
      <div className="space-y-0">
        <Section title="Content" icon={<Type className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Text">
            <Input
              value={element.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter gradient text..."
              className="builder-input text-xs"
            />
          </FieldGroup>
        </Section>
        
        <Section title="Gradient" icon={<Sparkles className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Colors">
            <GradientPickerPopover
              value={gradient}
              onChange={(g) => handlePropsChange('gradient', g)}
            >
              <button 
                className="w-full h-12 rounded-lg border border-builder-border hover:ring-2 hover:ring-builder-accent transition-all cursor-pointer"
                style={{ background: gradientToCSS(gradient) }}
              >
                <span className="text-xs text-white font-medium drop-shadow-sm">
                  Click to edit gradient
                </span>
              </button>
            </GradientPickerPopover>
          </FieldGroup>
        </Section>
        
        <Section title="Typography" icon={<Type className="w-4 h-4" />}>
          <FieldGroup label="Font Size">
            <Select
              value={(element.props?.fontSize as string) || '4xl'}
              onValueChange={(v) => handlePropsChange('fontSize', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="2xl">2XL (30px)</SelectItem>
                <SelectItem value="3xl">3XL (36px)</SelectItem>
                <SelectItem value="4xl">4XL (48px)</SelectItem>
                <SelectItem value="5xl">5XL (60px)</SelectItem>
                <SelectItem value="6xl">6XL (72px)</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Font Weight">
            <Select
              value={(element.props?.fontWeight as string) || 'bold'}
              onValueChange={(v) => handlePropsChange('fontWeight', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Weight" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="semibold">Semibold</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="extrabold">Extra Bold</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Alignment">
            <div className="flex gap-1">
              <button
                onClick={() => handlePropsChange('textAlign', 'left')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  (element.props?.textAlign || 'left') === 'left' 
                    ? 'bg-builder-accent text-white' 
                    : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                )}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePropsChange('textAlign', 'center')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  element.props?.textAlign === 'center' 
                    ? 'bg-builder-accent text-white' 
                    : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                )}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePropsChange('textAlign', 'right')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  element.props?.textAlign === 'right' 
                    ? 'bg-builder-accent text-white' 
                    : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                )}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </FieldGroup>
        </Section>
      </div>
    );
  }

  // ========== STAT NUMBER ==========
  if (element.type === 'stat-number') {
    return (
      <div className="space-y-0">
        <Section title="Content" icon={<Hash className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Number Value">
            <Input
              value={element.content || '0'}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="9,943"
              className="builder-input text-xs"
            />
          </FieldGroup>
          
          <FieldGroup label="Suffix">
            <Input
              value={(element.props?.suffix as string) || ''}
              onChange={(e) => handlePropsChange('suffix', e.target.value)}
              placeholder="+ or K or B"
              className="builder-input text-xs"
            />
          </FieldGroup>
          
          <FieldGroup label="Label">
            <Input
              value={(element.props?.label as string) || ''}
              onChange={(e) => handlePropsChange('label', e.target.value)}
              placeholder="MEMBERS"
              className="builder-input text-xs"
            />
          </FieldGroup>
        </Section>
        
        <Section title="Style" icon={<Type className="w-4 h-4" />}>
          <FieldGroup label="Size">
            <Select
              value={(element.props?.size as string) || 'xl'}
              onValueChange={(v) => handlePropsChange('size', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
                <SelectItem value="2xl">2XL</SelectItem>
                <SelectItem value="3xl">3XL</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Font Weight">
            <Select
              value={(element.props?.fontWeight as string) || 'bold'}
              onValueChange={(v) => handlePropsChange('fontWeight', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Weight" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="semibold">Semibold</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="extrabold">Extra Bold</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </Section>
        
        <Section title="Colors" icon={<Sparkles className="w-4 h-4" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Number</span>
              <ColorPickerPopover
                color={(element.props?.numberColor as string) || '#ffffff'}
                onChange={(c) => handlePropsChange('numberColor', c)}
                showGradientOption={false}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.numberColor as string) || '#ffffff' }} />
                  <span className="text-xs text-builder-text-muted">Edit</span>
                </button>
              </ColorPickerPopover>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Suffix</span>
              <ColorPickerPopover
                color={(element.props?.suffixColor as string) || '#8B5CF6'}
                onChange={(c) => handlePropsChange('suffixColor', c)}
                showGradientOption={false}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.suffixColor as string) || '#8B5CF6' }} />
                  <span className="text-xs text-builder-text-muted">Edit</span>
                </button>
              </ColorPickerPopover>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Label</span>
              <ColorPickerPopover
                color={(element.props?.labelColor as string) || '#888888'}
                onChange={(c) => handlePropsChange('labelColor', c)}
                showGradientOption={false}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.labelColor as string) || '#888888' }} />
                  <span className="text-xs text-builder-text-muted">Edit</span>
                </button>
              </ColorPickerPopover>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  // ========== AVATAR GROUP ==========
  if (element.type === 'avatar-group') {
    const count = (element.props?.count as number) || 3;
    const colorMode = (element.props?.colorMode as string) || 'gradient';
    
    return (
      <div className="space-y-0">
        <Section title="Avatars" icon={<Users className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Count">
            <div className="flex items-center gap-3">
              <CommitSlider
                value={count}
                onValueCommit={(v) => handlePropsChange('count', v)}
                min={1}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="text-xs font-mono text-builder-text-muted w-6 text-center">{count}</span>
            </div>
          </FieldGroup>
          
          <FieldGroup label="Size">
            <Select
              value={(element.props?.size as string) || 'md'}
              onValueChange={(v) => handlePropsChange('size', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="xs">X-Small (24px)</SelectItem>
                <SelectItem value="sm">Small (32px)</SelectItem>
                <SelectItem value="md">Medium (40px)</SelectItem>
                <SelectItem value="lg">Large (48px)</SelectItem>
                <SelectItem value="xl">X-Large (56px)</SelectItem>
                <SelectItem value="2xl">2XL (72px)</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Alignment">
            <div className="flex gap-1">
              {[
                { value: 'flex-start', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'flex-end', icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handlePropsChange('alignment', value)}
                  className={cn(
                    'flex-1 p-2 rounded-md border transition-colors',
                    (element.props?.alignment || 'flex-start') === value
                      ? 'border-builder-accent bg-builder-accent/10 text-builder-accent'
                      : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                  )}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
              ))}
            </div>
          </FieldGroup>
          
          <FieldGroup label="Overlap">
            <div className="flex items-center gap-3">
              <CommitSlider
                value={(element.props?.overlap as number) || 12}
                onValueCommit={(v) => handlePropsChange('overlap', v)}
                min={0}
                max={40}
                step={2}
                className="flex-1"
              />
              <span className="text-xs font-mono text-builder-text-muted w-8 text-center">
                {(element.props?.overlap as number) || 12}px
              </span>
            </div>
          </FieldGroup>
        </Section>
        
        <Section title="Colors" icon={<Sparkles className="w-4 h-4" />}>
          <FieldGroup label="Color Mode">
            <Select
              value={colorMode}
              onValueChange={(v) => handlePropsChange('colorMode', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="solid">Solid Color</SelectItem>
                <SelectItem value="varied">Varied Colors</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          {colorMode === 'solid' && (
            <FieldGroup label="Avatar Color">
              <ColorPickerPopover
                color={(element.props?.solidColor as string) || primaryColor}
                onChange={(c) => handlePropsChange('solidColor', c)}
              >
                <button 
                  className="w-full h-8 rounded-md border border-builder-border hover:ring-2 hover:ring-builder-accent transition-all" 
                  style={{ backgroundColor: (element.props?.solidColor as string) || primaryColor }} 
                />
              </ColorPickerPopover>
            </FieldGroup>
          )}
          
          {colorMode === 'gradient' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-dim">Gradient Start</span>
                <ColorPickerPopover
                  color={(element.props?.gradientFrom as string) || primaryColor}
                  onChange={(c) => handlePropsChange('gradientFrom', c)}
                >
                  <button className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.gradientFrom as string) || primaryColor }} />
                </ColorPickerPopover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-dim">Gradient End</span>
                <ColorPickerPopover
                  color={(element.props?.gradientTo as string) || '#EC4899'}
                  onChange={(c) => handlePropsChange('gradientTo', c)}
                >
                  <button className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.gradientTo as string) || '#EC4899' }} />
                </ColorPickerPopover>
              </div>
            </div>
          )}
          
          {colorMode === 'varied' && (
            <p className="text-[10px] text-builder-text-dim">
              Each avatar gets a unique color based on index.
            </p>
          )}
        </Section>
      </div>
    );
  }

  // ========== TICKER (ENHANCED) ==========
  if (element.type === 'ticker') {
    const items = (element.props?.items as string[]) || ['Item 1', 'Item 2', 'Item 3'];
    const speed = (element.props?.speed as number) || 30;
    
    // Generate stable IDs for ticker items
    const tickerItems = items.map((item, idx) => ({ id: `ticker-item-${idx}`, value: item, index: idx }));

    const handleTickerDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = tickerItems.findIndex(item => item.id === active.id);
        const newIndex = tickerItems.findIndex(item => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        handlePropsChange('items', reordered);
      }
    };
    
    return (
      <div className="space-y-0">
        <Section title="Items" icon={<ListOrdered className="w-4 h-4" />} defaultOpen>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event) => console.log('[inspector-dnd] Ticker drag start:', event.active.id)}
            onDragEnd={(event) => {
              console.log('[inspector-dnd] Ticker drag end:', event.active.id, '->', event.over?.id);
              handleTickerDragEnd(event);
            }}
            onDragCancel={() => console.log('[inspector-dnd] Ticker drag cancelled')}
          >
            <SortableContext
              items={tickerItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {tickerItems.map((item) => (
                  <SortableTickerItem
                    key={item.id}
                    id={item.id}
                    item={item.value}
                    index={item.index}
                    onUpdate={(value) => {
                      const newItems = [...items];
                      newItems[item.index] = value;
                      handlePropsChange('items', newItems);
                    }}
                    onRemove={() => {
                      const newItems = items.filter((_, idx) => idx !== item.index);
                      handlePropsChange('items', newItems);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePropsChange('items', [...items, `Item ${items.length + 1}`])}
            className="w-full text-xs mt-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Item
          </Button>
          
          <FieldGroup label="Separator">
            <Input
              value={(element.props?.separator as string) || '  •  '}
              onChange={(e) => handlePropsChange('separator', e.target.value)}
              className="builder-input text-xs"
            />
          </FieldGroup>
        </Section>
        
        <Section title="Animation" icon={<Play className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Direction">
            <div className="grid grid-cols-4 gap-1">
              {[
                { value: 'left', label: '←' },
                { value: 'right', label: '→' },
                { value: 'up', label: '↑' },
                { value: 'down', label: '↓' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handlePropsChange('direction', value)}
                  className={cn(
                    'p-2 rounded-md text-sm transition-colors',
                    (element.props?.direction || 'left') === value
                      ? 'bg-builder-accent text-white'
                      : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </FieldGroup>
          
          <FieldGroup label="Speed (seconds per loop)">
            <div className="flex items-center gap-3">
              <CommitSlider
                value={speed}
                onValueCommit={(v) => handlePropsChange('speed', v)}
                min={5}
                max={120}
                step={5}
                className="flex-1"
              />
              <span className="text-xs font-mono text-builder-text-muted w-8 text-center">{speed}s</span>
            </div>
          </FieldGroup>
          
          <FieldGroup label="Pause on Hover">
            <BooleanToggle
              value={coerceBoolean(element.props?.pauseOnHover, true)}
              onValueChange={(v) => handlePropsChange('pauseOnHover', v)}
            />
          </FieldGroup>
        </Section>
        
        <Section title="Typography" icon={<Type className="w-4 h-4" />}>
          <FieldGroup label="Font Size">
            <Select
              value={(element.props?.fontSize as string) || 'md'}
              onValueChange={(v) => handlePropsChange('fontSize', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="xs">Extra Small (12px)</SelectItem>
                <SelectItem value="sm">Small (14px)</SelectItem>
                <SelectItem value="md">Medium (16px)</SelectItem>
                <SelectItem value="lg">Large (18px)</SelectItem>
                <SelectItem value="xl">Extra Large (20px)</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Font Weight">
            <Select
              value={(element.props?.fontWeight as string) || 'normal'}
              onValueChange={(v) => handlePropsChange('fontWeight', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Weight" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="semibold">Semibold</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Letter Spacing">
            <div className="flex items-center gap-3">
              <CommitSlider
                value={(element.props?.letterSpacing as number) || 0}
                onValueCommit={(v) => handlePropsChange('letterSpacing', v)}
                min={-2}
                max={8}
                step={0.5}
                className="flex-1"
              />
              <span className="text-xs font-mono text-builder-text-muted w-8 text-center">
                {(element.props?.letterSpacing as number) || 0}px
              </span>
            </div>
          </FieldGroup>
        </Section>
        
        <Section title="Colors" icon={<Sparkles className="w-4 h-4" />}>
          <div className="space-y-3">
            {/* Text Fill Type Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Text Fill</span>
              <div className="flex rounded-lg overflow-hidden border border-builder-border">
                <button
                  onClick={() => handlePropsChange('textFillType', 'solid')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    (element.props?.textFillType || 'solid') === 'solid'
                      ? 'bg-builder-accent text-white' 
                      : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                  )}
                >
                  Solid
                </button>
                <button
                  onClick={() => handlePropsChange('textFillType', 'gradient')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    element.props?.textFillType === 'gradient'
                      ? 'bg-builder-accent text-white' 
                      : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                  )}
                >
                  Gradient
                </button>
              </div>
            </div>
            
            {/* Solid Text Color */}
            {(element.props?.textFillType || 'solid') === 'solid' && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Text Color</span>
                <ColorPickerPopover
                  color={(element.props?.textColor as string) || '#ffffff'}
                  onChange={(c) => handlePropsChange('textColor', c)}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.textColor as string) || '#ffffff' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
            )}
            
            {/* Gradient Text Color */}
            {element.props?.textFillType === 'gradient' && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Text Gradient</span>
                <GradientPickerPopover
                  value={(element.props?.textGradient as GradientValue) || defaultGradient}
                  onChange={(gradient) => handlePropsChange('textGradient', gradient)}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div 
                      className="w-6 h-6 rounded-md border border-builder-border" 
                      style={{ 
                        background: (element.props?.textGradient as GradientValue) 
                          ? gradientToCSS(element.props.textGradient as GradientValue)
                          : 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)'
                      }} 
                    />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </GradientPickerPopover>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Separator</span>
              <ColorPickerPopover
                color={(element.props?.separatorColor as string) || '#888888'}
                onChange={(c) => handlePropsChange('separatorColor', c)}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.separatorColor as string) || '#888888' }} />
                  <span className="text-xs text-builder-text-muted">Edit</span>
                </button>
              </ColorPickerPopover>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Background</span>
              <ColorPickerPopover
                color={(element.props?.backgroundColor as string) || 'transparent'}
                onChange={(c) => handlePropsChange('backgroundColor', c)}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.backgroundColor as string) || 'transparent' }} />
                  <span className="text-xs text-builder-text-muted">Edit</span>
                </button>
              </ColorPickerPopover>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  // ========== BADGE ==========
  if (element.type === 'badge') {
    return (
      <div className="space-y-0">
        <Section title="Content" icon={<Award className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Text">
            <Input
              value={element.content || 'BADGE'}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Badge text..."
              className="builder-input text-xs"
            />
          </FieldGroup>
          
          <FieldGroup label="Preset Style">
            <Select
              value={(element.props?.variant as string) || 'primary'}
              onValueChange={(v) => handlePropsChange('variant', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Variant" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="primary">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500" />
                    <span>Primary (Purple)</span>
                  </div>
                </SelectItem>
                <SelectItem value="success">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span>Success (Green)</span>
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500" />
                    <span>Warning (Orange)</span>
                  </div>
                </SelectItem>
                <SelectItem value="premium">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400" />
                    <span>Premium (Gold)</span>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-400" />
                    <span>Custom Colors</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Alignment">
            <div className="flex gap-1">
              {[
                { value: 'flex-start', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'flex-end', icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handlePropsChange('alignment', value)}
                  className={cn(
                    'flex-1 p-2 rounded-md border transition-colors',
                    (element.props?.alignment || 'flex-start') === value
                      ? 'border-builder-accent bg-builder-accent/10 text-builder-accent'
                      : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                  )}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
              ))}
            </div>
          </FieldGroup>
        </Section>
        
        {/* Custom Colors - only shown when variant is 'custom' */}
        {element.props?.variant === 'custom' && (
          <Section title="Custom Colors" icon={<Sparkles className="w-4 h-4" />} defaultOpen>
            <div className="space-y-3">
              {/* Background Type Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Background Type</span>
                <div className="flex rounded-lg overflow-hidden border border-builder-border">
                  <button
                    onClick={() => handlePropsChange('bgType', 'solid')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      (element.props?.bgType || 'solid') === 'solid'
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => handlePropsChange('bgType', 'gradient')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      element.props?.bgType === 'gradient'
                        ? 'bg-builder-accent text-white' 
                        : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                    )}
                  >
                    Gradient
                  </button>
                </div>
              </div>
              
              {/* Solid Background */}
              {(element.props?.bgType || 'solid') === 'solid' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Background</span>
                  <ColorPickerPopover
                    color={(element.props?.bgColor as string) || '#8B5CF6'}
                    onChange={(c) => handlePropsChange('bgColor', c)}
                    showGradientOption
                    onGradientClick={() => handlePropsChange('bgType', 'gradient')}
                  >
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                      <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.bgColor as string) || '#8B5CF6' }} />
                      <span className="text-xs text-builder-text-muted">Edit</span>
                    </button>
                  </ColorPickerPopover>
                </div>
              )}
              
              {/* Gradient Background */}
              {element.props?.bgType === 'gradient' && (
                <div className="space-y-2">
                  <span className="text-xs text-builder-text-muted">Background Gradient</span>
                  <GradientPickerPopover
                    value={(element.props?.bgGradient as GradientValue) || {
                      type: 'linear',
                      angle: 135,
                      stops: [
                        { color: '#8B5CF6', position: 0 },
                        { color: '#EC4899', position: 100 }
                      ]
                    }}
                    onChange={(gradient) => handlePropsChange('bgGradient', gradient)}
                  >
                    <button 
                      className="w-full h-10 rounded-lg border border-builder-border hover:ring-2 hover:ring-builder-accent transition-all cursor-pointer"
                      style={{ 
                        background: element.props?.bgGradient 
                          ? gradientToCSS(element.props.bgGradient as GradientValue) 
                          : 'linear-gradient(135deg, #8B5CF6, #EC4899)' 
                      }}
                    >
                      <span className="text-xs text-white font-medium drop-shadow-sm">Click to edit gradient</span>
                    </button>
                  </GradientPickerPopover>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Text Color</span>
                <ColorPickerPopover
                  color={(element.props?.textColor as string) || '#ffffff'}
                  onChange={(c) => handlePropsChange('textColor', c)}
                  showGradientOption={false}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.textColor as string) || '#ffffff' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Border Color</span>
                <ColorPickerPopover
                  color={(element.props?.borderColor as string) || 'transparent'}
                  onChange={(c) => handlePropsChange('borderColor', c)}
                  showGradientOption={false}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.borderColor as string) || 'transparent' }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
            </div>
          </Section>
        )}
        
        <Section title="Icon" icon={<Sparkles className="w-4 h-4" />}>
          <FieldGroup label="Badge Icon">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePropsChange('icon', element.props?.icon ? undefined : 'Sparkles')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors',
                  element.props?.icon 
                    ? 'bg-builder-accent text-white' 
                    : 'bg-builder-surface-hover text-builder-text-muted'
                )}
              >
                <Sparkles className="w-3 h-3" />
                {element.props?.icon ? 'Icon On' : 'Icon Off'}
              </button>
            </div>
          </FieldGroup>
          
          {element.props?.icon && (
            <FieldGroup label="Select Icon">
              <ButtonIconPicker
                value={(element.props?.icon as string) || 'Sparkles'}
                onChange={(iconName) => handlePropsChange('icon', iconName)}
              />
            </FieldGroup>
          )}
        </Section>
      </div>
    );
  }

  // ========== PROCESS STEP (ENHANCED) ==========
  if (element.type === 'process-step') {
    return (
      <div className="space-y-0">
        <Section title="Step" icon={<ListOrdered className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Step Number">
            <div className="flex items-center gap-3">
              <CommitSlider
                value={(element.props?.step as number) || 1}
                onValueCommit={(v) => handlePropsChange('step', v)}
                min={1}
                max={99}
                step={1}
                className="flex-1"
              />
              <span className="text-xs font-mono text-builder-text-muted w-6 text-center">
                {(element.props?.step as number) || 1}
              </span>
            </div>
          </FieldGroup>
          
          <FieldGroup label="Title">
            <Input
              value={element.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Step title..."
              className="builder-input text-xs"
            />
          </FieldGroup>
          
          <FieldGroup label="Description">
            <Input
              value={(element.props?.description as string) || ''}
              onChange={(e) => handlePropsChange('description', e.target.value)}
              placeholder="Optional description..."
              className="builder-input text-xs"
            />
          </FieldGroup>
        </Section>
        
        <Section title="Appearance" icon={<Sparkles className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Shape">
            <div className="grid grid-cols-4 gap-1">
              {[
                { value: 'circle', label: '●' },
                { value: 'rounded-square', label: '■' },
                { value: 'hexagon', label: '⬡' },
                { value: 'badge', label: '🏷' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handlePropsChange('shape', value)}
                  className={cn(
                    'p-2 rounded-md text-sm transition-colors',
                    (element.props?.shape || 'circle') === value
                      ? 'bg-builder-accent text-white'
                      : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                  )}
                  title={value}
                >
                  {label}
                </button>
              ))}
            </div>
          </FieldGroup>
          
          <FieldGroup label="Size">
            <Select
              value={(element.props?.size as string) || 'md'}
              onValueChange={(v) => handlePropsChange('size', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="sm">Small (32px)</SelectItem>
                <SelectItem value="md">Medium (48px)</SelectItem>
                <SelectItem value="lg">Large (64px)</SelectItem>
                <SelectItem value="xl">Extra Large (80px)</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Alignment">
            <div className="flex gap-1">
              {[
                { value: 'flex-start', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'flex-end', icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handlePropsChange('alignment', value)}
                  className={cn(
                    'flex-1 p-2 rounded-md border transition-colors',
                    (element.props?.alignment || 'flex-start') === value
                      ? 'border-builder-accent bg-builder-accent/10 text-builder-accent'
                      : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                  )}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
              ))}
            </div>
          </FieldGroup>
        </Section>
        
        <Section title="Badge Content" icon={<Sparkles className="w-4 h-4" />}>
          <FieldGroup label="Show">
            <Select
              value={(element.props?.icon as string) === 'number' || !element.props?.icon ? 'number' : 'icon'}
              onValueChange={(v) => handlePropsChange('icon', v === 'number' ? 'number' : 'Check')}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Display" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="number">Step Number</SelectItem>
                <SelectItem value="icon">Custom Icon</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          {element.props?.icon && element.props?.icon !== 'number' && (
            <FieldGroup label="Select Icon">
              <ButtonIconPicker
                value={(element.props?.icon as string) || 'Check'}
                onChange={(iconName) => handlePropsChange('icon', iconName)}
              />
            </FieldGroup>
          )}
        </Section>
        
        <Section title="Colors" icon={<Award className="w-4 h-4" />}>
          <div className="space-y-3">
            {/* Accent Type Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Accent Type</span>
              <div className="flex rounded-lg overflow-hidden border border-builder-border">
                <button
                  onClick={() => handlePropsChange('accentType', 'solid')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    (element.props?.accentType || 'solid') === 'solid'
                      ? 'bg-builder-accent text-white' 
                      : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                  )}
                >
                  Solid
                </button>
                <button
                  onClick={() => handlePropsChange('accentType', 'gradient')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    element.props?.accentType === 'gradient'
                      ? 'bg-builder-accent text-white' 
                      : 'bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface'
                  )}
                >
                  Gradient
                </button>
              </div>
            </div>
            
            {(element.props?.accentType || 'solid') === 'solid' ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Accent Color</span>
                <ColorPickerPopover
                  color={(element.props?.accentColor as string) || primaryColor}
                  onChange={(c) => handlePropsChange('accentColor', c)}
                  showGradientOption
                  onGradientClick={() => handlePropsChange('accentType', 'gradient')}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.accentColor as string) || primaryColor }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </ColorPickerPopover>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-builder-text-muted">Accent Gradient</span>
                <GradientPickerPopover
                  value={(element.props?.accentGradient as GradientValue) || { type: 'linear', angle: 135, stops: [{ color: '#8B5CF6', position: 0 }, { color: '#D946EF', position: 100 }] }}
                  onChange={(g) => handlePropsChange('accentGradient', g)}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                    <div className="w-6 h-6 rounded-md border border-builder-border" style={{ background: gradientToCSS((element.props?.accentGradient as GradientValue) || { type: 'linear', angle: 135, stops: [{ color: '#8B5CF6', position: 0 }, { color: '#D946EF', position: 100 }] }) }} />
                    <span className="text-xs text-builder-text-muted">Edit</span>
                  </button>
                </GradientPickerPopover>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Text Color</span>
              <ColorPickerPopover
                color={(element.props?.textColor as string) || '#ffffff'}
                onChange={(c) => handlePropsChange('textColor', c)}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.textColor as string) || '#ffffff' }} />
                  <span className="text-xs text-builder-text-muted">Edit</span>
                </button>
              </ColorPickerPopover>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Number/Icon Color</span>
              <ColorPickerPopover
                color={(element.props?.numberColor as string) || '#ffffff'}
                onChange={(c) => handlePropsChange('numberColor', c)}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.numberColor as string) || '#ffffff' }} />
                  <span className="text-xs text-builder-text-muted">Edit</span>
                </button>
              </ColorPickerPopover>
            </div>
          </div>
        </Section>
        
        <Section title="Connector" icon={<ListOrdered className="w-4 h-4" />}>
          <FieldGroup label="Show Connector">
            <BooleanToggle
              value={coerceBoolean(element.props?.showConnector, true)}
              onValueChange={(v) => handlePropsChange('showConnector', v)}
            />
          </FieldGroup>
          
          {(element.props?.showConnector ?? true) && (
            <FieldGroup label="Connector Style">
              <Select
                value={(element.props?.connectorStyle as string) || 'solid'}
                onValueChange={(v) => handlePropsChange('connectorStyle', v)}
              >
                <SelectTrigger className="builder-input text-xs">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="solid">Solid Line</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="arrow">Arrow</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
        </Section>
      </div>
    );
  }

  // ========== VIDEO THUMBNAIL ==========
  if (element.type === 'video-thumbnail') {
    return (
      <div className="space-y-0">
        <Section title="Video" icon={<Play className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Video URL">
            <Input
              value={(element.props?.videoUrl as string) || ''}
              onChange={(e) => handlePropsChange('videoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="builder-input text-xs"
            />
          </FieldGroup>
          
          <FieldGroup label="Thumbnail Image">
            <Input
              value={(element.props?.thumbnailUrl as string) || ''}
              onChange={(e) => handlePropsChange('thumbnailUrl', e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
              className="builder-input text-xs"
            />
          </FieldGroup>
          
          <FieldGroup label="Overlay Style">
            <Select
              value={(element.props?.overlayStyle as string) || 'gradient'}
              onValueChange={(v) => handlePropsChange('overlayStyle', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Overlay" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="gradient">Gradient Fade</SelectItem>
                <SelectItem value="solid">Solid Overlay</SelectItem>
                <SelectItem value="none">No Overlay</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </Section>
        
        <Section title="Playback" icon={<Play className="w-4 h-4" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Show Play Button</span>
              <BooleanToggle
                value={coerceBoolean(element.props?.showPlayButton, true)}
                onValueChange={(v) => handlePropsChange('showPlayButton', v)}
                labels={['On', 'Off']}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Autoplay on Click</span>
              <BooleanToggle
                value={coerceBoolean(element.props?.autoplayOnClick, true)}
                onValueChange={(v) => handlePropsChange('autoplayOnClick', v)}
                labels={['On', 'Off']}
              />
            </div>
          </div>
          
          {element.props?.showPlayButton !== false && (
            <FieldGroup label="Play Button Style">
              <Select
                value={(element.props?.playButtonStyle as string) || 'rounded'}
                onValueChange={(v) => handlePropsChange('playButtonStyle', v)}
              >
                <SelectTrigger className="builder-input text-xs">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
        </Section>
      </div>
    );
  }

  // ========== UNDERLINE TEXT ==========
  if (element.type === 'underline-text') {
    return (
      <div className="space-y-0">
        <Section title="Content" icon={<Underline className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Text">
            <Input
              value={element.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Underlined text..."
              className="builder-input text-xs"
            />
          </FieldGroup>
          
          <FieldGroup label="Alignment">
            <div className="flex gap-1">
              <button
                onClick={() => handlePropsChange('textAlign', 'left')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  (element.props?.textAlign || 'left') === 'left' 
                    ? 'bg-builder-accent text-white' 
                    : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                )}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePropsChange('textAlign', 'center')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  element.props?.textAlign === 'center' 
                    ? 'bg-builder-accent text-white' 
                    : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                )}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePropsChange('textAlign', 'right')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  element.props?.textAlign === 'right' 
                    ? 'bg-builder-accent text-white' 
                    : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                )}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </FieldGroup>
        </Section>
        
        <Section title="Underline Colors" icon={<Sparkles className="w-4 h-4" />} defaultOpen>
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">From</span>
            <ColorPickerPopover
              color={(element.props?.underlineFrom as string) || primaryColor}
              onChange={(c) => handlePropsChange('underlineFrom', c)}
            >
              <button className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.underlineFrom as string) || primaryColor }} />
            </ColorPickerPopover>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">To</span>
            <ColorPickerPopover
              color={(element.props?.underlineTo as string) || '#EC4899'}
              onChange={(c) => handlePropsChange('underlineTo', c)}
            >
              <button className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.underlineTo as string) || '#EC4899'}} />
            </ColorPickerPopover>
          </div>
        </Section>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="p-4 text-center text-builder-text-muted text-xs">
      No inspector available for {element.type}
    </div>
  );
};
