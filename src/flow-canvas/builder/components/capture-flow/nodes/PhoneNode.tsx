// PhoneNode - Phone capture with validation

import React from 'react';
import { CaptureNodeRendererProps } from '../CaptureNodeRenderer';
import { CaptureNodeWrapper } from '../CaptureNodeWrapper';
import { getInputStyleClass } from './nodeStyles';
import { Phone } from 'lucide-react';

export const PhoneNode: React.FC<CaptureNodeRendererProps> = ({
  node,
  value,
  onChange,
  onSubmit,
  validationError,
  isPreview,
  isSelected,
  onSelect,
}) => {
  const phoneValue = typeof value === 'string' ? value : '';

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
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="tel"
          value={phoneValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={node.settings.placeholder || '(555) 123-4567'}
          className={`
            w-full p-4 pl-12
            bg-background border border-input 
            text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${getInputStyleClass(node.settings.inputStyle)}
          `}
          disabled={isPreview}
          autoComplete="tel"
        />
      </div>
    </CaptureNodeWrapper>
  );
};

export default PhoneNode;
