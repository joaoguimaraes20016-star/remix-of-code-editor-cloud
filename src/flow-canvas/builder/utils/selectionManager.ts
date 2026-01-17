/**
 * Selection Manager - Phase 5 Enhancement
 * 
 * Centralized utilities for managing text selection state across the inline editor.
 * Handles range persistence, restoration, and validation.
 */

export interface SelectionSnapshot {
  range: Range | null;
  timestamp: number;
  type: 'selection' | 'caret';
  text?: string;
}

/**
 * Check if a range is valid and connected to the DOM
 */
export function isRangeValid(range: Range | null): boolean {
  if (!range) return false;
  try {
    return (
      range.startContainer.isConnected &&
      range.endContainer.isConnected
    );
  } catch {
    return false;
  }
}

/**
 * Check if a range is inside a specific element
 */
export function isRangeInElement(range: Range | null, element: HTMLElement): boolean {
  if (!range || !isRangeValid(range)) return false;
  try {
    return (
      element.contains(range.startContainer) ||
      element.contains(range.endContainer) ||
      element.contains(range.commonAncestorContainer) ||
      range.startContainer === element ||
      range.endContainer === element
    );
  } catch {
    return false;
  }
}

/**
 * Take a snapshot of the current selection if it's inside the given element
 */
export function captureSelection(element: HTMLElement): SelectionSnapshot | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!isRangeInElement(range, element)) return null;

  const isCollapsed = range.collapsed;
  const text = isCollapsed ? undefined : range.toString();

  return {
    range: range.cloneRange(),
    timestamp: Date.now(),
    type: isCollapsed ? 'caret' : 'selection',
    text,
  };
}

/**
 * Restore a selection snapshot if still valid
 */
export function restoreSelection(
  snapshot: SelectionSnapshot | null,
  element: HTMLElement,
  maxAge: number = 10000
): boolean {
  if (!snapshot || !snapshot.range) return false;
  if (Date.now() - snapshot.timestamp > maxAge) return false;
  if (!isRangeInElement(snapshot.range, element)) return false;

  try {
    const sel = window.getSelection();
    if (!sel) return false;

    sel.removeAllRanges();
    sel.addRange(snapshot.range.cloneRange());
    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.debug('[SelectionManager] Failed to restore selection:', err);
    }
    return false;
  }
}

/**
 * Get the best available selection range for applying styles
 * Prefers live selection, falls back to recent snapshots
 */
export function getBestSelectionRange(
  element: HTMLElement,
  lastSelection: SelectionSnapshot | null,
  lastCaret: SelectionSnapshot | null,
  maxAge: number = 10000
): Range | null {
  // First, try the live selection
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const liveRange = sel.getRangeAt(0);
    if (isRangeInElement(liveRange, element)) {
      return liveRange;
    }
  }

  // Fall back to last selection snapshot if recent
  if (lastSelection && Date.now() - lastSelection.timestamp < maxAge) {
    if (isRangeInElement(lastSelection.range, element)) {
      return lastSelection.range;
    }
  }

  // Fall back to last caret snapshot if recent
  if (lastCaret && Date.now() - lastCaret.timestamp < maxAge) {
    if (isRangeInElement(lastCaret.range, element)) {
      return lastCaret.range;
    }
  }

  return null;
}

/**
 * Normalize RGB color to hex format
 */
export function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return rgb;
  
  const [, r, g, b] = match.map(Number);
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Check if a color is effectively transparent
 */
export function isTransparentColor(color: string | null | undefined): boolean {
  if (!color) return false;
  return (
    color === 'transparent' ||
    color === 'rgba(0, 0, 0, 0)' ||
    /rgba?\([^)]*,\s*0\s*\)/.test(color)
  );
}

/**
 * Place caret at the end of an element
 */
export function placeCaretAtEnd(element: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false); // collapse to END
  
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Select all content in an element
 */
export function selectAllContent(element: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(element);
  
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}
