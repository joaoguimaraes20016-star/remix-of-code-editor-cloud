/**
 * Utility to apply inline styles to the current text selection.
 * This wraps the selected text in a <span> with the provided CSS styles.
 */

import { gradientToCSS } from '../components/modals';
import type { GradientValue } from '../components/modals';

export interface SelectionStyleOptions {
  color?: string;
  gradient?: GradientValue;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
}

/**
 * Check if there's a non-collapsed text selection within a specific element
 */
export function hasSelectionInElement(element: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  
  const range = sel.getRangeAt(0);
  const selectedText = range.toString();
  
  // Must have actual selected text (not just a cursor position)
  if (!selectedText || selectedText.length === 0) return false;
  
  // Check if selection is within the element
  return element.contains(range.commonAncestorContainer) ||
         element.contains(range.startContainer) ||
         element.contains(range.endContainer);
}

/**
 * Get the current selection text
 */
export function getSelectionText(): string {
  const sel = window.getSelection();
  return sel?.toString() || '';
}

/**
 * Build inline style string from options
 */
function buildStyleString(options: SelectionStyleOptions): string {
  const styleProps: string[] = [];
  
  if (options.gradient) {
    const gradientCSS = gradientToCSS(options.gradient);
    styleProps.push(`background-image: ${gradientCSS}`);
    styleProps.push('-webkit-background-clip: text');
    styleProps.push('-webkit-text-fill-color: transparent');
    styleProps.push('background-clip: text');
    styleProps.push('display: inline'); // Ensure gradient works on inline elements
    styleProps.push('color: transparent'); // Prevent white fallback in all browsers
  } else if (options.color) {
    styleProps.push(`color: ${options.color}`);
  }
  
  if (options.fontWeight) {
    styleProps.push(`font-weight: ${options.fontWeight}`);
  }
  
  if (options.fontStyle) {
    styleProps.push(`font-style: ${options.fontStyle}`);
  }
  
  if (options.textDecoration) {
    styleProps.push(`text-decoration: ${options.textDecoration}`);
  }
  
  return styleProps.join('; ');
}

/**
 * Apply inline styles to the currently selected text within a contentEditable element.
 * Returns the created/updated span when successful, otherwise null.
 */
export function applyStylesToSelection(options: SelectionStyleOptions): HTMLSpanElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (range.collapsed) return null;

  const styleString = buildStyleString(options);
  if (!styleString) return null;

  // Create a span and wrap the selected contents (preserves nested nodes)
  const span = document.createElement('span');
  span.setAttribute('style', styleString);

  // Persist gradient metadata so inspector/toolbar can reflect the *selected span's* gradient.
  // (We cannot reliably re-hydrate GradientValue from CSS background-image.)
  if (options.gradient) {
    span.dataset.gradient = JSON.stringify(options.gradient);
  } else if (options.color) {
    delete span.dataset.gradient;
  }

  try {
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);

    // Keep the span selected so sliders (custom gradient edits) can keep targeting it
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);

    span.parentElement?.normalize();
    return span;
  } catch (e) {
    console.warn('Selection wrap failed:', e);
    return null;
  }
}

type StyleMap = Record<string, string>;

function parseStyleAttribute(style: string | null): StyleMap {
  if (!style) return {};
  const map: StyleMap = {};
  style
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const idx = pair.indexOf(':');
      if (idx === -1) return;
      const key = pair.slice(0, idx).trim().toLowerCase();
      const value = pair.slice(idx + 1).trim();
      if (key && value) map[key] = value;
    });
  return map;
}

function serializeStyleAttribute(map: StyleMap): string {
  return Object.entries(map)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}

function buildStyleUpdates(options: SelectionStyleOptions): { set: StyleMap; unset: string[] } {
  const set: StyleMap = {};
  const unset: string[] = [];

  const gradientProps = [
    'background-image',
    'background-clip',
    '-webkit-background-clip',
    '-webkit-text-fill-color',
    'display',
  ];

  if (options.gradient) {
    const gradientCSS = gradientToCSS(options.gradient);
    set['background-image'] = gradientCSS;
    set['-webkit-background-clip'] = 'text';
    set['-webkit-text-fill-color'] = 'transparent';
    set['background-clip'] = 'text';
    set['display'] = 'inline';
    set['color'] = 'transparent'; // Prevent white fallback
  } else if (options.color) {
    set['color'] = options.color;
    unset.push(...gradientProps);
  }

  if (options.fontWeight) set['font-weight'] = options.fontWeight;
  if (options.fontStyle) set['font-style'] = options.fontStyle;
  if (options.textDecoration) set['text-decoration'] = options.textDecoration;

  return { set, unset };
}

/**
 * Update an existing styled span by merging style props (used for smooth custom gradient edits).
 */
export function updateSpanStyle(span: HTMLSpanElement, options: SelectionStyleOptions): void {
  const current = parseStyleAttribute(span.getAttribute('style'));
  const { set, unset } = buildStyleUpdates(options);

  unset.forEach((k) => {
    delete current[k];
  });

  Object.entries(set).forEach(([k, v]) => {
    current[k] = v;
  });

  const next = serializeStyleAttribute(current);
  if (next) span.setAttribute('style', next);
  else span.removeAttribute('style');

  // Keep gradient metadata in sync for inspector/toolbar.
  if (options.gradient) {
    span.dataset.gradient = JSON.stringify(options.gradient);
  } else if (options.color) {
    delete span.dataset.gradient;
  }
}

/**
 * Read the fill style (solid/gradient) from a styled span.
 *
 * NOTE: gradients are stored as data-gradient JSON because CSS background-image is not reliably parseable.
 */
