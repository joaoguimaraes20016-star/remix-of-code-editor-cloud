/**
 * FlowButton - SINGLE SOURCE OF TRUTH for all flow buttons
 * 
 * This component handles ALL button rendering in flows:
 * - Welcome step buttons ("Start Application")
 * - Question step buttons ("Continue")
 * - Capture step buttons ("Submit")
 * - Any other flow CTA
 * 
 * RULES:
 * 1. FlowButton NEVER auto-assumes behavior
 * 2. onClick is ALWAYS required and provided by parent
 * 3. Parent emits intent (next, submit, goToStep) - button just fires onClick
 * 4. Styling is controlled via variant/size/width props
 * 5. No phantom backgrounds or wrapper divs with visual styles
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────
// FLOW BUTTON VARIANTS - Single source of truth
// ─────────────────────────────────────────────────────────

const flowButtonVariants = cva(
  // Base styles - consistent across all variants
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Solid variants
        primary: 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-primary/20',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        // Outline variant
        outline: 'border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
        // Ghost variant
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        // Gradient variant (requires custom gradient via style prop)
        gradient: 'text-white shadow-lg hover:shadow-xl',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-md',
        md: 'h-10 px-6 text-sm rounded-lg',
        lg: 'h-12 px-8 text-base rounded-xl',
      },
      width: {
        auto: 'w-auto',
        full: 'w-full',
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      width: 'auto',
      radius: 'lg',
    },
  }
);

// ─────────────────────────────────────────────────────────
// FLOW BUTTON PROPS
// ─────────────────────────────────────────────────────────

export interface FlowButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>,
    VariantProps<typeof flowButtonVariants> {
  /** Button text content */
  children: React.ReactNode;
  /** Click handler - REQUIRED. Parent provides intent emission. */
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Icon to display (left or right based on iconPosition) */
  icon?: LucideIcon;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Custom gradient CSS (for gradient variant) */
  gradient?: string;
  /** Custom shadow CSS */
  shadow?: string;
  /** Whether button is in disabled state (visual only - still fires onClick) */
  isDisabled?: boolean;
}

// ─────────────────────────────────────────────────────────
// FLOW BUTTON COMPONENT
// ─────────────────────────────────────────────────────────

export const FlowButton = React.forwardRef<HTMLButtonElement, FlowButtonProps>(
  (
    {
      children,
      onClick,
      variant,
      size,
      width,
      radius,
      icon: Icon,
      iconPosition = 'right',
      gradient,
      shadow,
      isDisabled = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // Build custom styles
    const customStyle: React.CSSProperties = {
      ...style,
      // Apply gradient background for gradient variant
      ...(variant === 'gradient' && gradient ? { background: gradient } : {}),
      // Apply custom shadow if provided
      ...(shadow ? { boxShadow: shadow } : {}),
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          flowButtonVariants({ variant, size, width, radius }),
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

FlowButton.displayName = 'FlowButton';

// ─────────────────────────────────────────────────────────
// PRESET MAPPING - Convert legacy presets to new variant system
// ─────────────────────────────────────────────────────────

export type ButtonPreset = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';

export function presetToVariant(preset?: string): FlowButtonProps['variant'] {
  switch (preset) {
    case 'primary':
      return 'primary';
    case 'secondary':
      return 'secondary';
    case 'outline':
      return 'outline';
    case 'ghost':
      return 'ghost';
    case 'gradient':
      return 'gradient';
    default:
      return 'primary';
  }
}

// ─────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────

export { flowButtonVariants };
