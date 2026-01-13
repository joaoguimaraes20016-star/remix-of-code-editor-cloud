/**
 * Utility to apply inline styles to the current text selection.
 * This wraps the selected text in a <span> with the provided CSS styles.
 */

import { gradientToCSS } from '../components/modals';
import type { GradientValue } from '../components/modals';

export interface SelectionStyleOptions {
  color?: string;
  gradient?: GradientValue;
  /**
   * Formatting properties support `null` to mean "remove/unset this style".
   * - undefined: don't touch
   * - string: set
   * - null: unset
   */
  fontWeight?: string | null;
  fontStyle?: string | null;
  textDecoration?: string | null;
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
 * Build inline style string from options.
 * IMPORTANT: Only include color/gradient styles if explicitly provided.
 * This prevents bold/italic from inadvertently changing text color.
 */
function buildStyleString(options: SelectionStyleOptions): string {
  const styleProps: string[] = [];
  
  // Only apply color/gradient if explicitly provided (not undefined)
  const hasColorChange = options.gradient !== undefined || options.color !== undefined;
  
  if (hasColorChange) {
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
  }
  // If no color/gradient specified, don't add any color styles - preserve existing
  
  if (options.fontWeight !== undefined && options.fontWeight !== null) {
    styleProps.push(`font-weight: ${options.fontWeight}`);
  }
  
  if (options.fontStyle !== undefined && options.fontStyle !== null) {
    styleProps.push(`font-style: ${options.fontStyle}`);
  }
  
  if (options.textDecoration !== undefined && options.textDecoration !== null) {
    styleProps.push(`text-decoration: ${options.textDecoration}`);
  }
  
  return styleProps.join('; ');
}

/**
 * Remove specific formatting from the current selection WITHOUT wrapping in a new span.
 * This is used for toggle-OFF operations where we only need to strip existing styles.
 */
export function removeFormatFromSelection(options: {
  fontWeight?: boolean;
  fontStyle?: boolean;
  textDecoration?: boolean;
}): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  if (range.collapsed) return false;

  try {
    const extracted = range.extractContents();
    const temp = document.createElement('div');
    temp.appendChild(extracted);

    // Strip the specified formatting properties from ALL spans in the selection
    const spans = Array.from(temp.querySelectorAll('span[style]')) as HTMLSpanElement[];
    for (const s of spans) {
      const current = parseStyleAttribute(s.getAttribute('style'));
      if (options.fontWeight) delete current['font-weight'];
      if (options.fontStyle) delete current['font-style'];
      if (options.textDecoration) delete current['text-decoration'];

      const next = serializeStyleAttribute(current);
      if (next) s.setAttribute('style', next);
      else s.removeAttribute('style');
    }

    // Also unwrap legacy formatting tags
    const unwrapTags = (selectors: string[]) => {
      const nodes = Array.from(temp.querySelectorAll(selectors.join(',')));
      for (const node of nodes) {
        const parent = node.parentNode;
        if (!parent) continue;
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
      }
    };

    if (options.fontWeight) unwrapTags(['b', 'strong']);
    if (options.fontStyle) unwrapTags(['i', 'em']);
    if (options.textDecoration) unwrapTags(['u']);

    // Use a marker span to track where we insert, so we can restore selection
    const markerStart = document.createElement('span');
    markerStart.dataset.selMarker = 'start';
    const markerEnd = document.createElement('span');
    markerEnd.dataset.selMarker = 'end';

    // Insert markers around the content
    const rebuilt = document.createDocumentFragment();
    rebuilt.appendChild(markerStart);
    while (temp.firstChild) rebuilt.appendChild(temp.firstChild);
    rebuilt.appendChild(markerEnd);

    range.insertNode(rebuilt);

    // Restore selection between markers
    const parent = markerStart.parentNode;
    if (parent) {
      const newRange = document.createRange();
      newRange.setStartAfter(markerStart);
      newRange.setEndBefore(markerEnd);
      sel.removeAllRanges();
      sel.addRange(newRange);

      // Remove markers
      markerStart.remove();
      markerEnd.remove();
    }

    return true;
  } catch (e) {
    console.warn('removeFormatFromSelection failed:', e);
    return false;
  }
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

  const hasExplicitFillChange = options.gradient !== undefined || options.color !== undefined;

