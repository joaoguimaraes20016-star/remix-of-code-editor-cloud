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
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Maximize2,
  Move,
  Droplets,
  Blend,
  Palette,
  ArrowUpDown,
  ArrowLeftRight,
  Grid3X3,
  Anchor,
} from 'lucide-react';
import { ColorPickerPopover, ShadowEditor } from '../modals';
import { CollapsibleSection } from './shared/CollapsibleSection';
import { 
  blendModeOptions, 
  ShadowLayer, 
  shadowLayersToCSS,
  positionOptions,
  flexDirectionOptions,
  flexWrapOptions,
  justifyContentOptions,
  alignItemsOptions,
  displayModeOptions,
  gridColumnsOptions,
  gridAlignItemsOptions,
  gridJustifyItemsOptions,
} from '../../utils/presets';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface UniversalAppearanceSectionProps {
  element: Element;
  onUpdate: (updates: Partial<Element>) => void;
  currentDeviceMode?: DeviceMode;
}

export const UniversalAppearanceSection: React.FC<UniversalAppearanceSectionProps> = ({
  element,
  onUpdate,
  currentDeviceMode = 'desktop',
}) => {
  const isResponsiveMode = currentDeviceMode !== 'desktop';
  
  // Route style changes through responsive overrides when in tablet/mobile mode
  const handleStyleChange = (key: string, value: string) => {
    if (isResponsiveMode) {
      const currentResponsive = element.responsive || {};
      onUpdate({
        responsive: {
          ...currentResponsive,
          [currentDeviceMode]: {
            ...(currentResponsive[currentDeviceMode] || {}),
            [key]: value
          }
        }
      });
    } else {
      onUpdate({ styles: { [key]: value } });
    }
  };

  const handlePropsChange = (key: string, value: unknown) => {
    if (isResponsiveMode) {
      const currentResponsive = element.responsive || {};
      onUpdate({
        responsive: {
          ...currentResponsive,
          [currentDeviceMode]: {
            ...(currentResponsive[currentDeviceMode] || {}),
            [key]: value
          }
        }
      });
    } else {
      onUpdate({ props: { [key]: value } });
    }
  };
  
  // Get effective value - check responsive override first, then base
  const getEffectiveStyle = (key: string, defaultValue: string = ''): string => {
    if (isResponsiveMode && element.responsive?.[currentDeviceMode]?.[key] !== undefined) {
      return String(element.responsive[currentDeviceMode][key]);
    }
    return String(element.styles?.[key] ?? defaultValue);
  };
  
  const getEffectiveProp = <T,>(key: string, defaultValue: T): T => {
    if (isResponsiveMode && element.responsive?.[currentDeviceMode]?.[key] !== undefined) {
      return element.responsive[currentDeviceMode][key] as T;
    }
    return (element.props?.[key] as T) ?? defaultValue;
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
  
  // Advanced filter values
  const backdropBlur = parseInt((element.styles?.backdropBlur as string) || '0');
  const hueRotate = (element.props?.hueRotate as number) ?? 0;
  const saturation = (element.props?.saturation as number) ?? 100;
  const contrast = (element.props?.contrast as number) ?? 100;
  const grayscale = (element.props?.grayscale as number) ?? 0;
  const sepia = (element.props?.sepia as number) ?? 0;
  const invert = (element.props?.invert as number) ?? 0;
  
  // Multi-layer shadow
  const shadowLayers = (element.props?.shadowLayers as ShadowLayer[]) || [];
  
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
                  max={10000}
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
                  max={10000}
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

      {/* ========== POSITION SECTION ========== */}
      <CollapsibleSection title="Position" icon={<Anchor className="w-4 h-4" />}>
        <div className="pt-3 space-y-4">
          {/* Position Mode */}
          <div className="space-y-2">
            <span className="text-xs text-builder-text-muted">Position</span>
            <Select
              value={(element.styles?.position as string) || 'static'}
              onValueChange={(v) => handleStyleChange('position', v)}
            >
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Static" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {positionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position offsets - shown for non-static positions */}
          {element.styles?.position && element.styles.position !== 'static' && (
            <div className="space-y-2">
              <span className="text-xs text-builder-text-dim">Offsets</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'top', label: 'Top' },
                  { key: 'right', label: 'Right' },
                  { key: 'bottom', label: 'Bottom' },
                  { key: 'left', label: 'Left' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className="text-[10px] text-builder-text-dim w-10">{label}</span>
                    <Input
                      className="builder-input text-xs text-center h-6 flex-1"
                      value={(element.styles?.[key as keyof typeof element.styles] as string) || ''}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        handleStyleChange(key, v ? (/^\d+$/.test(v) ? `${v}px` : v) : '');
                      }}
                      placeholder="auto"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ========== LAYOUT & SPACING SECTION ========== */}
      <CollapsibleSection title="Layout & Spacing" icon={<Move className="w-4 h-4" />}>
        <div className="pt-3 space-y-4">
          {/* Align Self */}
          <div className="space-y-2">
            <span className="text-xs text-builder-text-muted">Align Self</span>
            <div className="flex gap-1">
              {[
                { value: 'flex-start', icon: AlignLeft, label: 'Start' },
                { value: 'center', icon: AlignCenter, label: 'Center' },
                { value: 'flex-end', icon: AlignRight, label: 'End' },
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

          {/* Gap */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Grid3X3 className="w-3.5 h-3.5 text-builder-text-muted" />
              <span className="text-xs text-builder-text-muted">Gap</span>
            </div>
            <Input
              type="number"
              className="builder-input w-20 text-xs text-center"
              value={parseInt((element.styles?.gap as string) || '0')}
              onChange={(e) => handleStyleChange('gap', `${e.target.value}px`)}
              min={0}
              max={200}
              placeholder="0"
            />
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
                  min={0} max={500} step={4}
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
                  min={0} max={500} step={4}
                />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ========== LAYOUT MODE SECTION (flex/grid for containers) ========== */}
      <CollapsibleSection title="Layout Mode" icon={<Layout className="w-4 h-4" />}>
        <div className="pt-3 space-y-4">
          {/* Display Mode Toggle */}
          <div className="space-y-2">
            <span className="text-xs text-builder-text-muted">Display</span>
            <div className="flex gap-1">
              {displayModeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStyleChange('display', opt.value)}
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                    (element.styles?.display || 'block') === opt.value
                      ? 'bg-builder-accent text-white'
                      : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flex-specific controls */}
          {(element.styles?.display === 'flex' || !element.styles?.display) && (
            <>
              {/* Flex Direction */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-builder-text-muted" />
                  <span className="text-xs text-builder-text-muted">Direction</span>
                </div>
                <Select
                  value={(element.styles?.flexDirection as string) || 'column'}
                  onValueChange={(v) => handleStyleChange('flexDirection', v)}
                >
                  <SelectTrigger className="builder-input text-xs">
                    <SelectValue placeholder="Column" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {flexDirectionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flex Wrap */}
              <div className="space-y-2">
                <span className="text-xs text-builder-text-muted">Wrap</span>
                <Select
                  value={(element.styles?.flexWrap as string) || 'nowrap'}
                  onValueChange={(v) => handleStyleChange('flexWrap', v)}
                >
                  <SelectTrigger className="builder-input text-xs">
                    <SelectValue placeholder="No Wrap" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {flexWrapOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Justify Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlignHorizontalJustifyCenter className="w-3.5 h-3.5 text-builder-text-muted" />
                  <span className="text-xs text-builder-text-muted">Justify Content</span>
                </div>
                <Select
                  value={(element.styles?.justifyContent as string) || 'flex-start'}
                  onValueChange={(v) => handleStyleChange('justifyContent', v)}
                >
                  <SelectTrigger className="builder-input text-xs">
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {justifyContentOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Align Items */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-builder-text-muted" />
                  <span className="text-xs text-builder-text-muted">Align Items</span>
                </div>
                <Select
                  value={(element.styles?.alignItems as string) || 'stretch'}
                  onValueChange={(v) => handleStyleChange('alignItems', v)}
                >
                  <SelectTrigger className="builder-input text-xs">
                    <SelectValue placeholder="Stretch" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {alignItemsOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flex Grow/Shrink */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Grow</span>
                  <Input
                    type="number"
                    className="builder-input w-14 text-xs text-center"
                    value={(element.styles?.flexGrow as string) || '0'}
                    onChange={(e) => handleStyleChange('flexGrow', e.target.value)}
                    min={0}
                    max={10}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Shrink</span>
                  <Input
                    type="number"
                    className="builder-input w-14 text-xs text-center"
                    value={(element.styles?.flexShrink as string) || '1'}
                    onChange={(e) => handleStyleChange('flexShrink', e.target.value)}
                    min={0}
                    max={10}
                  />
                </div>
              </div>
            </>
          )}

          {/* Grid-specific controls */}
          {element.styles?.display === 'grid' && (
            <>
              {/* Grid Columns */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Grid3X3 className="w-3.5 h-3.5 text-builder-text-muted" />
                  <span className="text-xs text-builder-text-muted">Columns</span>
                </div>
                <Select
                  value={(element.styles?.gridTemplateColumns as string)?.match(/repeat\((\d+)/)?.[1] || '2'}
                  onValueChange={(v) => handleStyleChange('gridTemplateColumns', `repeat(${v}, 1fr)`)}
                >
                  <SelectTrigger className="builder-input text-xs">
                    <SelectValue placeholder="2" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {gridColumnsOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label} Column{opt.value !== '1' ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Column Gap */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Column Gap</span>
                  <span className="text-xs font-mono text-builder-text-dim">
                    {parseInt((element.styles?.columnGap as string) || '16')}px
                  </span>
                </div>
                <CommitSlider 
                  value={parseInt((element.styles?.columnGap as string) || '16')}
                  onValueCommit={(v) => handleStyleChange('columnGap', `${v}px`)}
                  min={0} max={64} step={4}
                  className="w-full"
                />
              </div>

              {/* Row Gap */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Row Gap</span>
                  <span className="text-xs font-mono text-builder-text-dim">
                    {parseInt((element.styles?.rowGap as string) || '16')}px
                  </span>
                </div>
                <CommitSlider 
                  value={parseInt((element.styles?.rowGap as string) || '16')}
                  onValueCommit={(v) => handleStyleChange('rowGap', `${v}px`)}
                  min={0} max={64} step={4}
                  className="w-full"
                />
              </div>

              {/* Align Items (Grid) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-builder-text-muted" />
                  <span className="text-xs text-builder-text-muted">Align Items</span>
                </div>
                <Select
                  value={(element.styles?.alignItems as string) || 'stretch'}
                  onValueChange={(v) => handleStyleChange('alignItems', v)}
                >
                  <SelectTrigger className="builder-input text-xs">
                    <SelectValue placeholder="Stretch" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {gridAlignItemsOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Justify Items (Grid) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlignHorizontalJustifyCenter className="w-3.5 h-3.5 text-builder-text-muted" />
                  <span className="text-xs text-builder-text-muted">Justify Items</span>
                </div>
                <Select
                  value={(element.styles?.justifyItems as string) || 'stretch'}
                  onValueChange={(v) => handleStyleChange('justifyItems', v)}
                >
                  <SelectTrigger className="builder-input text-xs">
                    <SelectValue placeholder="Stretch" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {gridJustifyItemsOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
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
              min={0} max={100} step={1}
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
              min={0} max={360} step={1}
              className="w-full"
            />
          </div>
          
          {/* Blend Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Blend className="w-3.5 h-3.5 text-builder-text-muted" />
              <span className="text-xs text-builder-text-muted">Blend Mode</span>
            </div>
            <Select 
              value={(element.styles?.mixBlendMode as string) || 'normal'}
              onValueChange={(value) => handleStyleChange('mixBlendMode', value)}
            >
              <SelectTrigger className="builder-input w-28"><SelectValue placeholder="Normal" /></SelectTrigger>
              <SelectContent className="bg-background border-border max-h-60">
                {blendModeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Z-Index */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-builder-text-muted" />
              <span className="text-xs text-builder-text-muted">Layer (z-index)</span>
            </div>
            <Input
              type="number"
              className="builder-input w-20 text-xs text-center"
              value={element.styles?.zIndex === 'auto' ? '' : (element.styles?.zIndex || '')}
              onChange={(e) => {
                const v = e.target.value.trim();
                handleStyleChange('zIndex', v ? v : 'auto');
              }}
              placeholder="auto"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ========== EFFECTS SECTION ========== */}
      <CollapsibleSection title="Effects" icon={<Sparkles className="w-4 h-4" />}>
        <div className="pt-3 space-y-4">
          {/* Backdrop Blur (Glassmorphism) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-builder-text-muted" />
                <span className="text-xs text-builder-text-muted">Backdrop Blur</span>
              </div>
              <span className="text-xs font-mono text-builder-text-dim">{backdropBlur}px</span>
            </div>
            <CommitSlider 
              value={backdropBlur}
              onValueCommit={(v) => handleStyleChange('backdropBlur', `${v}px`)}
              min={0} max={40} step={1}
              className="w-full"
            />
          </div>
          
          {/* Element Blur */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Blur</span>
              <span className="text-xs font-mono text-builder-text-dim">{blur}px</span>
            </div>
            <CommitSlider 
              value={blur}
              onValueCommit={(v) => handlePropsChange('blur', v)}
              min={0} max={100} step={1}
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
          
          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Contrast</span>
              <span className="text-xs font-mono text-builder-text-dim">{contrast}%</span>
            </div>
            <CommitSlider 
              value={contrast}
              onValueCommit={(v) => handlePropsChange('contrast', v)}
              min={0} max={200} step={5}
              className="w-full"
            />
          </div>
          
          {/* Saturation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Saturation</span>
              <span className="text-xs font-mono text-builder-text-dim">{saturation}%</span>
            </div>
            <CommitSlider 
              value={saturation}
              onValueCommit={(v) => handlePropsChange('saturation', v)}
              min={0} max={200} step={5}
              className="w-full"
            />
          </div>
          
          {/* Hue Rotate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-builder-text-muted" />
                <span className="text-xs text-builder-text-muted">Hue Rotate</span>
              </div>
              <span className="text-xs font-mono text-builder-text-dim">{hueRotate}°</span>
            </div>
            <CommitSlider 
              value={hueRotate}
              onValueCommit={(v) => handlePropsChange('hueRotate', v)}
              min={0} max={360} step={5}
              className="w-full"
            />
          </div>
          
          {/* Grayscale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Grayscale</span>
              <span className="text-xs font-mono text-builder-text-dim">{grayscale}%</span>
            </div>
            <CommitSlider 
              value={grayscale}
              onValueCommit={(v) => handlePropsChange('grayscale', v)}
              min={0} max={100} step={5}
              className="w-full"
            />
          </div>
          
          {/* Sepia */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Sepia</span>
              <span className="text-xs font-mono text-builder-text-dim">{sepia}%</span>
            </div>
            <CommitSlider 
              value={sepia}
              onValueCommit={(v) => handlePropsChange('sepia', v)}
              min={0} max={100} step={5}
              className="w-full"
            />
          </div>
          
          {/* Invert */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Invert</span>
              <span className="text-xs font-mono text-builder-text-dim">{invert}%</span>
            </div>
            <CommitSlider 
              value={invert}
              onValueCommit={(v) => handlePropsChange('invert', v)}
              min={0} max={100} step={5}
              className="w-full"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ========== SHADOW SECTION ========== */}
      <CollapsibleSection title="Shadow" icon={<Layers className="w-4 h-4" />}>
        <div className="pt-3 space-y-3">
          {/* Quick presets for simple use */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Quick Preset</span>
            <Select 
              value={(element.props?.shadowPreset as string) || 'none'}
              onValueChange={(value) => {
                handlePropsChange('shadowPreset', value);
                // Clear custom layers when using preset
                if (value !== 'custom') {
                  handlePropsChange('shadowLayers', []);
                }
              }}
            >
              <SelectTrigger className="builder-input w-24"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">X-Large</SelectItem>
                <SelectItem value="2xl">2X-Large</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Multi-layer shadow editor - shown when custom is selected or layers exist */}
          {((element.props?.shadowPreset === 'custom') || shadowLayers.length > 0) && (
            <div className="mt-3 pt-3 border-t border-builder-border">
              <ShadowEditor
                value={shadowLayers}
                onChange={(layers) => {
                  handlePropsChange('shadowLayers', layers);
                  if (layers.length > 0) {
                    handlePropsChange('shadowPreset', 'custom');
                  }
                }}
                compact
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ========== BORDER SECTION ========== */}
      <CollapsibleSection title="Border" icon={<Square className="w-4 h-4" />}>
        <div className="pt-3 space-y-3">
          {/* Border Width - now allows arbitrary values */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Width</span>
            <Input
              type="number"
              className="builder-input w-20 text-xs text-center"
              value={parseInt((element.styles?.borderWidth as string) || '0')}
              onChange={(e) => handleStyleChange('borderWidth', `${e.target.value}px`)}
              min={0}
              max={50}
              placeholder="0"
            />
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
              showGradientOption={false}
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
          
          {/* Border Radius - expanded to allow pill/circle shapes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-builder-text-muted">Radius</span>
              <Input
                type="number"
                className="builder-input w-16 text-xs text-center h-6"
                value={parseInt((element.styles?.borderRadius as string) || '0')}
                onChange={(e) => handleStyleChange('borderRadius', `${e.target.value}px`)}
                min={0}
                max={999}
              />
            </div>
            <CommitSlider 
              value={parseInt((element.styles?.borderRadius as string) || '0')}
              onValueCommit={(v) => handleStyleChange('borderRadius', `${v}px`)}
              min={0} max={200} step={1}
              className="w-full"
            />
          </div>
          
          {/* Per-side Border Radius (advanced) */}
          <div className="space-y-2">
            <span className="text-xs text-builder-text-dim">Per-corner Radius</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'borderTopLeftRadius', label: 'TL' },
                { key: 'borderTopRightRadius', label: 'TR' },
                { key: 'borderBottomLeftRadius', label: 'BL' },
                { key: 'borderBottomRightRadius', label: 'BR' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-[10px] text-builder-text-dim w-5">{label}</span>
                  <Input
                    type="number"
                    className="builder-input text-xs text-center h-6 flex-1"
                    value={parseInt((element.styles?.[key as keyof typeof element.styles] as string) || '')}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      handleStyleChange(key, v ? `${v}px` : '');
                    }}
                    placeholder="—"
                    min={0}
                    max={999}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ========== RESPONSIVE VISIBILITY SECTION ========== */}
      <CollapsibleSection title="Responsive" icon={<Layout className="w-4 h-4" />}>
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
