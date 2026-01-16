/**
 * StepLayout - Visual container for step content
 * 
 * ARCHITECTURE: This component owns ALL visual styling for steps.
 * FlowContainer ONLY provides behavior/logic - it renders through this.
 * 
 * ═══════════════════════════════════════════════════════════════
 * STEP LAYOUT OWNS (visual):
 * ═══════════════════════════════════════════════════════════════
 * ✓ Padding, margin, spacing
 * ✓ Background, border, radius, shadow
 * ✓ Button spacing (via step-level props)
 * ✓ Content alignment and width
 * 
 * ═══════════════════════════════════════════════════════════════
 * STEP LAYOUT DOES NOT OWN (behavior):
 * ═══════════════════════════════════════════════════════════════
 * ✗ Step progression logic
 * ✗ Validation
 * ✗ Current step tracking
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface StepLayoutStyle {
  // Background
  background?: string;
  backgroundColor?: string;
  
  // Dimensions
  padding?: number;
  maxWidth?: string;
  
  // Border
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  
  // Effects
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backdropBlur?: number;
  
  // Content
  textColor?: string;
  contentAlign?: 'left' | 'center' | 'right';
}

interface StepLayoutProps {
  children: React.ReactNode;
  style?: StepLayoutStyle;
  className?: string;
  /** Whether this step is selected in editor */
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

// Map shadow setting to CSS
const shadowMap: Record<string, string> = {
  'none': 'none',
  'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

/**
 * StepLayout - Neutral visual shell for step content
 * 
 * All styling is explicit via props. No defaults that could surprise.
 * If a prop is undefined, no style is applied (transparent/neutral).
 */
export const StepLayout: React.FC<StepLayoutProps> = ({
  children,
  style = {},
  className,
  isSelected,
  onClick,
}) => {
  const {
    background,
    backgroundColor,
    padding,
    maxWidth,
    borderRadius,
    borderColor,
    borderWidth,
    shadow = 'none',
    backdropBlur,
    textColor,
    contentAlign = 'center',
  } = style;

  // Build inline styles - only include defined properties
  const inlineStyle: React.CSSProperties = {};
  
  if (background) inlineStyle.background = background;
  else if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;
  
  if (padding !== undefined) inlineStyle.padding = `${padding}px`;
  if (maxWidth) inlineStyle.maxWidth = maxWidth;
  if (borderRadius !== undefined) inlineStyle.borderRadius = `${borderRadius}px`;
  if (textColor) inlineStyle.color = textColor;
  if (shadow !== 'none') inlineStyle.boxShadow = shadowMap[shadow];
  
  // Border - only apply if color is set
  if (borderColor) {
    inlineStyle.border = `${borderWidth || 1}px solid ${borderColor}`;
  }
  
  // Backdrop blur for glass effect
  if (backdropBlur && backdropBlur > 0) {
    inlineStyle.backdropFilter = `blur(${backdropBlur}px)`;
    (inlineStyle as any).WebkitBackdropFilter = `blur(${backdropBlur}px)`;
  }

  return (
    <div
      className={cn(
        'w-full flex flex-col',
        contentAlign === 'left' && 'items-start text-left',
        contentAlign === 'center' && 'items-center text-center',
        contentAlign === 'right' && 'items-end text-right',
        isSelected && 'ring-2 ring-primary/40',
        className
      )}
      style={inlineStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

/**
 * FlowShell - Minimal wrapper that FlowContainer uses
 * 
 * This is INVISIBLE by default. It only:
 * - Handles alignment of the flow within its parent
 * - Constrains max-width if specified
 * 
 * NO styling unless explicitly passed.
 */
export interface FlowShellProps {
  children: React.ReactNode;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const FlowShell: React.FC<FlowShellProps> = ({
  children,
  maxWidth,
  align = 'center',
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full flex',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        className
      )}
    >
      <div 
        className="w-full"
        style={maxWidth ? { maxWidth } : undefined}
      >
        {children}
      </div>
    </div>
  );
};