  // If user is applying formatting (bold/italic/underline) on already-colored/gradient text,
  // preserve the existing fill styles from the closest styled span at the selection start.
  let inheritedFillStyle = '';
  let inheritedGradientJson: string | undefined;

  if (!hasExplicitFillChange) {
    const findClosestStyledSpan = (node: Node | null): HTMLSpanElement | null => {
      let el: HTMLElement | null =
        node && node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node?.parentElement ?? null;

      while (el) {
        if (el.tagName === 'SPAN' && el.getAttribute('style')) return el as HTMLSpanElement;
        el = el.parentElement;
      }
      return null;
    };

    const source = findClosestStyledSpan(range.startContainer) || findClosestStyledSpan(range.commonAncestorContainer);
    if (source) {
      // Prefer persisted gradient metadata when present.
      if (source.dataset.gradient) {
        inheritedGradientJson = source.dataset.gradient;
        try {
          const gradient = JSON.parse(inheritedGradientJson) as GradientValue;
          inheritedFillStyle = buildStyleString({ gradient });
        } catch {
          inheritedFillStyle = '';
        }
      } else {
        // Fallback: copy solid color when present.
        const fill = getSpanFillStyles(source);
        if (fill.textFillType === 'solid' && fill.textColor) {
          inheritedFillStyle = buildStyleString({ color: fill.textColor });
        }

        // Final fallback: if the span visually has a gradient but no dataset, copy its CSS background-image.
        if (!inheritedFillStyle && source.style.backgroundImage) {
          inheritedFillStyle = [
            `background-image: ${source.style.backgroundImage}`,
            '-webkit-background-clip: text',
            '-webkit-text-fill-color: transparent',
            'background-clip: text',
            'display: inline',
            'color: transparent',
          ].join('; ');
        }
      }
    }
  }

  const styleString = [inheritedFillStyle, buildStyleString(options)].filter(Boolean).join('; ');
  if (!styleString) return null;

  // Create a span and wrap the selected contents (preserves nested nodes)
  const span = document.createElement('span');
  span.setAttribute('style', styleString);

