// OpenEndedNode - Free text input node

import React from 'react';
import { CaptureNodeRendererProps } from '../CaptureNodeRenderer';
import { CaptureNodeWrapper } from '../CaptureNodeWrapper';
import { getInputStyleClass } from './nodeStyles';

export const OpenEndedNode: React.FC<CaptureNodeRendererProps> = ({
  node,
  value,
  onChange,
  onSubmit,
  validationError,
  isPreview,
  isSelected,
  onSelect,
}) => {
  const textValue = typeof value === 'string' ? value : '';

  return (
    <CaptureNodeWrapper
      node={node}
      onSubmit={onSubmit}
      validationError={validationError}
      isPreview={isPreview}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <textarea
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={node.settings.placeholder || 'Type your answer here...'}
        className={`
          w-full min-h-[120px] p-4 
          bg-background border border-input 
          text-foreground placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          resize-none
          ${getInputStyleClass(node.settings.inputStyle)}
        `}
        disabled={isPreview}
      />
    </CaptureNodeWrapper>
  );
};

export default OpenEndedNode;
