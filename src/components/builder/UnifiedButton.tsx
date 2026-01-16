/**
 * UnifiedButton - THE SINGLE SOURCE OF TRUTH for all buttons in the builder
 * 
 * This component is used by:
 * - Flow steps (welcome, question, capture, ending)
 * - V2 step components (WelcomeStep, TextQuestionStep, etc.)
 * - Standalone button elements
 * - Any other CTA in the builder
 * 
 * STRICT RULES:
 * 1. All visual properties come ONLY from button props
 * 2. No wrapper div may control width, gradient, background, or shadow
 * 3. fullWidth is explicit: true = 100%, false = auto
 * 4. No container may fake button appearance
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────
// BUTTON VARIANTS - Single source of truth
// ─────────────────────────────────────────────────────────

const unifiedButtonVariants = cva(
  // Base styles - consistent across all variants
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        // Gradient variant uses custom background via style prop
        gradient: 'text-white',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-10 px-6 text-sm',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
      shadow: {
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      radius: 'lg',
      shadow: 'none',
    },
  }
);

// ─────────────────────────────────────────────────────────
// UNIFIED BUTTON PROPS
// ─────────────────────────────────────────────────────────

export interface UnifiedButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>,
    VariantProps<typeof unifiedButtonVariants> {
  /** Button text content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Icon to display */
  icon?: LucideIcon;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** 
   * EXPLICIT WIDTH CONTROL
   * true = width: 100%
   * false = width: auto (default)
   */
  fullWidth?: boolean;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Custom text color (overrides variant) */
  textColor?: string;
  /** Custom gradient (for gradient variant) */
  gradient?: string;
  /** Custom border radius in pixels (overrides radius variant) */
  borderRadiusPx?: number;
  /** Custom box shadow CSS */
  customShadow?: string;
  /** Disabled visual state */
  isDisabled?: boolean;
}

// ─────────────────────────────────────────────────────────
// UNIFIED BUTTON COMPONENT
// ─────────────────────────────────────────────────────────

export const UnifiedButton = React.forwardRef<HTMLButtonElement, UnifiedButtonProps>(
  (
    {
      children,
      onClick,
      variant,
      size,
      radius,
      shadow,
      icon: Icon,
      iconPosition = 'right',
      fullWidth = false,
      backgroundColor,
      textColor,
      gradient,
      borderRadiusPx,
      customShadow,
      isDisabled = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // Build custom inline styles - these override variant defaults
    const customStyle: React.CSSProperties = {
      ...style,
      // Width control: EXPLICIT - no implicit logic
      width: fullWidth ? '100%' : 'auto',
      // Custom background (solid or gradient)
      ...(gradient ? { background: gradient } : {}),
      ...(backgroundColor && !gradient ? { backgroundColor } : {}),
      // Custom text color
      ...(textColor ? { color: textColor } : {}),
      // Custom border radius
      ...(borderRadiusPx !== undefined ? { borderRadius: `${borderRadiusPx}px` } : {}),
      // Custom shadow
      ...(customShadow ? { boxShadow: customShadow } : {}),
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          unifiedButtonVariants({ variant, size, radius, shadow }),
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={customStyle}
        onClick={onClick}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Icon left */}
        {Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
        
        {/* Button text */}
        {children}
        
        {/* Icon right */}
        {Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
      </button>
    );
  }
);

UnifiedButton.displayName = 'UnifiedButton';

// ─────────────────────────────────────────────────────────
// PRESET MAPPING - Convert legacy presets to variant system
// ─────────────────────────────────────────────────────────

export type ButtonPreset = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';

export function presetToVariant(preset?: string): UnifiedButtonProps['variant'] {
  switch (preset) {
    case 'primary': return 'primary';
    case 'secondary': return 'secondary';
    case 'outline': return 'outline';
    case 'ghost': return 'ghost';
    case 'gradient': return 'gradient';
    default: return 'primary';
  }
}

export function sizeToVariant(size?: string): UnifiedButtonProps['size'] {
  switch (size) {
    case 'sm': case 'small': return 'sm';
    case 'md': case 'medium': case 'default': return 'md';
    case 'lg': case 'large': return 'lg';
    case 'xl': return 'xl';
    default: return 'md';
  }
}

// ─────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────

export { unifiedButtonVariants };
