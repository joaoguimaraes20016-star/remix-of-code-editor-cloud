/**
 * RuntimeElementRenderer - Renders elements with full stateStyles support for published funnels
 * 
 * This component generates and injects CSS for hover/active states at runtime.
 */

import React, { useMemo } from 'react';

interface StateStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  opacity?: string;
  scale?: string;
  transform?: string;
}

interface StateStyles {
  base?: StateStyle & { transitionDuration?: string };
  hover?: StateStyle;
  active?: StateStyle;
}

interface RuntimeElementProps {
  elementId: string;
  stateStyles?: StateStyles;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Generates CSS for hover/active/disabled states
 */
function generateStateStylesCSS(elementId: string, stateStyles?: StateStyles): string {
  if (!stateStyles) return '';
  
  const css: string[] = [];
  const cls = `runtime-state-${elementId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const transitionDuration = stateStyles.base?.transitionDuration || '200ms';
  
  // Hover state
  if (stateStyles.hover && Object.keys(stateStyles.hover).length > 0) {
    const hover = stateStyles.hover;
    const hoverStyles: string[] = [];
    if (hover.backgroundColor) hoverStyles.push(`background-color: ${hover.backgroundColor} !important`);
    if (hover.textColor) hoverStyles.push(`color: ${hover.textColor} !important`);
    if (hover.borderColor) hoverStyles.push(`border-color: ${hover.borderColor} !important`);
    if (hover.opacity) hoverStyles.push(`opacity: ${hover.opacity}`);
    if (hover.scale) hoverStyles.push(`transform: scale(${hover.scale})`);
    if (hoverStyles.length > 0) {
      css.push(`.${cls}:hover { ${hoverStyles.join('; ')}; transition: all ${transitionDuration} ease; }`);
    }
  }
  
  // Active state
  if (stateStyles.active && Object.keys(stateStyles.active).length > 0) {
    const active = stateStyles.active;
    const activeStyles: string[] = [];
    if (active.backgroundColor) activeStyles.push(`background-color: ${active.backgroundColor} !important`);
    if (active.textColor) activeStyles.push(`color: ${active.textColor} !important`);
    if (active.borderColor) activeStyles.push(`border-color: ${active.borderColor} !important`);
    if (active.opacity) activeStyles.push(`opacity: ${active.opacity}`);
    if (active.scale) activeStyles.push(`transform: scale(${active.scale})`);
    if (activeStyles.length > 0) {
      css.push(`.${cls}:active { ${activeStyles.join('; ')}; transition: all ${transitionDuration} ease; }`);
    }
  }
  
  return css.join('\n');
}

/**
 * Wraps children with state styles CSS injection
 */
export function RuntimeElementWrapper({
  elementId,
  stateStyles,
  children,
  className = '',
  style,
  as: Tag = 'div',
}: RuntimeElementProps) {
  const stateStylesCSS = useMemo(
    () => generateStateStylesCSS(elementId, stateStyles),
    [elementId, stateStyles]
  );
  
  const stateClass = stateStyles ? `runtime-state-${elementId.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  
  return (
    <>
      {stateStylesCSS && <style>{stateStylesCSS}</style>}
      <Tag
        className={`${className} ${stateClass}`.trim()}
        style={style}
      >
        {children}
      </Tag>
    </>
  );
}

/**
 * Hook to get state styles class and CSS for an element
 */
export function useRuntimeStateStyles(elementId: string, stateStyles?: StateStyles) {
  const css = useMemo(
    () => generateStateStylesCSS(elementId, stateStyles),
    [elementId, stateStyles]
  );
  
  const className = stateStyles ? `runtime-state-${elementId.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  
  return { css, className };
}

export { generateStateStylesCSS };