  // Assign a stable ID for re-acquiring the span if DOM mutations invalidate references
  span.dataset.inlineStyleId =
    crypto.randomUUID?.() ?? `span-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Persist gradient metadata so inspector/toolbar can reflect the *selected span's* gradient.
  // (We cannot reliably re-hydrate GradientValue from CSS background-image.)
  if (options.gradient) {
    span.dataset.gradient = JSON.stringify(options.gradient);
  } else if (!hasExplicitFillChange && inheritedGradientJson) {
    span.dataset.gradient = inheritedGradientJson;
  } else if (options.color) {
    delete span.dataset.gradient;
  }

  try {
    const extracted = range.extractContents();

    // IMPORTANT:
    // We intentionally preserve nested styled spans for color/gradient edits.
    // However, for B/I/U toggles we MUST prevent descendant spans from overriding
    // the new formatting state, or toggles won't reliably "turn off".
    // So, when a formatting property is being applied, we strip ONLY that property
    // from descendant spans inside the extracted fragment (preserves fill styles).
    const needsFormatNormalize =
      options.fontWeight !== undefined ||
      options.fontStyle !== undefined ||
      options.textDecoration !== undefined;

    let fragment = extracted;

    if (needsFormatNormalize) {
      const temp = document.createElement('div');
      temp.appendChild(fragment);

      const spans = Array.from(temp.querySelectorAll('span[style]')) as HTMLSpanElement[];
      for (const s of spans) {
        const current = parseStyleAttribute(s.getAttribute('style'));
        if (options.fontWeight !== undefined) delete current['font-weight'];
        if (options.fontStyle !== undefined) delete current['font-style'];
        if (options.textDecoration !== undefined) delete current['text-decoration'];

        const next = serializeStyleAttribute(current);
        if (next) s.setAttribute('style', next);
        else s.removeAttribute('style');
      }

      // Also normalize legacy formatting tags (<b>/<strong>/<i>/<em>/<u>) inside the selection.
      // Otherwise "toggle off" can appear broken because those tags still force the style.
      const unwrapTags = (selectors: string[]) => {
        const nodes = Array.from(temp.querySelectorAll(selectors.join(',')));
        for (const node of nodes) {
          const parent = node.parentNode;
          if (!parent) continue;
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          parent.removeChild(node);
        }
      };

      if (options.fontWeight !== undefined) unwrapTags(['b', 'strong']);
      if (options.fontStyle !== undefined) unwrapTags(['i', 'em']);
      if (options.textDecoration !== undefined) unwrapTags(['u']);

      const rebuilt = document.createDocumentFragment();
      while (temp.firstChild) rebuilt.appendChild(temp.firstChild);
      fragment = rebuilt;
    }

    span.appendChild(fragment);
    range.insertNode(span);

    // Keep the span selected so sliders (custom gradient edits) can keep targeting it
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);

    // NOTE: We still defer full DOM cleanup (unwrap/merge) to blur/save time.

    return span;
  } catch (e) {
    console.warn('Selection wrap failed:', e);
    return null;
  }
}

/**
 * Insert a styled span at the caret (collapsed selection) so formatting toggles
 * apply to the next typed characters (Framer/Figma behavior).
 *
 * We insert a zero-width space so the span has a real text node to host the caret.
 * sanitizeStyledHTML() strips zero-width spaces on save.
 */
export function insertStyledSpanAtCaret(options: SelectionStyleOptions): HTMLSpanElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!range.collapsed) return null;

  const hasExplicitFillChange = options.gradient !== undefined || options.color !== undefined;

  // Inherit fill (color/gradient) when applying formatting-only, matching applyStylesToSelection.
  let inheritedFillStyle = '';
  let inheritedGradientJson: string | undefined;

  if (!hasExplicitFillChange) {
    const findClosestStyledSpan = (node: Node | null): HTMLSpanElement | null => {
      let el: HTMLElement | null =
        node && node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node?.parentElement ?? null;

      while (el) {
        if (el.tagName === 'SPAN' && el.getAttribute('style')) return el as HTMLSpanElement;
        el = el.parentElement;
      }
      return null;
    };

    const source = findClosestStyledSpan(range.startContainer) || findClosestStyledSpan(range.commonAncestorContainer);
    if (source) {
      if (source.dataset.gradient) {
        inheritedGradientJson = source.dataset.gradient;
        try {
          const gradient = JSON.parse(inheritedGradientJson) as GradientValue;
          inheritedFillStyle = buildStyleString({ gradient });
        } catch {
          inheritedFillStyle = '';
        }
      } else {
        const fill = getSpanFillStyles(source);
        if (fill.textFillType === 'solid' && fill.textColor) {
          inheritedFillStyle = buildStyleString({ color: fill.textColor });
        }

        if (!inheritedFillStyle && source.style.backgroundImage) {
          inheritedFillStyle = [
            `background-image: ${source.style.backgroundImage}`,
            '-webkit-background-clip: text',
            '-webkit-text-fill-color: transparent',
            'background-clip: text',
            'display: inline',
            'color: transparent',
          ].join('; ');
        }
      }
    }
  }

  const styleString = [inheritedFillStyle, buildStyleString(options)].filter(Boolean).join('; ');
  if (!styleString) return null;

  const span = document.createElement('span');
  span.setAttribute('style', styleString);
  span.dataset.inlineStyleId =
    crypto.randomUUID?.() ?? `span-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (options.gradient) {
    span.dataset.gradient = JSON.stringify(options.gradient);
  } else if (!hasExplicitFillChange && inheritedGradientJson) {
    span.dataset.gradient = inheritedGradientJson;
  } else if (options.color) {
    delete span.dataset.gradient;
  }

  // Add a caret host node
  const zwsp = document.createTextNode('\u200B');
  span.appendChild(zwsp);

  // Insert at caret
  range.insertNode(span);

