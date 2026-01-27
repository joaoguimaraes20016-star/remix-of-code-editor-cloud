/**
 * useTokenStyles - React hook for token-based styling
 * 
 * Provides easy access to token resolution with hover state management.
 */

import { useState, useMemo, useCallback } from 'react';
import { resolveTokens, getHoverStyles, type StyleTokens } from '../tokens';

interface UseTokenStylesOptions {
  tokens?: StyleTokens;
  primaryColor?: string;
}

interface UseTokenStylesReturn {
  /** Base styles from tokens */
  styles: React.CSSProperties;
  /** Hover styles to apply on mouseenter */
  hoverStyles: React.CSSProperties;
  /** Whether currently hovered */
  isHovered: boolean;
  /** Mouse event handlers */
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  /** Combined styles (base + hover when active) */
  combinedStyles: React.CSSProperties;
  /** CSS class for hover effect */
  hoverClassName: string;
}

/**
 * Hook for applying token-based styles with hover support
 * 
 * @example
 * ```tsx
 * function MyButton({ tokens, primaryColor }: Props) {
 *   const { combinedStyles, handlers, hoverClassName } = useTokenStyles({ 
 *     tokens, 
 *     primaryColor 
 *   });
 *   
 *   return (
 *     <button 
 *       style={combinedStyles}
 *       className={hoverClassName}
 *       {...handlers}
 *     >
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useTokenStyles({
  tokens,
  primaryColor = '#8b5cf6',
}: UseTokenStylesOptions): UseTokenStylesReturn {
  const [isHovered, setIsHovered] = useState(false);

  // Base styles (no hover)
  const styles = useMemo(() => {
    return resolveTokens(tokens, { primaryColor, isHovered: false });
  }, [tokens, primaryColor]);

  // Hover styles only
  const hoverStyles = useMemo(() => {
    return getHoverStyles(tokens, primaryColor);
  }, [tokens, primaryColor]);

  // Combined styles (base + hover when active)
  const combinedStyles = useMemo(() => {
    if (!isHovered) return styles;
    return { ...styles, ...hoverStyles };
  }, [styles, hoverStyles, isHovered]);

  // Hover class name for CSS-based hover
  const hoverClassName = useMemo(() => {
    if (!tokens?.hover || tokens.hover === 'none') return '';
    return `token-hover-${tokens.hover}`;
  }, [tokens?.hover]);

  // Mouse handlers
  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  return {
    styles,
    hoverStyles,
    isHovered,
    handlers: { onMouseEnter, onMouseLeave },
    combinedStyles,
    hoverClassName,
  };
}

/**
 * Simple hook to resolve tokens without hover management
 */
export function useResolvedTokens(
  tokens?: StyleTokens,
  primaryColor?: string
): React.CSSProperties {
  return useMemo(() => {
    return resolveTokens(tokens, { primaryColor });
  }, [tokens, primaryColor]);
}
