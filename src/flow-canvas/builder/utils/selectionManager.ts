/**
 * Clean selection management for inline text editing.
 * Single source of truth for selection state and restoration.
 */

export class SelectionManager {
  private savedRange: Range | null = null;
  private editorElement: HTMLElement;

  constructor(editorElement: HTMLElement) {
    this.editorElement = editorElement;
  }

  /**
   * Check if there's a valid text selection (not just cursor position)
   */
  hasTextSelection(): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;

    const range = sel.getRangeAt(0);
    if (range.collapsed) return false;

    return this.isRangeInEditor(range);
  }

  /**
   * Save the current selection for later restoration
   */
  saveSelection(): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;

    const range = sel.getRangeAt(0);
    if (!this.isRangeInEditor(range)) return false;

    // Only save real selections, not collapsed cursors
    if (!range.collapsed && range.toString().length > 0) {
      this.savedRange = range.cloneRange();
      return true;
    }

    return false;
  }

  /**
   * Restore previously saved selection
   */
  restoreSelection(): boolean {
    if (!this.savedRange) return false;

    try {
      const sel = window.getSelection();
      if (!sel) return false;

      sel.removeAllRanges();
      sel.addRange(this.savedRange.cloneRange());
      return true;
    } catch (e) {
      console.warn('Failed to restore selection:', e);
      return false;
    }
  }

  /**
   * Get the saved range (if any)
   */
  getSavedRange(): Range | null {
    return this.savedRange ? this.savedRange.cloneRange() : null;
  }

  /**
   * Clear saved selection
   */
  clearSavedSelection(): void {
    this.savedRange = null;
  }

  /**
   * Get current selection range (if in editor)
   */
  getCurrentRange(): Range | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    return this.isRangeInEditor(range) ? range : null;
  }

  /**
   * Check if a range is within the editor element
   */
  private isRangeInEditor(range: Range): boolean {
    const container = range.commonAncestorContainer;
    const el = container.nodeType === Node.ELEMENT_NODE 
      ? (container as HTMLElement) 
      : container.parentElement;
    
    return !!el && this.editorElement.contains(el);
  }

  /**
   * Find styled span at current selection
   */
  getStyledSpanAtSelection(): HTMLSpanElement | null {
    const range = this.getCurrentRange();
    if (!range) return null;

    let node: Node | null = range.startContainer;
    let el: HTMLElement | null =
      node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;

    while (el && el !== this.editorElement) {
      if (el.tagName === 'SPAN' && el.getAttribute('style')) {
        return el as HTMLSpanElement;
      }
      el = el.parentElement;
    }

    return null;
  }
}