  // Move caret inside the span (after zwsp)
  const newRange = document.createRange();
  newRange.setStart(zwsp, 1);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);

  return span;
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

  // IMPORTANT: Only modify color/gradient if explicitly provided
  // This prevents bold/italic from changing the text color
  const hasColorChange = options.gradient !== undefined || options.color !== undefined;

  if (hasColorChange) {
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
      // Explicitly clear ALL gradient-related styles to ensure clean solid color
      unset.push(...gradientProps);
      // Also explicitly reset -webkit-text-fill-color to prevent transparent text
      set['-webkit-text-fill-color'] = 'unset';
    }
  }
  // If no color/gradient provided, leave existing color styles untouched
  // This allows bold/italic to work without changing colors

  if (options.fontWeight !== undefined) {
    if (options.fontWeight === null) unset.push('font-weight');
    else set['font-weight'] = options.fontWeight;
  }
  if (options.fontStyle !== undefined) {
    if (options.fontStyle === null) unset.push('font-style');
    else set['font-style'] = options.fontStyle;
  }
  if (options.textDecoration !== undefined) {
    if (options.textDecoration === null) unset.push('text-decoration');
    else set['text-decoration'] = options.textDecoration;
  }

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

  // IMPORTANT: If a formatting toggle is being applied, normalize descendants so
  // nested spans / legacy tags don't keep forcing the old formatting state.
  const needsFormatNormalize =
    options.fontWeight !== undefined || options.fontStyle !== undefined || options.textDecoration !== undefined;

  if (needsFormatNormalize) {
    // Strip ONLY the relevant formatting props from descendant spans.
    const descendants = Array.from(span.querySelectorAll('span[style]')) as HTMLSpanElement[];
    for (const d of descendants) {
      if (d === span) continue;
      const m = parseStyleAttribute(d.getAttribute('style'));
      if (options.fontWeight !== undefined) delete m['font-weight'];
      if (options.fontStyle !== undefined) delete m['font-style'];
      if (options.textDecoration !== undefined) delete m['text-decoration'];
      const s = serializeStyleAttribute(m);
      if (s) d.setAttribute('style', s);
      else d.removeAttribute('style');
    }

    // Unwrap legacy formatting tags inside this span.
    const unwrapTags = (selectors: string[]) => {
      const nodes = Array.from(span.querySelectorAll(selectors.join(',')));
      for (const node of nodes) {
        const parent = node.parentNode;
        if (!parent) continue;
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
      }
    };

    if (options.fontWeight !== undefined) unwrapTags(['b', 'strong']);
    if (options.fontStyle !== undefined) unwrapTags(['i', 'em']);
    if (options.textDecoration !== undefined) unwrapTags(['u']);

    span.normalize();
  }

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
 * Get the primary selection node (prefer focus node for better UX matching).
 * When user drags a selection, focusNode is where the drag ended - matching what they see.
 */
function getPrimarySelectionNode(root: HTMLElement): Node | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  // Prefer focusNode (where the selection ends) for better UX
  // Fall back to anchorNode or range.startContainer
  const candidates = [sel.focusNode, sel.anchorNode];
  
  for (const node of candidates) {
    if (node && root.contains(node)) {
      return node;
    }
  }

  // Final fallback to range
  const range = sel.getRangeAt(0);
  if (root.contains(range.startContainer)) {
    return range.startContainer;
  }

  return null;
}

/**
 * Get a styled span at the current selection (for reading fill styles).
 * Prefers focus node for accurate matching of what user selected.
 */
