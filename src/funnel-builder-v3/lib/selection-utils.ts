/**
 * Selection-aware rich text utilities
 * Handles selection detection, style querying, and HTML sanitization
 */

export interface SelectionStyles {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  color: string;
  backgroundColor: string;
  hasLink: boolean;
  linkUrl?: string;
}

// Allowed tags for HTML sanitization
const ALLOWED_TAGS = ['strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'span', 'a', 'br', 'mark', 'font'];

/**
 * Check if there's a non-collapsed text selection within the given element
 */
export function hasSelectionInElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return false;
  return element.contains(selection.anchorNode) && element.contains(selection.focusNode);
}

/**
 * Get the current selection range if it's within the given element
 */
export function getSelectionInElement(element: HTMLElement | null): Range | null {
  if (!element) return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (element.contains(range.commonAncestorContainer)) {
    return range;
  }
  return null;
}

/**
 * Convert RGB/RGBA color string to hex format.
 * If alpha is 0 (fully transparent), returns 'transparent'.
 */
function rgbToHex(color: string): string {
  if (!color) return color;
  if (color === 'transparent') return 'transparent';

  // Already hex
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;

  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  const rgbaMatch = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)$/);
  const match = rgbMatch || rgbaMatch;
  if (!match) return color;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = rgbaMatch ? parseFloat(match[4]) : 1;

  if (Number.isFinite(a) && a <= 0) return 'transparent';

  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Get the computed styles at the current selection/cursor position
 */
export function getSelectionStyles(): SelectionStyles {
  const defaults: SelectionStyles = {
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    color: '',
    backgroundColor: '',
    hasLink: false,
  };

  try {
    defaults.isBold = document.queryCommandState('bold');
    defaults.isItalic = document.queryCommandState('italic');
    defaults.isUnderline = document.queryCommandState('underline');
    defaults.isStrikethrough = document.queryCommandState('strikeThrough');
    
    // Get foreground color and convert to hex
    const colorValue = document.queryCommandValue('foreColor');
    if (colorValue) {
      defaults.color = rgbToHex(colorValue);
    }

    // Get background/highlight color and convert to hex
    const bgColorValue = document.queryCommandValue('backColor');
    if (bgColorValue && bgColorValue !== 'rgba(0, 0, 0, 0)' && bgColorValue !== 'transparent') {
      defaults.backgroundColor = rgbToHex(bgColorValue);
    }

    // Check if selection is inside a link
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
      let node: Node | null = selection.anchorNode;
      while (node && node !== document.body) {
        if (node.nodeName === 'A') {
          defaults.hasLink = true;
          defaults.linkUrl = (node as HTMLAnchorElement).href;
          break;
        }
        node = node.parentNode;
      }
    }
  } catch (e) {
    // queryCommandState can throw in some contexts
    console.warn('Could not query selection styles:', e);
  }

  return defaults;
}

/**
 * Apply an inline style command to the current selection
 */
export function applyInlineStyle(command: string, value?: string): boolean {
  try {
    return document.execCommand(command, false, value);
  } catch (e) {
    console.warn('Could not apply inline style:', e);
    return false;
  }
}

/**
 * Apply color to the current selection using execCommand
 */
export function applyColor(color: string): boolean {
  return applyInlineStyle('foreColor', color);
}

/**
 * Apply highlight/background color to the current selection
 */
export function applyHighlight(color: string): boolean {
  if (color === 'transparent' || color === '') {
    // Remove highlight by applying transparent background
    return applyInlineStyle('backColor', 'transparent');
  }
  return applyInlineStyle('backColor', color);
}

/**
 * Create a link around the current selection
 */