export function getSpanFillStyles(span: HTMLSpanElement): {
  textFillType?: 'solid' | 'gradient';
  textColor?: string;
  textGradient?: GradientValue;
} {
  // Determine gradient from dataset or style props
  const gradientJson = span.dataset.gradient;
  const hasGradientStyle =
    !!span.style.getPropertyValue('background-image') ||
    !!(span as any).style?.backgroundImage ||
    span.getAttribute('style')?.includes('background-image') ||
    false;

  if (gradientJson || hasGradientStyle) {
    let gradient: GradientValue | undefined;
    if (gradientJson) {
      try {
        gradient = JSON.parse(gradientJson) as GradientValue;
      } catch {
        gradient = undefined;
      }
    }

    return {
      textFillType: 'gradient',
      textGradient: gradient,
    };
  }

  const color = span.style.color || span.getAttribute('style')?.match(/color:\s*([^;]+)/i)?.[1]?.trim();
  if (color && color !== 'transparent') {
    return {
      textFillType: 'solid',
      textColor: color,
    };
  }

  return {};
}

/**
 * Get a styled span at the current selection (for reading fill styles).
 */
export function getStyledSpanAtSelection(root: HTMLElement): HTMLSpanElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  let node: Node | null = range.startContainer;

  // If we have an element, use it; otherwise walk from text node's parent
  let el: HTMLElement | null =
    node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;

  while (el && el !== root) {
    if (el.tagName === 'SPAN' && el.getAttribute('style')) {
      return el as HTMLSpanElement;
    }
    el = el.parentElement;
  }

  // Check root itself (edge case)
  if (root.tagName === 'SPAN' && root.getAttribute('style')) return root as HTMLSpanElement;

  return null;
}

/**
 * Merge adjacent spans with identical styles to keep HTML clean
 */
export function mergeAdjacentStyledSpans(container: HTMLElement): void {
  const spans = Array.from(container.querySelectorAll('span[style]'));
  
  for (const span of spans) {
    const next = span.nextSibling;
    if (next && next.nodeType === Node.ELEMENT_NODE) {
      const nextEl = next as HTMLElement;
      if (nextEl.tagName === 'SPAN' && nextEl.getAttribute('style') === span.getAttribute('style')) {
        // Merge: move all children of next into current span, then remove next
        while (nextEl.firstChild) {
          span.appendChild(nextEl.firstChild);
        }
        nextEl.remove();
      }
    }
  }
  
  // Normalize text nodes
  container.normalize();
}

/**
 * Sanitize HTML to prevent XSS while keeping styling spans
 */
export function sanitizeStyledHTML(html: string): string {
  if (!html) return '';
  
  // Create a temporary element to parse the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Walk the DOM and only keep safe elements/attributes
  const sanitize = (node: Node): void => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      // Only allow span, br, and basic text formatting
      const allowedTags = ['span', 'br', 'b', 'i', 'u', 'strong', 'em'];
      
      if (!allowedTags.includes(tagName)) {
        // Replace with text content
        const text = document.createTextNode(el.textContent || '');
        el.parentNode?.replaceChild(text, el);
        return;
      }
      
      // Only keep style attribute on spans
      if (tagName === 'span') {
        const style = el.getAttribute('style');
        // Clear all attributes except style
        const attrs = Array.from(el.attributes);
        attrs.forEach(attr => {
          if (attr.name !== 'style') {
            el.removeAttribute(attr.name);
          }
        });
        
        // Sanitize style attribute - only allow safe CSS properties
        if (style) {
          const safeProps = sanitizeStyleAttribute(style);
          if (safeProps) {
            el.setAttribute('style', safeProps);
          } else {
            el.removeAttribute('style');
          }
        }
      } else {
        // Remove all attributes from other elements
        const attrs = Array.from(el.attributes);
        attrs.forEach(attr => el.removeAttribute(attr.name));
      }
      
      // Recursively sanitize children
      Array.from(el.childNodes).forEach(sanitize);
    }
  };
  
  Array.from(temp.childNodes).forEach(sanitize);
  
  // Normalize and clean up
  temp.normalize();
  
  return temp.innerHTML;
}

/**
 * Sanitize a style attribute to only allow safe CSS properties
 */
function sanitizeStyleAttribute(style: string): string {
  const allowedProperties = [
    'color',
    'background-image',
    'background-clip',
    '-webkit-background-clip',
    '-webkit-text-fill-color',
    'font-weight',
    'font-style',
    'text-decoration',
    'font-family',
    'display',
    // Note: 'color: transparent' is valid and used for gradient fallback prevention
  ];
  
  const safeProps: string[] = [];
  
  // Parse style string
  const props = style.split(';').map(p => p.trim()).filter(Boolean);
  
  for (const prop of props) {
    const colonIndex = prop.indexOf(':');
    if (colonIndex === -1) continue;
    
    const name = prop.substring(0, colonIndex).trim().toLowerCase();
    const value = prop.substring(colonIndex + 1).trim();
    
    if (allowedProperties.includes(name) && value) {
      // Additional validation: prevent javascript: URLs
      if (value.toLowerCase().includes('javascript:')) continue;
      if (value.toLowerCase().includes('expression(')) continue;
      
      safeProps.push(`${name}: ${value}`);
    }
  }
  
  return safeProps.join('; ');
}

/**
 * Convert HTML content to plain text (for getting the text value)
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/**
 * Check if a string contains HTML tags
 */
export function containsHTML(str: string): boolean {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}
