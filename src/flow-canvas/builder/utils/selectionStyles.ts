/**
 * Utility to apply inline styles to the current text selection.
 * This wraps the selected text in a <span> with the provided CSS styles.
 */

import { gradientToCSS, cloneGradient } from '../components/modals';
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
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false;
  
  const range = sel.getRangeAt(0);
  return element.contains(range.commonAncestorContainer);
}

/**
 * Get the current selection text
 */
export function getSelectionText(): string {
  const sel = window.getSelection();
  return sel?.toString() || '';
}

/**
 * Apply inline styles to the currently selected text within a contentEditable element.
 * Returns true if styling was applied to a selection, false if no selection exists.
 */
export function applyStylesToSelection(options: SelectionStyleOptions): boolean {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
    return false; // No selection - caller should apply to whole block
  }
  
  const range = sel.getRangeAt(0);
  const selectedText = range.toString();
  
  if (!selectedText.trim()) {
    return false; // Empty or whitespace selection
  }
  
  // Build the style string
  const styleProps: string[] = [];
  
  if (options.gradient) {
    const gradientCSS = gradientToCSS(options.gradient);
    styleProps.push(`background-image: ${gradientCSS}`);
    styleProps.push('-webkit-background-clip: text');
    styleProps.push('-webkit-text-fill-color: transparent');
    styleProps.push('background-clip: text');
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
  
  if (styleProps.length === 0) {
    return false; // No styles to apply
  }
  
  // Create a span with the styles
  const span = document.createElement('span');
  span.setAttribute('style', styleProps.join('; '));
  
  // Wrap the selection in the span
  try {
    range.surroundContents(span);
    
    // Collapse selection to end of new span
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    newRange.collapse(false);
    sel.addRange(newRange);
    
    return true;
  } catch (e) {
    // surroundContents can fail if selection spans multiple elements
    // Fall back to extracting and inserting
    try {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
      
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      newRange.collapse(false);
      sel.addRange(newRange);
      
      return true;
    } catch (e2) {
      console.warn('Failed to apply selection styles:', e2);
      return false;
    }
  }
}

/**
 * Sanitize HTML to prevent XSS while keeping styling spans
 */
export function sanitizeStyledHTML(html: string): string {
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
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}