export function createLink(url: string, target: '_self' | '_blank' = '_blank'): boolean {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return false;

  const range = selection.getRangeAt(0);
  const link = document.createElement('a');
  link.href = url;
  link.target = target;
  if (target === '_blank') {
    link.rel = 'noopener noreferrer';
  }
  
  try {
    range.surroundContents(link);
    return true;
  } catch (e) {
    // surroundContents fails if selection crosses element boundaries
    // Fall back to execCommand
    return applyInlineStyle('createLink', url);
  }
}

/**
 * Remove link from the current selection
 */
export function removeLink(): boolean {
  return applyInlineStyle('unlink');
}

/**
 * Select all content in an element
 */
export function selectAllContent(element: HTMLElement): void {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Sanitize HTML to only allow safe inline formatting tags
 * Preserves: <strong>, <b>, <em>, <i>, <u>, <span style="color:...">, <a href="..." target="...">, <br>
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Create a temporary container
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Recursively clean nodes
  function cleanNode(node: Node): Node | null {
    // Text nodes are always allowed
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode();
    }
    
    // Only process element nodes
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    
    // Check if tag is allowed
    if (!ALLOWED_TAGS.includes(tagName)) {
      // Extract children and return them as a document fragment
      const fragment = document.createDocumentFragment();
      Array.from(element.childNodes).forEach(child => {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) {
          fragment.appendChild(cleanedChild);
        }
      });
      return fragment;
    }
    
    // Create a clean element
    const cleanElement = document.createElement(tagName);
    
    // Handle specific attributes
    if (tagName === 'a') {
      const href = element.getAttribute('href');
      const target = element.getAttribute('target');
      if (href) cleanElement.setAttribute('href', href);
      if (target === '_blank' || target === '_self') {
        cleanElement.setAttribute('target', target);
        if (target === '_blank') {
          cleanElement.setAttribute('rel', 'noopener noreferrer');
        }
      }
    } else if (tagName === 'span') {
      // Only allow color and background-color styles
      const color = element.style.color;
      const bgColor = element.style.backgroundColor;
      if (color || bgColor) {
        if (color) cleanElement.style.color = color;
        if (bgColor) cleanElement.style.backgroundColor = bgColor;
      } else {
        // If span has no relevant styles, just return children
        const fragment = document.createDocumentFragment();
        Array.from(element.childNodes).forEach(child => {
          const cleanedChild = cleanNode(child);
          if (cleanedChild) {
            fragment.appendChild(cleanedChild);
          }
        });
        return fragment;
      }
    } else if (tagName === 'font') {
      // Convert old <font> tags to <span> with inline color
      // Some browsers still use <font> for execCommand('foreColor')
      const color = element.getAttribute('color');
      if (color) {
        const span = document.createElement('span');
        span.style.color = color;
        Array.from(element.childNodes).forEach(child => {
          const cleanedChild = cleanNode(child);
          if (cleanedChild) {
            span.appendChild(cleanedChild);
          }
        });
        return span;
      } else {
        // If font has no color, just return children
        const fragment = document.createDocumentFragment();
        Array.from(element.childNodes).forEach(child => {
          const cleanedChild = cleanNode(child);
          if (cleanedChild) {
            fragment.appendChild(cleanedChild);
          }
        });
        return fragment;
      }
    } else if (tagName === 'mark') {
      // Preserve mark elements with background color
      const bgColor = element.style.backgroundColor;
      if (bgColor) {
        cleanElement.style.backgroundColor = bgColor;
      }
    }
    
    // Process children
    Array.from(element.childNodes).forEach(child => {
      const cleanedChild = cleanNode(child);
      if (cleanedChild) {
        cleanElement.appendChild(cleanedChild);
      }
    });
    
    return cleanElement;
  }
  
  const result = document.createElement('div');
  Array.from(temp.childNodes).forEach(child => {
    const cleanedChild = cleanNode(child);
    if (cleanedChild) {
      result.appendChild(cleanedChild);
    }
  });
  
  return result.innerHTML;
}

/**
 * Convert plain text to HTML (escape special characters)
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Check if text contains HTML tags
 */
export function containsHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}
