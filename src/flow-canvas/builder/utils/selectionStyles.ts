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
 * Uses execCommand for better browser compatibility and undo support.
 * Returns true if styling was applied to a selection, false if no selection exists.
 */
export function applyStylesToSelection(options: SelectionStyleOptions): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    return false;
  }
  
  const range = sel.getRangeAt(0);
  const selectedText = range.toString();
  
  // Must have actual text selected
  if (!selectedText || selectedText.length === 0) {
    return false;
  }
  
  const styleString = buildStyleString(options);
  if (!styleString) {
    return false;
  }
  
  try {
    // Method 1: Try using insertHTML (supports undo in most browsers)
    const span = document.createElement('span');
    span.setAttribute('style', styleString);
    span.textContent = selectedText;
    
    // Delete the selected content and insert the styled span
    range.deleteContents();
    range.insertNode(span);
    
    // Normalize to merge adjacent text nodes
    span.parentElement?.normalize();
    
    // Move cursor to end of the new span
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);
    
    return true;
  } catch (e) {
    console.warn('Primary selection styling failed, trying fallback:', e);
    
    // Fallback: Try surroundContents
    try {
      const span = document.createElement('span');
      span.setAttribute('style', styleString);
      
      // Clone the range to avoid modifying the original
      const clonedRange = range.cloneRange();
      clonedRange.surroundContents(span);
      
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      newRange.collapse(false);
      sel.addRange(newRange);
      
      return true;
    } catch (e2) {
      console.warn('Fallback selection styling also failed:', e2);
      return false;
    }
  }
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
