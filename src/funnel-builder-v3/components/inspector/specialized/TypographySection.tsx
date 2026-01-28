/**
 * TypographySection - Font family, size, weight, color, alignment
 */

import React from 'react';
import { Type } from 'lucide-react';
import { CollapsibleSection } from '../layout/CollapsibleSection';
import { SelectField } from '../controls/SelectField';
import { ButtonGroup } from '../controls/ButtonGroup';
import { AlignmentControl } from '../controls/AlignmentControl';
import { ColorPickerPopover } from '../color/ColorPickerPopover';
import { FieldGroup } from '../layout/FieldGroup';
import { 
  masterFontFamilies, 
  fontSizeOptions, 
  fontWeightOptions 
} from '@/funnel-builder-v3/shared/presets';
import { cn } from '@/lib/utils';

export interface TypographySettings {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface TypographySectionProps {
  value: TypographySettings;
  onChange: (updates: Partial<TypographySettings>) => void;
  showAlignment?: boolean;
  className?: string;
}

export function TypographySection({
  value,
  onChange,
  showAlignment = true,
  className,
}: TypographySectionProps) {
  // Group fonts by category
  const fontGroups = masterFontFamilies.reduce((acc, font) => {
    const category = font.category || 'standard';
    if (!acc[category]) acc[category] = [];
    acc[category].push({ value: font.value, label: font.label });
    return acc;
  }, {} as Record<string, { value: string; label: string }[]>);

  return (
    <CollapsibleSection
      title="Typography"
      icon={<Type size={14} />}
      defaultOpen
      className={className}
    >
      <div className="space-y-3">
        {/* Font family */}
        <SelectField
          label="Font Family"
          value={value.fontFamily || 'inherit'}
          onChange={(fontFamily) => onChange({ fontFamily })}
          grouped={{
            'System': fontGroups.system || [],
            'Display': fontGroups.display || [],
            'Standard': fontGroups.standard || [],
            'Serif': fontGroups.serif || [],
          }}
        />

        {/* Font size & weight row */}
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Size"
            value={value.fontSize || '16px'}
            onChange={(fontSize) => onChange({ fontSize })}
            options={fontSizeOptions.map(o => ({ value: o.value, label: o.label }))}
          />
          <SelectField
            label="Weight"
            value={value.fontWeight || '400'}
            onChange={(fontWeight) => onChange({ fontWeight })}
            options={fontWeightOptions.map(o => ({ value: o.value, label: o.label }))}
          />
        </div>

        {/* Color */}
        <FieldGroup label="Color" horizontal>
          <ColorPickerPopover
            value={value.color || '#000000'}
            onChange={(color) => onChange({ color })}
          >
            <button
              type="button"
              className={cn(
                "w-8 h-8 rounded border border-[hsl(var(--builder-v3-border))]",
                "hover:border-[hsl(var(--builder-v3-text-muted))] transition-colors"
              )}
              style={{ backgroundColor: value.color || '#000000' }}
            />
          </ColorPickerPopover>
        </FieldGroup>

        {/* Alignment */}
        {showAlignment && (
          <AlignmentControl
            label="Alignment"
            value={{ horizontal: value.textAlign || 'left' }}
            onChange={({ horizontal }) => onChange({ textAlign: horizontal })}
          />
        )}
      </div>
    </CollapsibleSection>
  );
}