export function getStyledSpanAtSelection(root: HTMLElement): HTMLSpanElement | null {
  const node = getPrimarySelectionNode(root);
  if (!node) return null;

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
 * Unwrap redundant nested styled spans.
 *
 * This fixes a common failure mode where repeated slider updates accidentally
 * wrap the same text multiple times, leading to <span style><span style>... nesting.
 * Nested spans confuse selection targeting (getStyledSpanAtSelection) and cause
 * toolbar sliders to "drop" the selection.
 *
 * Rule: if a styled span contains exactly one child and that child is also a styled span,
 * we remove the parent and keep the child (preserves the most recently-applied style).
 */
export function unwrapNestedStyledSpans(container: HTMLElement): void {
  let changed = true;

  while (changed) {
    changed = false;
    const spans = Array.from(container.querySelectorAll('span[style]')) as HTMLSpanElement[];

    for (const outer of spans) {
      if (outer.childNodes.length !== 1) continue;
      const only = outer.firstElementChild as HTMLElement | null;
      if (!only) continue;
      if (only.tagName !== 'SPAN' || !only.getAttribute('style')) continue;

      const inner = only as HTMLSpanElement;

      // IMPORTANT:
      // When a new style is applied we typically WRAP selection -> the newest span is the OUTER one.
      // The old content may already be inside a styled span (e.g. gradient/color). If we unwrap by
      // replacing the outer with the inner, we accidentally DROP the newest formatting (bug).
      //
      // Correct behavior: keep OUTER, remove INNER, and merge styles (outer wins on conflicts).
      const outerMap = parseStyleAttribute(outer.getAttribute('style'));
      const innerMap = parseStyleAttribute(inner.getAttribute('style'));
      const merged = { ...innerMap, ...outerMap };
      const mergedStyle = serializeStyleAttribute(merged);
      if (mergedStyle) outer.setAttribute('style', mergedStyle);
      else outer.removeAttribute('style');

      // Preserve metadata if present on the inner span.
      if (!outer.getAttribute('data-gradient') && inner.getAttribute('data-gradient')) {
        outer.setAttribute('data-gradient', inner.getAttribute('data-gradient') as string);
      }
      if (!outer.getAttribute('data-inline-style-id') && inner.getAttribute('data-inline-style-id')) {
        outer.setAttribute('data-inline-style-id', inner.getAttribute('data-inline-style-id') as string);
      }

      // Move inner children into outer, then remove inner.
      while (inner.firstChild) outer.appendChild(inner.firstChild);
      inner.remove();

      changed = true;
      break;
    }
  }

  container.normalize();
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
    // Strip zero-width spaces used for caret-hosting spans during editing.
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node as Text;
      if (txt.nodeValue?.includes('\u200B')) {
        txt.nodeValue = txt.nodeValue.replace(/\u200B/g, '');
        // Remove empty nodes (keeps HTML clean)
        if (!txt.nodeValue) {
          txt.parentNode?.removeChild(txt);
          return;
        }
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      // Convert legacy formatting tags into spans so formatting becomes controllable by our
      // span-based style toggles (prevents "Bold won't turn off" issues).
      const legacyInlineTagStyles: Record<string, string> = {
        b: 'font-weight: 700',
        strong: 'font-weight: 700',
        i: 'font-style: italic',
        em: 'font-style: italic',
        u: 'text-decoration: underline',
      };

      if (legacyInlineTagStyles[tagName]) {
        const span = document.createElement('span');
        const mergedStyle = [el.getAttribute('style'), legacyInlineTagStyles[tagName]].filter(Boolean).join('; ');
        if (mergedStyle) span.setAttribute('style', mergedStyle);

        // Move children across, then replace the legacy node.
        while (el.firstChild) span.appendChild(el.firstChild);
        el.parentNode?.replaceChild(span, el);

        // Sanitize the new span recursively.
        sanitize(span);
        return;
      }

      // Only allow span + br (everything else is stripped)
      const allowedTags = ['span', 'br'];

      if (!allowedTags.includes(tagName)) {
        // Replace with text content
        const text = document.createTextNode(el.textContent || '');
        el.parentNode?.replaceChild(text, el);
        return;
      }

      // Only keep style attribute and data-gradient on spans
      if (tagName === 'span') {
        const style = el.getAttribute('style');
        const dataGradient = el.getAttribute('data-gradient');
        const dataInlineStyleId = el.getAttribute('data-inline-style-id');

        // Clear all attributes except allowed ones
        const attrs = Array.from(el.attributes);
        attrs.forEach(attr => {
          if (attr.name !== 'style' && attr.name !== 'data-gradient' && attr.name !== 'data-inline-style-id') {
            el.removeAttribute(attr.name);
          }
        });

        // Restore data-gradient if it was present (sanitization may have removed it)
        if (dataGradient) {
          el.setAttribute('data-gradient', dataGradient);
        }
        if (dataInlineStyleId) {
          el.setAttribute('data-inline-style-id', dataInlineStyleId);
        }

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
        // Remove all attributes from <br>
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

/**
 * Get the computed text color at the current selection.
 * Returns the actual rendered color (useful when no styled span exists).
 */
export function getComputedTextColorAtSelection(root: HTMLElement): string | null {
  // Use the same focus-node preference as getStyledSpanAtSelection
  const node = getPrimarySelectionNode(root);
  if (!node) return null;

  // Walk up to find an element node
  let el: HTMLElement | null =
    node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;

  // Ensure it's inside the root
  if (!el || !root.contains(el)) {
    el = root;
  }

  try {
    const computed = window.getComputedStyle(el).color;
    // Return the computed color (usually rgb/rgba format)
    return computed || null;
  } catch {
    return null;
  }
}
