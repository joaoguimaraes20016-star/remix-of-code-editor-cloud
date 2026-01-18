import React, { useState } from 'react';
import { Element } from '../../../types/infostack';
import { cn } from '@/lib/utils';
import { CommitSlider } from '../CommitSlider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Eye, 
  Square, 
  Monitor, 
  Tablet, 
  Smartphone,
  RotateCw,
  Layers,
  Sparkles,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Move,
} from 'lucide-react';
import { ColorPickerPopover } from '../modals';
import { CollapsibleSection } from './shared/CollapsibleSection';

interface UniversalAppearanceSectionProps {
  element: Element;
  onUpdate: (updates: Partial<Element>) => void;
}

export const UniversalAppearanceSection: React.FC<UniversalAppearanceSectionProps> = ({
  element,
  onUpdate,
}) => {
  const handleStyleChange = (key: string, value: string) => {
    onUpdate({ styles: { ...element.styles, [key]: value } });
  };

  const handlePropsChange = (key: string, value: unknown) => {
    onUpdate({ props: { ...element.props, [key]: value } });
  };

  // Parse numeric values from styles
  const opacity = typeof element.styles?.opacity === 'string' 
    ? parseInt(element.styles.opacity) 
    : (element.styles?.opacity as number) ?? 100;
  const rotation = typeof element.styles?.rotate === 'string'
    ? parseInt(element.styles.rotate)
    : (element.styles?.rotate as number) ?? 0;
  const blur = (element.props?.blur as number) ?? 0;
  const brightness = (element.props?.brightness as number) ?? 100;
  const marginTop = parseInt((element.styles?.marginTop as string) || '0');
  const marginBottom = parseInt((element.styles?.marginBottom as string) || '0');
  
  return (
    <>
      {/* ========== SIZE & DIMENSIONS SECTION ========== */}
      <CollapsibleSection title="Size & Dimensions" icon={<Maximize2 className="w-4 h-4" />} defaultOpen>
        <div className="pt-3 space-y-4">
          {/* Width control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Width</span>
              <span className="text-xs font-mono text-builder-text-dim">
                {element.styles?.width || 'auto'}
              </span>
            </div>
            <div className="flex gap-2">
              <Select
                value={(element.styles?.width as string)?.includes('px') ? 'custom' : ((element.styles?.width as string) || 'auto')}
                onValueChange={(v) => {
                  if (v === 'custom') {
                    handleStyleChange('width', '200px');
                  } else {
                    handleStyleChange('width', v);
                  }
                }}
              >
                <SelectTrigger className="builder-input text-xs flex-1">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="100%">Full Width</SelectItem>
                  <SelectItem value="75%">75%</SelectItem>
                  <SelectItem value="50%">50%</SelectItem>
                  <SelectItem value="fit-content">Fit Content</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {(element.styles?.width as string)?.includes('px') && (
                <Input
                  type="number"
                  className="builder-input w-20 text-xs text-center"
                  value={parseInt((element.styles?.width as string) || '200')}
                  onChange={(e) => handleStyleChange('width', `${e.target.value}px`)}
                  min={0}
                  max={2000}
                />
              )}
            </div>
          </div>

          {/* Height control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Height</span>
              <span className="text-xs font-mono text-builder-text-dim">
                {element.styles?.height || 'auto'}
              </span>
            </div>
            <div className="flex gap-2">
              <Select
                value={(element.styles?.height as string)?.includes('px') ? 'custom' : ((element.styles?.height as string) || 'auto')}
                onValueChange={(v) => {
                  if (v === 'custom') {
                    handleStyleChange('height', '100px');
                  } else {
                    handleStyleChange('height', v);
                  }
                }}
              >
                <SelectTrigger className="builder-input text-xs flex-1">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="100%">Full Height</SelectItem>
                  <SelectItem value="fit-content">Fit Content</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {(element.styles?.height as string)?.includes('px') && (
                <Input
                  type="number"
                  className="builder-input w-20 text-xs text-center"
                  value={parseInt((element.styles?.height as string) || '100')}
                  onChange={(e) => handleStyleChange('height', `${e.target.value}px`)}
                  min={0}
                  max={2000}
                />
              )}
            </div>
          </div>

          {/* Max Width */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Max Width</span>
            <Input
              className="builder-input w-24 text-xs text-center"
              value={(element.styles?.maxWidth as string) || ''}
              onChange={(e) => {
                const v = e.target.value.trim();
                handleStyleChange('maxWidth', v ? (/^\d+$/.test(v) ? `${v}px` : v) : '');
              }}
              placeholder="none"
            />
          </div>

          {/* Min Height */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Min Height</span>
            <Input
              className="builder-input w-24 text-xs text-center"
              value={(element.styles?.minHeight as string) || ''}
              onChange={(e) => {
                const v = e.target.value.trim();
                handleStyleChange('minHeight', v ? (/^\d+$/.test(v) ? `${v}px` : v) : '');
              }}
              placeholder="none"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ========== LAYOUT & SPACING SECTION ========== */}
      <CollapsibleSection title="Layout & Spacing" icon={<Move className="w-4 h-4" />}>
        <div className="pt-3 space-y-4">
          {/* Alignment within parent */}
          <div className="space-y-2">
            <span className="text-xs text-builder-text-muted">Align Self</span>
            <div className="flex gap-1">
              {[
                { value: 'flex-start', icon: AlignLeft, label: 'Left' },
                { value: 'center', icon: AlignCenter, label: 'Center' },
                { value: 'flex-end', icon: AlignRight, label: 'Right' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => handleStyleChange('alignSelf', value)}
                  className={cn(
                    'flex-1 p-2 rounded border transition-colors',
                    (element.styles?.alignSelf || 'flex-start') === value
                      ? 'border-builder-accent bg-builder-accent/10 text-builder-accent'
                      : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                  )}
                  title={label}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div className="space-y-2">
            <span className="text-xs text-builder-text-muted">Padding</span>
            <div className="grid grid-cols-4 gap-1">
              {(['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => {
                const key = `padding${side}` as keyof typeof element.styles;
                return (
                  <div key={side} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-builder-text-muted">{side[0]}</span>
                    <Input 
                      className="builder-input text-xs text-center h-7 w-full" 
                      value={(element.styles?.[key] as string) || ''}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        handleStyleChange(key, v ? (/^\d+$/.test(v) ? `${v}px` : v) : '');
                      }}
                      placeholder="0"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Margin */}
          <div className="space-y-2">
            <span className="text-xs text-builder-text-muted">Margin</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-builder-text-dim">Top</span>
                  <span className="text-[10px] font-mono text-builder-text-dim">{marginTop}px</span>
                </div>
                <CommitSlider
                  value={marginTop}
                  onValueCommit={(v) => handleStyleChange('marginTop', `${v}px`)}
                  min={0} max={100} step={4}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-builder-text-dim">Bottom</span>
                  <span className="text-[10px] font-mono text-builder-text-dim">{marginBottom}px</span>
                </div>
                <CommitSlider
                  value={marginBottom}
                  onValueCommit={(v) => handleStyleChange('marginBottom', `${v}px`)}
                  min={0} max={100} step={4}
                />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>
      
      {/* ========== APPEARANCE SECTION ========== */}
      <CollapsibleSection title="Appearance" icon={<Eye className="w-4 h-4" />}>
        <div className="pt-3 space-y-4">
          {/* Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Opacity</span>
              <span className="text-xs font-mono text-builder-text-dim">{opacity}%</span>
            </div>
            <CommitSlider 
              value={opacity}
              onValueCommit={(v) => handleStyleChange('opacity', String(v))}
              min={0} max={100} step={5}
              className="w-full"
            />
          </div>
          
          {/* Rotation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-builder-text-muted" />
                <span className="text-xs text-builder-text-muted">Rotation</span>
              </div>
              <span className="text-xs font-mono text-builder-text-dim">{rotation}°</span>
            </div>
            <CommitSlider 
              value={rotation}
              onValueCommit={(v) => handleStyleChange('rotate', String(v))}
              min={0} max={360} step={5}
              className="w-full"
            />
          </div>
          
          {/* Blur */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Blur</span>
              <span className="text-xs font-mono text-builder-text-dim">{blur}px</span>
            </div>
            <CommitSlider 
              value={blur}
              onValueCommit={(v) => handlePropsChange('blur', v)}
              min={0} max={20} step={1}
              className="w-full"
            />
          </div>
          
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Brightness</span>
              <span className="text-xs font-mono text-builder-text-dim">{brightness}%</span>
            </div>
            <CommitSlider 
              value={brightness}
              onValueCommit={(v) => handlePropsChange('brightness', v)}
              min={50} max={150} step={5}
              className="w-full"
            />
          </div>
          
          {/* Shadow Preset */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Shadow</span>
            <Select 
              value={(element.props?.shadowPreset as string) || 'none'}
              onValueChange={(value) => handlePropsChange('shadowPreset', value)}
            >
              <SelectTrigger className="builder-input w-24"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">X-Large</SelectItem>
                <SelectItem value="2xl">2X-Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Z-Index */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-builder-text-muted" />
              <span className="text-xs text-builder-text-muted">Layer</span>
            </div>
            <Select 
              value={String(element.styles?.zIndex || 'auto')}
              onValueChange={(value) => handleStyleChange('zIndex', value)}
            >
              <SelectTrigger className="builder-input w-20"><SelectValue placeholder="Auto" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleSection>

      {/* ========== BORDER SECTION ========== */}
      <CollapsibleSection title="Border" icon={<Square className="w-4 h-4" />}>
        <div className="pt-3 space-y-3">
          {/* Border Width */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Width</span>
            <Select 
              value={(element.styles?.borderWidth as string) || '0px'}
              onValueChange={(value) => handleStyleChange('borderWidth', value)}
            >
              <SelectTrigger className="builder-input w-20"><SelectValue placeholder="0px" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="0px">None</SelectItem>
                <SelectItem value="1px">1px</SelectItem>
                <SelectItem value="2px">2px</SelectItem>
                <SelectItem value="3px">3px</SelectItem>
                <SelectItem value="4px">4px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Border Style */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Style</span>
            <Select 
              value={(element.styles?.borderStyle as string) || 'solid'}
              onValueChange={(value) => handleStyleChange('borderStyle', value)}
            >
              <SelectTrigger className="builder-input w-20"><SelectValue placeholder="Solid" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Border Color */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Color</span>
            <ColorPickerPopover 
              color={(element.styles?.borderColor as string) || '#e5e7eb'}
              onChange={(color) => handleStyleChange('borderColor', color)}
            >
              <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-builder-surface-hover transition-colors">
                <div 
                  className="w-6 h-6 rounded-md border border-builder-border" 
                  style={{ backgroundColor: (element.styles?.borderColor as string) || '#e5e7eb' }} 
                />
                <span className="text-xs text-builder-text-muted">Edit</span>
              </button>
            </ColorPickerPopover>
          </div>
          
          {/* Border Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Radius</span>
              <span className="text-xs font-mono text-builder-text-dim">
                {element.styles?.borderRadius || '0px'}
              </span>
            </div>
            <CommitSlider 
              value={parseInt((element.styles?.borderRadius as string) || '0')}
              onValueCommit={(v) => handleStyleChange('borderRadius', `${v}px`)}
              min={0} max={50} step={2}
              className="w-full"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ========== RESPONSIVE VISIBILITY SECTION ========== */}
      <CollapsibleSection title="Responsive" icon={<Sparkles className="w-4 h-4" />}>
        <div className="pt-3 space-y-3">
          <p className="text-[10px] text-builder-text-dim">
            Hide this element on specific screen sizes.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePropsChange('hideOnDesktop', !element.props?.hideOnDesktop)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                element.props?.hideOnDesktop 
                  ? 'border-destructive/50 bg-destructive/10 text-destructive' 
                  : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface-active'
              )}
              title="Hide on Desktop"
            >
              <Monitor className="w-4 h-4" />
              <span className="text-[10px]">{element.props?.hideOnDesktop ? 'Hidden' : 'Visible'}</span>
            </button>
            <button
              onClick={() => handlePropsChange('hideOnTablet', !element.props?.hideOnTablet)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                element.props?.hideOnTablet 
                  ? 'border-destructive/50 bg-destructive/10 text-destructive' 
                  : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface-active'
              )}
              title="Hide on Tablet"
            >
              <Tablet className="w-4 h-4" />
              <span className="text-[10px]">{element.props?.hideOnTablet ? 'Hidden' : 'Visible'}</span>
            </button>
            <button
              onClick={() => handlePropsChange('hideOnMobile', !element.props?.hideOnMobile)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                element.props?.hideOnMobile 
                  ? 'border-destructive/50 bg-destructive/10 text-destructive' 
                  : 'border-builder-border bg-builder-surface-hover text-builder-text-muted hover:bg-builder-surface-active'
              )}
              title="Hide on Mobile"
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[10px]">{element.props?.hideOnMobile ? 'Hidden' : 'Visible'}</span>
            </button>
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
};
