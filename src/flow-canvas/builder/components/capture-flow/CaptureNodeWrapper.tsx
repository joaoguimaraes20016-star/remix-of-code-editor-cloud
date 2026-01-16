// CaptureNodeWrapper - Shared layout wrapper for all node types
// Handles title, description, alignment, spacing, and button rendering
// USES UNIFIED BUTTON RENDERING from stepRenderHelpers - NO SPECIAL CASING

import React from 'react';
import { CaptureNode } from '@/flow-canvas/types/captureFlow';
import { cn } from '@/lib/utils';
import {
  getTitleSizeClass,
  getAlignClass,
  getSpacingClass,
  getButtonClasses,
  getButtonStyle,
} from '../../utils/stepRenderHelpers';

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

  // Map CaptureNode settings to unified button settings format
  // Only map properties that exist on CaptureNodeSettings
  const buttonSettings = {
    buttonStyle: settings.buttonStyle === 'solid' || settings.buttonStyle === 'primary' 
      ? undefined  // default filled style
      : settings.buttonStyle, // 'outline' or 'minimal' -> maps to 'outline' or 'ghost'
    buttonColor: settings.buttonColor,
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

      {/* Continue button - USES UNIFIED BUTTON RENDERING */}
      {!hideButton && (
        <button
          type="submit"
          className={getButtonClasses(buttonSettings)}
          style={getButtonStyle(buttonSettings)}
        >
          {settings.buttonText || 'Continue'}
        </button>
      )}
    </form>
  );
};

export default CaptureNodeWrapper;
