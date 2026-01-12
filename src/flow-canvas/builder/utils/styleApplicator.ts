/**
 * Clean style application for inline text editing.
 * Handles wrapping selections in styled spans and updating existing spans.
 */

import { gradientToCSS, type GradientValue } from '../components/modals';

export interface StyleOptions {
  color?: string;
  gradient?: GradientValue;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
}

export class StyleApplicator {
  /**
   * Apply styles to the current selection.
   * Returns the styled span if successful, null otherwise.
   */
  static applyToSelection(options: StyleOptions): HTMLSpanElement | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    if (range.collapsed) return null;

    try {
      // Check if selection is entirely within a styled span
      const existingSpan = this.getExactSpan(range);
      if (existingSpan) {
        // Update existing span
        this.updateSpanStyles(existingSpan, options);
        return existingSpan;
      }

      // Create new styled span
      const span = document.createElement('span');
      this.applyStylesToSpan(span, options);

      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);

      // Re-select the span contents so further edits work
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);

      span.parentElement?.normalize();
      return span;
    } catch (e) {
      console.warn('Style application failed:', e);
      return null;
    }
  }

  /**
   * Update an existing span's styles
   */
  static updateSpanStyles(span: HTMLSpanElement, options: StyleOptions): void {
    this.applyStylesToSpan(span, options);
  }

  /**
   * Apply style options to a span element
   */
  private static applyStylesToSpan(span: HTMLSpanElement, options: StyleOptions): void {
    const styles: string[] = [];

    if (options.gradient) {
      const gradientCSS = gradientToCSS(options.gradient);
      styles.push(`background-image: ${gradientCSS}`);
      styles.push('-webkit-background-clip: text');
      styles.push('-webkit-text-fill-color: transparent');
      styles.push('background-clip: text');
      styles.push('display: inline');
      styles.push('color: transparent');
      
      // Store gradient data for retrieval
      span.dataset.gradient = JSON.stringify(options.gradient);
    } else if (options.color) {
      styles.push(`color: ${options.color}`);
      delete span.dataset.gradient;
    }

    if (options.fontWeight) {
      styles.push(`font-weight: ${options.fontWeight}`);
    }

    if (options.fontStyle) {
      styles.push(`font-style: ${options.fontStyle}`);
    }

    if (options.textDecoration) {
      styles.push(`text-decoration: ${options.textDecoration}`);
    }

    if (styles.length > 0) {
      span.setAttribute('style', styles.join('; '));
    }
  }

  /**
   * Check if selection is exactly within a single styled span
   */
  private static getExactSpan(range: Range): HTMLSpanElement | null {
    const container = range.commonAncestorContainer;
    
    // If container is a span with styles, check if range covers it
    if (container.nodeType === Node.ELEMENT_NODE) {
      const el = container as HTMLElement;
      if (el.tagName === 'SPAN' && el.getAttribute('style')) {
        return el as HTMLSpanElement;
      }
    }

    // Check parent
    const parent = container.parentElement;
    if (parent?.tagName === 'SPAN' && parent.getAttribute('style')) {
      // Verify the range is within this span
      const spanRange = document.createRange();
      spanRange.selectNodeContents(parent);
      
      if (range.compareBoundaryPoints(Range.START_TO_START, spanRange) >= 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, spanRange) <= 0) {
        return parent as HTMLSpanElement;
      }
    }

    return null;
  }

  /**
   * Read fill styles from a styled span
   */
  static getSpanFillStyles(span: HTMLSpanElement): {
    textFillType?: 'solid' | 'gradient';
    textColor?: string;
    textGradient?: GradientValue;
  } {
    const gradientJson = span.dataset.gradient;
    if (gradientJson) {
      try {
        const gradient = JSON.parse(gradientJson) as GradientValue;
        return {
          textFillType: 'gradient',
          textGradient: gradient,
        };
      } catch {
        // Fall through to check style attribute
      }
    }

    const style = span.getAttribute('style') || '';
    
    if (style.includes('background-image')) {
      return { textFillType: 'gradient' };
    }

    const colorMatch = style.match(/color:\s*([^;]+)/i);
    if (colorMatch && colorMatch[1] !== 'transparent') {
      return {
        textFillType: 'solid',
        textColor: colorMatch[1].trim(),
      };
    }

    return {};
  }

  /**
   * Merge adjacent spans with identical styles
   */
  static mergeAdjacentSpans(container: HTMLElement): void {
    const spans = Array.from(container.querySelectorAll<HTMLSpanElement>('span[style]'));
    
    for (const span of spans) {
      const next = span.nextSibling;
      if (next?.nodeType === Node.ELEMENT_NODE) {
        const nextEl = next as HTMLElement;
        if (nextEl.tagName === 'SPAN' && 
            nextEl.getAttribute('style') === span.getAttribute('style') &&
            nextEl.dataset.gradient === span.dataset.gradient) {
          // Merge
          while (nextEl.firstChild) {
            span.appendChild(nextEl.firstChild);
          }
          nextEl.remove();
        }
      }
    }
    
    container.normalize();
  }
}
