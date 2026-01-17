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
 * 
 * NOTE: FlowButton is deprecated - use UnifiedButton instead
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
        primary: 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-primary/20',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        outline: 'border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        // Gradient variant uses custom background via style prop
        gradient: 'text-white shadow-lg hover:shadow-xl',
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
        glow: '', // Handled via customShadow prop
      },
      width: {
        auto: 'w-auto',
        full: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      radius: 'lg',
      shadow: 'none',
      width: 'auto',
    },
  }
);

// ─────────────────────────────────────────────────────────
// SHADOW PRESETS - Import from unified source
// ─────────────────────────────────────────────────────────

import { boxShadowCSS as SHADOW_PRESETS } from '@/flow-canvas/builder/utils/presets';
export { SHADOW_PRESETS };

/**
 * Get shadow CSS value from preset name or custom value
 */
export function getShadowValue(shadow: string | undefined, glowColor?: string): string {
  if (!shadow || shadow === 'none') return 'none';
  
  // Check standard presets
  if (SHADOW_PRESETS[shadow]) {
    return SHADOW_PRESETS[shadow];
  }
  
  // Glow effect with custom color
  if (shadow === 'glow' && glowColor) {
    const hexToRgba = (hex: string, alpha: number) => {
      if (!hex?.startsWith('#') || hex.length < 7) return `rgba(139, 92, 246, ${alpha})`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    return `0 0 20px ${hexToRgba(glowColor, 0.5)}, 0 0 40px ${hexToRgba(glowColor, 0.3)}`;
  }
  
  // Neon effect
  if (shadow === 'neon' && glowColor) {
    const hexToRgba = (hex: string, alpha: number) => {
      if (!hex?.startsWith('#') || hex.length < 7) return `rgba(139, 92, 246, ${alpha})`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    return `0 0 5px ${hexToRgba(glowColor, 0.8)}, 0 0 10px ${hexToRgba(glowColor, 0.6)}, 0 0 20px ${hexToRgba(glowColor, 0.4)}, 0 0 40px ${hexToRgba(glowColor, 0.2)}`;
  }
  
  // Return as-is if it's a custom CSS value
  return shadow;
}

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
  /** Custom width in pixels (overrides fullWidth) */
  customWidth?: number;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Custom text color (overrides variant) */
  textColor?: string;
  /** Custom gradient (for gradient variant) */
  gradient?: string;
  /** Custom border radius in pixels (overrides radius variant) */
  borderRadiusPx?: number;
  /** Custom box shadow CSS or preset name */
  customShadow?: string;
  /** Glow color for glow/neon shadow presets */
  glowColor?: string;
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
      width,
      icon: Icon,
      iconPosition = 'right',
      fullWidth = false,
      customWidth,
      backgroundColor,
      textColor,
      gradient,
      borderRadiusPx,
      customShadow,
      glowColor,
      isDisabled = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // Determine width mode
    const resolvedWidth = customWidth 
      ? undefined  // Use customWidth via style
      : fullWidth 
        ? 'full' 
        : 'auto';
    
    // Resolve shadow value
    const resolvedShadow = customShadow 
      ? getShadowValue(customShadow, glowColor) 
      : undefined;

    // Build custom inline styles - these override variant defaults
    const customStyle: React.CSSProperties = {
      ...style,
      // Width control
      ...(customWidth ? { width: `${customWidth}px` } : {}),
      // Custom background (solid or gradient)
      ...(gradient ? { background: gradient } : {}),
      ...(backgroundColor && !gradient ? { backgroundColor } : {}),
      // Custom text color
      ...(textColor ? { color: textColor } : {}),
      // Custom border radius
      ...(borderRadiusPx !== undefined ? { borderRadius: `${borderRadiusPx}px` } : {}),
      // Custom shadow
      ...(resolvedShadow ? { boxShadow: resolvedShadow } : {}),
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          unifiedButtonVariants({ variant, size, radius, shadow, width: resolvedWidth }),
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

// Re-export types for FlowButton compatibility
export type FlowButtonProps = UnifiedButtonProps;
export const FlowButton = UnifiedButton;
