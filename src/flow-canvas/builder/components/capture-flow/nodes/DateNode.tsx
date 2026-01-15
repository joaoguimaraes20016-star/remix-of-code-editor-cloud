// DateNode - Date picker node

import React from 'react';
import { CaptureNodeRendererProps } from '../CaptureNodeRenderer';
import { CaptureNodeWrapper } from '../CaptureNodeWrapper';
import { getInputStyleClass } from './nodeStyles';
import { Calendar } from 'lucide-react';

export const DateNode: React.FC<CaptureNodeRendererProps> = ({
  node,
  value,
  onChange,
  onSubmit,
  validationError,
  isPreview,
  isSelected,
  onSelect,
}) => {
  const dateValue = typeof value === 'string' ? value : '';

  return (
    <CaptureNodeWrapper
      node={node}
      onSubmit={onSubmit}
      validationError={validationError}
      isPreview={isPreview}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div className="relative w-full">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={dateValue}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full p-4 pl-12
            bg-background border border-input 
            text-foreground
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${getInputStyleClass(node.settings.inputStyle)}
          `}
          disabled={isPreview}
        />
      </div>
    </CaptureNodeWrapper>
  );
};

export default DateNode;
