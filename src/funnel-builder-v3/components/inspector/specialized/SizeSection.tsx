/**
 * SizeSection - Width, height, max-width, min-height controls
 */

import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { CollapsibleSection } from '../layout/CollapsibleSection';
import { ButtonGroup } from '../controls/ButtonGroup';
import { FieldGroup } from '../layout/FieldGroup';
import { cn } from '@/lib/utils';

export interface SizeSettings {
  width?: string;
  height?: string;
  maxWidth?: string;
  minHeight?: string;
}

export interface SizeSectionProps {
  value: SizeSettings;
  onChange: (key: keyof SizeSettings, value: string) => void;
  className?: string;
}

const widthPresets = [
  { value: 'auto', label: 'Auto' },
  { value: '100%', label: 'Full' },
  { value: '75%', label: '75%' },
  { value: '50%', label: '50%' },
  { value: 'fit-content', label: 'Fit' },
  { value: 'custom', label: '...' },
];

const heightPresets = [
  { value: 'auto', label: 'Auto' },
  { value: '100%', label: 'Full' },
  { value: 'fit-content', label: 'Fit' },
  { value: 'custom', label: '...' },
];

export function SizeSection({
  value,
  onChange,
  className,
}: SizeSectionProps) {
  const [customWidth, setCustomWidth] = useState(
    !widthPresets.some(p => p.value === value.width) ? value.width || '' : ''
  );
  const [customHeight, setCustomHeight] = useState(
    !heightPresets.some(p => p.value === value.height) ? value.height || '' : ''
  );

  const isCustomWidth = !widthPresets.slice(0, -1).some(p => p.value === value.width) && value.width;
  const isCustomHeight = !heightPresets.slice(0, -1).some(p => p.value === value.height) && value.height;

  const handleWidthPreset = (preset: string) => {
    if (preset === 'custom') {
      // Focus custom input
      return;
    }
    onChange('width', preset);
  };

  const handleHeightPreset = (preset: string) => {
    if (preset === 'custom') {
      return;
    }
    onChange('height', preset);
  };

  const inputClasses = cn(
    "w-full h-7 px-2 text-xs rounded",
    "bg-[hsl(var(--builder-v3-surface-active))]",
    "border border-[hsl(var(--builder-v3-border))]",
    "text-[hsl(var(--builder-v3-text))]",
    "focus:outline-none focus:ring-1 focus:ring-[hsl(var(--builder-v3-accent))]"
  );

  return (
    <CollapsibleSection
      title="Size"
      icon={<Maximize2 size={14} />}
      defaultOpen
      className={className}
    >
      <div className="space-y-4">
        {/* Width */}
        <div className="space-y-2">
          <FieldGroup label="Width">
            <div className="flex rounded-md border border-[hsl(var(--builder-v3-border))] overflow-hidden">
              {widthPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleWidthPreset(preset.value)}
                  className={cn(
                    "flex-1 h-7 text-[10px] font-medium transition-colors",
                    "border-r border-[hsl(var(--builder-v3-border))] last:border-r-0",
                    (value.width === preset.value || (preset.value === 'custom' && isCustomWidth))
                      ? "bg-[hsl(var(--builder-v3-accent))] text-white"
                      : "bg-[hsl(var(--builder-v3-surface-active))] text-[hsl(var(--builder-v3-text-secondary))] hover:bg-[hsl(var(--builder-v3-surface-hover))]"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </FieldGroup>

          {isCustomWidth && (
            <input
              type="text"
              value={customWidth}
              onChange={(e) => {
                setCustomWidth(e.target.value);
                onChange('width', e.target.value);
              }}
              className={inputClasses}
              placeholder="e.g., 320px, 50vw"
            />
          )}
        </div>

        {/* Height */}
        <div className="space-y-2">
          <FieldGroup label="Height">
            <div className="flex rounded-md border border-[hsl(var(--builder-v3-border))] overflow-hidden">
              {heightPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleHeightPreset(preset.value)}
                  className={cn(
                    "flex-1 h-7 text-[10px] font-medium transition-colors",
                    "border-r border-[hsl(var(--builder-v3-border))] last:border-r-0",
                    (value.height === preset.value || (preset.value === 'custom' && isCustomHeight))
                      ? "bg-[hsl(var(--builder-v3-accent))] text-white"
                      : "bg-[hsl(var(--builder-v3-surface-active))] text-[hsl(var(--builder-v3-text-secondary))] hover:bg-[hsl(var(--builder-v3-surface-hover))]"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </FieldGroup>

          {isCustomHeight && (
            <input
              type="text"
              value={customHeight}
              onChange={(e) => {
                setCustomHeight(e.target.value);
                onChange('height', e.target.value);
              }}
              className={inputClasses}
              placeholder="e.g., 400px, 50vh"
            />
          )}
        </div>

        {/* Max Width */}
        <FieldGroup label="Max Width" horizontal>
          <input
            type="text"
            value={value.maxWidth || ''}
            onChange={(e) => onChange('maxWidth', e.target.value)}
            className={cn(inputClasses, "w-24")}
            placeholder="none"
          />
        </FieldGroup>

        {/* Min Height */}
        <FieldGroup label="Min Height" horizontal>
          <input
            type="text"
            value={value.minHeight || ''}
            onChange={(e) => onChange('minHeight', e.target.value)}
            className={cn(inputClasses, "w-24")}
            placeholder="auto"
          />
        </FieldGroup>
      </div>
    </CollapsibleSection>
  );
}
