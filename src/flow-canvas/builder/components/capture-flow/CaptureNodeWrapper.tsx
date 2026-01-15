// CaptureNodeWrapper - Shared layout wrapper for all node types
// Handles title, description, alignment, spacing, and button rendering

import React from 'react';
import { CaptureNode } from '@/flow-canvas/types/captureFlow';
import { cn } from '@/lib/utils';

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

// Style helpers
const getTitleSizeClass = (size?: string): string => {
  const sizes: Record<string, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  };
  return sizes[size || 'lg'] || 'text-lg';
};

const getAlignClass = (align?: string): string => {
  switch (align) {
    case 'left':
      return 'text-left items-start';
    case 'right':
      return 'text-right items-end';
    default:
      return 'text-center items-center';
  }
};

const getSpacingClass = (spacing?: string): string => {
  const spacings: Record<string, string> = {
    compact: 'py-4 px-4 gap-3',
    normal: 'py-8 px-6 gap-5',
    relaxed: 'py-12 px-8 gap-7',
  };
  return spacings[spacing || 'normal'] || 'py-8 px-6 gap-5';
};

const getButtonClasses = (style?: string): string => {
  const base = 'px-6 py-3 font-medium text-sm transition-all rounded-lg';
  switch (style) {
    case 'outline':
      return cn(base, 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10');
    case 'minimal':
      return cn(base, 'bg-transparent text-primary hover:bg-primary/10 underline-offset-2 hover:underline');
    default:
      return cn(base, 'bg-primary text-primary-foreground hover:opacity-90');
  }
};

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

      {/* Continue button */}
      {!hideButton && (
        <button
          type="submit"
          className={getButtonClasses(settings.buttonStyle)}
          style={settings.buttonColor ? { 
            backgroundColor: settings.buttonStyle === 'outline' || settings.buttonStyle === 'minimal' 
              ? undefined 
              : settings.buttonColor,
            borderColor: settings.buttonStyle === 'outline' ? settings.buttonColor : undefined,
            color: settings.buttonStyle === 'outline' || settings.buttonStyle === 'minimal' 
              ? settings.buttonColor 
              : undefined,
          } : undefined}
        >
          {settings.buttonText || 'Continue'}
        </button>
      )}
    </form>
  );
};

export default CaptureNodeWrapper;
