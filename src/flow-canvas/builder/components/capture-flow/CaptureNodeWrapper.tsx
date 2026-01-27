// CaptureNodeWrapper - Shared layout wrapper for all node types
// Handles title, description, alignment, spacing, and button rendering
// USES UNIFIED UnifiedButton component - NO SPECIAL CASING

import React from 'react';
import { CaptureNode } from '@/flow-canvas/types/captureFlow';
import { cn } from '@/lib/utils';
import {
  getTitleSizeClass,
  getAlignClass,
  getSpacingClass,
} from '../../utils/stepRenderHelpers';
import { UnifiedButton, presetToVariant } from '@/components/builder/UnifiedButton';

interface CaptureNodeWrapperProps {
  node: CaptureNode;
  children: React.ReactNode;
  onSubmit: () => void;
  validationError?: string;
  isPreview?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  hideButton?: boolean;
}

export const CaptureNodeWrapper: React.FC<CaptureNodeWrapperProps> = ({
  node,
  children,
  onSubmit,
  validationError,
  isPreview = false,
  isSelected = false,
  onSelect,
  hideButton = false,
}) => {
  const { settings } = node;
  
  const handleClick = (e: React.MouseEvent) => {
    if (onSelect && !isPreview) {
      e.stopPropagation();
      onSelect();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      onClick={handleClick}
      className={cn(
        'flex flex-col w-full max-w-lg mx-auto',
        getSpacingClass(settings.spacing),
        getAlignClass(settings.align),
        !isPreview && 'cursor-pointer',
        !isPreview && isSelected && 'ring-2 ring-primary ring-offset-2 rounded-lg',
      )}
    >
      {/* Title */}
      {settings.title && (
        <h2
          className={cn(
            'font-semibold text-foreground',
            getTitleSizeClass(settings.titleSize),
          )}
        >
          {settings.title}
        </h2>
      )}

      {/* Description */}
      {settings.description && (
        <p className="text-sm text-muted-foreground max-w-md">
          {settings.description}
        </p>
      )}

      {/* Node-specific content */}
      <div className="w-full">{children}</div>

      {/* Validation error */}
      {validationError && (
        <p className="text-sm text-destructive" role="alert">
          {validationError}
        </p>
      )}

      {/* Continue button - UNIFIED UnifiedButton component */}
      {!hideButton && (
        <UnifiedButton
          variant={presetToVariant(settings.buttonPreset)}
          onClick={(e) => {
            // Form submission is handled by the form onSubmit
            // This onClick is for non-form contexts
          }}
        >
          {settings.buttonText || 'Continue'}
        </UnifiedButton>
      )}
    </form>
  );
};

export default CaptureNodeWrapper;
