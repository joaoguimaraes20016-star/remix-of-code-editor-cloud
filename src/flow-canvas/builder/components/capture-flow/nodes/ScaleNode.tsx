// ScaleNode - 1-10 scale rating node

import React from 'react';
import { CaptureNodeRendererProps } from '../CaptureNodeRenderer';
import { CaptureNodeWrapper } from '../CaptureNodeWrapper';
import { cn } from '@/lib/utils';

export const ScaleNode: React.FC<CaptureNodeRendererProps> = ({
  node,
  value,
  onChange,
  onSubmit,
  validationError,
  isPreview,
  isSelected,
  onSelect,
}) => {
  const selectedValue = typeof value === 'number' ? value : null;
  const min = node.settings.scaleMin ?? 1;
  const max = node.settings.scaleMax ?? 10;
  const minLabel = node.settings.scaleMinLabel || '';
  const maxLabel = node.settings.scaleMaxLabel || '';

  const scaleValues = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const handleSelect = (num: number) => {
    if (isPreview) return;
    onChange(num);
    // Auto-advance on selection
    setTimeout(() => onSubmit(), 150);
  };

  return (
    <CaptureNodeWrapper
      node={node}
      onSubmit={onSubmit}
      validationError={validationError}
      isPreview={isPreview}
      isSelected={isSelected}
      onSelect={onSelect}
      hideButton // Auto-advance on selection
    >
      <div className="w-full space-y-2">
        {/* Scale buttons */}
        <div className="flex gap-1.5 justify-center flex-wrap">
          {scaleValues.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleSelect(num)}
              className={cn(
                'w-10 h-10 rounded-lg border-2 font-medium text-sm transition-all',
                'hover:border-primary hover:bg-primary/10',
                selectedValue === num
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground',
              )}
              disabled={isPreview}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Labels */}
        {(minLabel || maxLabel) && (
          <div className="flex justify-between px-1 text-xs text-muted-foreground">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    </CaptureNodeWrapper>
  );
};

export default ScaleNode;
