/**
 * Premium Element Inspector
 * Provides editing controls for all premium element types:
 * - gradient-text, stat-number, avatar-group, ticker
 * - badge, process-step, video-thumbnail, underline-text
 */

import React, { useState } from 'react';
import { Element } from '../../../types/infostack';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
} from 'lucide-react';

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
        </Section>
      </div>
    );
  }

  // ========== AVATAR GROUP ==========
  if (element.type === 'avatar-group') {
    const count = (element.props?.count as number) || 3;
    
    return (
      <div className="space-y-0">
        <Section title="Avatars" icon={<Users className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Count">
            <div className="flex items-center gap-3">
              <Slider
                value={[count]}
                onValueChange={([v]) => handlePropsChange('count', v)}
                min={2}
                max={8}
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
                <SelectItem value="sm">Small (32px)</SelectItem>
                <SelectItem value="md">Medium (40px)</SelectItem>
                <SelectItem value="lg">Large (48px)</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Color">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-dim">Gradient Start</span>
              <ColorPickerPopover
                color={(element.props?.gradientFrom as string) || primaryColor}
                onChange={(c) => handlePropsChange('gradientFrom', c)}
              >
                <button className="w-6 h-6 rounded-md border border-builder-border" style={{ backgroundColor: (element.props?.gradientFrom as string) || primaryColor }} />
              </ColorPickerPopover>
            </div>
          </FieldGroup>
        </Section>
      </div>
    );
  }

  // ========== TICKER ==========
  if (element.type === 'ticker') {
    const items = (element.props?.items as string[]) || ['Item 1', 'Item 2', 'Item 3'];
    const speed = (element.props?.speed as number) || 30;
    
    return (
      <div className="space-y-0">
        <Section title="Items" icon={<ListOrdered className="w-4 h-4" />} defaultOpen>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[i] = e.target.value;
                    handlePropsChange('items', newItems);
                  }}
                  className="builder-input text-xs flex-1"
                />
                <button
                  onClick={() => {
                    const newItems = items.filter((_, idx) => idx !== i);
                    handlePropsChange('items', newItems);
                  }}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-builder-text-muted hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePropsChange('items', [...items, `Item ${items.length + 1}`])}
              className="w-full text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Item
            </Button>
          </div>
          
          <FieldGroup label="Separator">
            <Input
              value={(element.props?.separator as string) || '  •  '}
              onChange={(e) => handlePropsChange('separator', e.target.value)}
              className="builder-input text-xs"
            />
          </FieldGroup>
        </Section>
        
        <Section title="Animation" icon={<Play className="w-4 h-4" />}>
          <FieldGroup label="Speed (seconds per loop)">
            <div className="flex items-center gap-3">
              <Slider
                value={[speed]}
                onValueChange={([v]) => handlePropsChange('speed', v)}
                min={10}
                max={60}
                step={5}
                className="flex-1"
              />
              <span className="text-xs font-mono text-builder-text-muted w-8 text-center">{speed}s</span>
            </div>
          </FieldGroup>
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
          
          <FieldGroup label="Variant">
            <Select
              value={(element.props?.variant as string) || 'primary'}
              onValueChange={(v) => handlePropsChange('variant', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Variant" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="primary">Primary (Purple)</SelectItem>
                <SelectItem value="success">Success (Green)</SelectItem>
                <SelectItem value="warning">Warning (Orange)</SelectItem>
                <SelectItem value="premium">Premium (Gold)</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          
          <FieldGroup label="Show Icon">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePropsChange('icon', element.props?.icon ? undefined : 'sparkles')}
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
        </Section>
      </div>
    );
  }

  // ========== PROCESS STEP ==========
  if (element.type === 'process-step') {
    return (
      <div className="space-y-0">
        <Section title="Step" icon={<ListOrdered className="w-4 h-4" />} defaultOpen>
          <FieldGroup label="Step Number">
            <Input
              type="number"
              value={(element.props?.step as number) || 1}
              onChange={(e) => handlePropsChange('step', parseInt(e.target.value) || 1)}
              min={1}
              max={10}
              className="builder-input text-xs"
            />
          </FieldGroup>
          
          <FieldGroup label="Title">
            <Input
              value={element.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Step title..."
              className="builder-input text-xs"
            />
          </FieldGroup>
          
          <FieldGroup label="Icon">
            <Select
              value={(element.props?.icon as string) || 'number'}
              onValueChange={(v) => handlePropsChange('icon', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Icon" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="number">Show Number</SelectItem>
                <SelectItem value="map">Map</SelectItem>
                <SelectItem value="share-2">Share</SelectItem>
                <SelectItem value="rocket">Rocket</SelectItem>
                <SelectItem value="check">Checkmark</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
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
