import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { toast } from 'sonner';
import { RichTextToolbar } from './RichTextToolbar';
import { gradientToCSS, cloneGradient, defaultGradient } from './modals';
import type { GradientValue } from './modals';
import { parseHighlightedText, hasHighlightSyntax } from '../utils/textHighlight';
import { applyStylesToSelection, containsHTML, getStyledSpanAtSelection, getSpanFillStyles, hasSelectionInElement, mergeAdjacentStyledSpans, sanitizeStyledHTML, unwrapNestedStyledSpans, updateSpanStyle } from '../utils/selectionStyles';
import type { SelectionStyleOptions } from '../utils/selectionStyles';
import { useInlineEdit } from '../contexts/InlineEditContext';

export interface TextStyles {
  fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  // Extended styles for Framer-level editing
  fontFamily?: string;
  textColor?: string;
  textFillType?: 'solid' | 'gradient';
  textGradient?: GradientValue;
  textShadow?: string;
  // Highlight styles for {{text}} syntax
  highlightColor?: string;
  highlightGradient?: GradientValue;
  highlightUseGradient?: boolean;
}

interface InlineTextEditorProps {
  value: string;
  onChange: (value: string, styles?: Partial<TextStyles>) => void;
  elementType: 'text' | 'heading' | 'button';
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  initialStyles?: Partial<TextStyles>;
  onEditingChange?: (isEditing: boolean) => void;
  /** Unique element ID for inline edit context registration */
  elementId?: string;
}

// Needs to accept refs because dnd-kit wrappers may clone children and attach a ref.
export const InlineTextEditor = forwardRef<HTMLDivElement, InlineTextEditorProps>(({
  value,
  onChange,
  elementType,
  className = '',
  placeholder = 'Click to edit...',
  disabled = false,
  initialStyles,
  onEditingChange,
  elementId,
}, forwardedRef) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [sessionHasInlineStyles, setSessionHasInlineStyles] = useState(false);
  
  // Track which properties have been explicitly modified by the user
  const [modifiedProps, setModifiedProps] = useState<Set<keyof TextStyles>>(new Set());
  
  // Current styles state - initialize with cloned values to prevent shared references
  const [styles, setStyles] = useState<Partial<TextStyles>>(() => {
    if (!initialStyles) return {};
    // Deep clone gradient objects on initial state
    const cloned: Partial<TextStyles> = { ...initialStyles };
    if (initialStyles.textGradient) {
      cloned.textGradient = cloneGradient(initialStyles.textGradient);
    }
    if (initialStyles.highlightGradient) {
      cloned.highlightGradient = cloneGradient(initialStyles.highlightGradient);
    }
    return cloned;
  });
  
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const activeInlineSpanRef = useRef<HTMLSpanElement | null>(null);
  const inlineSaveTimerRef = useRef<number | null>(null);

  // Persist the last selection range so Right Panel edits can apply to the intended letters
  const lastSelectionRangeRef = useRef<Range | null>(null);

  // Track whether the last pointer-down happened inside the Right Panel or the floating toolbar
  // (prevents edit-mode from closing when using sliders / popovers that don't move focus)
  const lastPointerDownInInspectorRef = useRef(false);
  const lastPointerDownInToolbarRef = useRef(false);
  const lastToolbarInteractionAtRef = useRef<number>(0);

  // Deep compare for gradient objects
  const gradientEquals = (a: GradientValue | undefined, b: GradientValue | undefined): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.type !== b.type || a.angle !== b.angle) return false;
    if (a.stops.length !== b.stops.length) return false;
    for (let i = 0; i < a.stops.length; i++) {
      if (a.stops[i].color !== b.stops[i].color || a.stops[i].position !== b.stops[i].position) {
        return false;
      }
    }
    return true;
  };

  // Update styles when initialStyles changes - with proper deep comparison for gradients
  useEffect(() => {
    if (initialStyles) {
      const needsUpdate = 
        initialStyles.textFillType !== styles.textFillType ||
        initialStyles.textColor !== styles.textColor ||
        !gradientEquals(initialStyles.textGradient, styles.textGradient) ||
        initialStyles.fontSize !== styles.fontSize ||
        initialStyles.fontWeight !== styles.fontWeight ||
        initialStyles.fontFamily !== styles.fontFamily ||
        initialStyles.textShadow !== styles.textShadow ||
        initialStyles.fontStyle !== styles.fontStyle ||
        initialStyles.textDecoration !== styles.textDecoration ||
        initialStyles.textAlign !== styles.textAlign ||
        initialStyles.highlightColor !== styles.highlightColor ||
        initialStyles.highlightUseGradient !== styles.highlightUseGradient ||
        !gradientEquals(initialStyles.highlightGradient, styles.highlightGradient);
      
      if (needsUpdate) {
        // Deep clone the initialStyles to prevent shared references
        const clonedStyles: Partial<TextStyles> = { ...initialStyles };
        if (initialStyles.textGradient) {
          clonedStyles.textGradient = cloneGradient(initialStyles.textGradient);
        }
        if (initialStyles.highlightGradient) {
          clonedStyles.highlightGradient = cloneGradient(initialStyles.highlightGradient);
        }
        
        setStyles(prev => ({ ...prev, ...clonedStyles }));
        // Mark initial styles as modified so they persist
        const keys = Object.keys(initialStyles) as (keyof TextStyles)[];
        setModifiedProps(prev => {
          const next = new Set(prev);
          keys.forEach(k => next.add(k));
          return next;
        });
      }
    }
  }, [
    initialStyles?.textFillType, 
    initialStyles?.textColor, 
    // Use JSON.stringify for gradient to ensure deep change detection
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(initialStyles?.textGradient),
    initialStyles?.fontSize,
    initialStyles?.fontWeight,
    initialStyles?.fontFamily,
    initialStyles?.textShadow,
    initialStyles?.fontStyle,
    initialStyles?.textDecoration,
    initialStyles?.textAlign,
    initialStyles?.highlightColor,
    initialStyles?.highlightUseGradient,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(initialStyles?.highlightGradient),
  ]);

  // Notify parent when editing state changes
  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  // Get inline edit context for Right Panel integration
  const { registerEditor } = useInlineEdit();

  // Handle double click to start editing
  const handleDoubleClick = useCallback(() => {
    if (disabled) return;
    if (isEditing) return;

    setIsEditing(true);
    setShowToolbar(true);
    setSessionHasInlineStyles(containsHTML(value || ''));

    // Focus the contenteditable
    setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;

      // Initialize DOM content for the edit session.
      // While editing, we intentionally do NOT render children from React
      // (prevents selection/cursor glitches when applying inline spans).
      if (containsHTML(value || '')) {
        el.innerHTML = sanitizeStyledHTML(value || '');
        // Clean up legacy nested spans so selection targeting stays stable.
        unwrapNestedStyledSpans(el);
        mergeAdjacentStyledSpans(el);
      } else {
        el.innerText = value || '';
      }

      el.focus();

      // Select all text
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 0);
  }, [disabled, isEditing, value]);

  // Handle blur to stop editing - only emit content, not styles (styles are emitted on change)
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if clicking on toolbar (including portaled popovers)
    const relatedTarget = e.relatedTarget as HTMLElement | null;

    // Don't blur if clicking on the toolbar itself
    if (relatedTarget?.closest('.rich-text-toolbar')) return;

    // Don't blur if interacting with the Right Panel while editing
    if (relatedTarget?.closest('.builder-right-panel')) return;

    // Don't blur if clicking on Radix portaled content (popovers, selects, etc.)
    // These are rendered to document.body but have data attributes we can check
    if (relatedTarget?.closest('[data-radix-popper-content-wrapper]')) return;
    if (relatedTarget?.closest('[data-radix-select-content]')) return;
    if (relatedTarget?.closest('[data-radix-popover-content]')) return;

    // Also check if the active element is inside a popover or the Right Panel
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement?.closest('[data-radix-popper-content-wrapper]')) return;
    if (activeElement?.closest('.builder-right-panel')) return;

    // If relatedTarget is null (clicking non-focusable elements like sliders),
    // prevent closing when the click started inside the Right Panel OR the toolbar.
    if (!relatedTarget && (lastPointerDownInInspectorRef.current || lastPointerDownInToolbarRef.current)) {
      return;
    }

    // Additional check: if relatedTarget is null, check if any Radix popover is currently open in the DOM
    if (!relatedTarget) {
      const openPopover = document.querySelector(
        '[data-radix-popper-content-wrapper], [data-radix-popover-content], [data-radix-select-content]'
      );
      if (openPopover) return;
    }
    
    // Clear any pending inline-style save timer (we'll save now)
    if (inlineSaveTimerRef.current) {
      window.clearTimeout(inlineSaveTimerRef.current);
      inlineSaveTimerRef.current = null;
    }
    
    // DON'T clear activeInlineSpanRef or lastSelectionRangeRef here!
    // They need to persist so RightPanel can still use them after blur

    setIsEditing(false);
    setShowToolbar(false);
    
    if (contentRef.current) {
      // Clean up adjacent spans with same styles
      mergeAdjacentStyledSpans(contentRef.current);
      
      // Check if content has inline styled spans - if so, preserve HTML
      const hasInlineStyles = contentRef.current.querySelector('span[style]') !== null;
      
      if (hasInlineStyles) {
        // Save sanitized HTML to preserve inline styling
        const htmlContent = sanitizeStyledHTML(contentRef.current.innerHTML);
        onChange(htmlContent);
      } else {
        // Plain text - just save the text content
        const newValue = contentRef.current.innerText;
        onChange(newValue);
      }
    }
  }, [onChange]);

  // Track pointerdown target so the editor doesn't exit when adjusting Right Panel or Toolbar controls
  useEffect(() => {
    if (!isEditing) return;

    const handler = (ev: PointerEvent) => {
      const target = ev.target as HTMLElement | null;
      lastPointerDownInInspectorRef.current = !!target?.closest('.builder-right-panel');

      const toolbarHit =
        !!target?.closest('.rich-text-toolbar') ||
        !!target?.closest('[data-radix-popper-content-wrapper]') ||
        !!target?.closest('[data-radix-popover-content]') ||
        !!target?.closest('[data-radix-select-content]');
      lastPointerDownInToolbarRef.current = toolbarHit;
      if (toolbarHit) lastToolbarInteractionAtRef.current = Date.now();
    };

    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [isEditing]);

  // Update toolbar position based on current selection (snaps to highlighted text)
  const updateToolbarPosition = useCallback(() => {
    const editorEl = contentRef.current;
    if (!editorEl) return;

    const viewportPadding = 12;
    const toolbarHeight = toolbarRef.current?.offsetHeight ?? 44;
    const gap = 10;

    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

    // Only react to selections inside this editor.
    const selectionInside =
      !!range &&
      (editorEl.contains(range.commonAncestorContainer) ||
        // commonAncestorContainer can be a text node; contains() can be false in some cases
        editorEl.contains(sel?.anchorNode ?? null) ||
        editorEl.contains(sel?.focusNode ?? null));

    let rect: DOMRect | null = null;

    if (range && selectionInside) {
      // Prefer client rects (more stable for multi-line selections)
      const clientRects = Array.from(range.getClientRects?.() ?? []);
      rect =
        clientRects.find((r) => r.width > 0 && r.height > 0) ??
        clientRects[0] ??
        range.getBoundingClientRect();

      // Some browsers return 0-sized rect for collapsed caret; fall back to container.
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        rect = null;
      }
    }

    // Fallback: position above the whole element (when nothing selected)
    if (!rect && containerRef.current) {
      rect = containerRef.current.getBoundingClientRect();
    }

    if (!rect) return;

    const left = rect.left + rect.width / 2;

    // Try above selection; if there's not enough space, place below.
    const aboveTop = rect.top - toolbarHeight - gap;
    const belowTop = rect.bottom + gap;
    const top = aboveTop < viewportPadding ? belowTop : aboveTop;

    setToolbarPosition({
      top: Math.max(viewportPadding, top),
      left,
    });
  }, []);

  useEffect(() => {
    if (!showToolbar || !isEditing) return;

    let rafId = 0;
    const schedule = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Keep toolbar position updated AND continuously snapshot selection.
        // This is critical so RightPanel actions still have a valid lastSelectionRangeRef.
        updateToolbarPosition();

        const editorEl = contentRef.current;
        if (!editorEl) return;

        const sel = window.getSelection();
        const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
        const selectionInside =
          !!range &&
          (editorEl.contains(range.commonAncestorContainer) ||
            editorEl.contains(sel?.anchorNode ?? null) ||
            editorEl.contains(sel?.focusNode ?? null));

        if (selectionInside && range) {
          // Only snapshot *real* selections; don't overwrite with collapsed selection after clicking the toolbar.
          if (!range.collapsed && range.toString().length > 0) {
            lastSelectionRangeRef.current = range.cloneRange();
          }

          // Only update active span when the selection/caret is inside the editor.
          const span = getStyledSpanAtSelection(editorEl);
          if (span) {
            activeInlineSpanRef.current = span;

            // Keep toolbar color/gradient UI synced to the selected span even if
            // selection changes via keyboard (handleSelect doesn't fire reliably).
            const fill = getSpanFillStyles(span);
            if (fill.textFillType) {
              setStyles((prev) => {
                const nextFillType = fill.textFillType ?? prev.textFillType;
                const nextColor = fill.textColor ?? prev.textColor;
                const nextGradient = fill.textGradient ? cloneGradient(fill.textGradient) : prev.textGradient;

                const sameGradient = gradientEquals(prev.textGradient, nextGradient as any);
                const unchanged = prev.textFillType === nextFillType && prev.textColor === nextColor && sameGradient;
                if (unchanged) return prev;

                return {
                  ...prev,
                  textFillType: nextFillType,
                  textColor: nextColor,
                  textGradient: nextGradient,
                };
              });
            }
          }
        }
      });
    };

    // Initial snap
    schedule();

    document.addEventListener('selectionchange', schedule);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('selectionchange', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [showToolbar, isEditing, updateToolbarPosition]);

  // Debounced save for inline HTML updates (prevents re-render jitter while tweaking custom gradients)
  const scheduleInlineHtmlSave = useCallback(() => {
    const editorEl = contentRef.current;
    if (!editorEl) return;

    if (inlineSaveTimerRef.current) {
      window.clearTimeout(inlineSaveTimerRef.current);
    }

    inlineSaveTimerRef.current = window.setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;
      unwrapNestedStyledSpans(el);
      mergeAdjacentStyledSpans(el);
      const htmlContent = sanitizeStyledHTML(el.innerHTML);
      onChange(htmlContent, { _hasInlineStyles: true } as Partial<TextStyles>);
    }, 150);
  }, [onChange]);

  // Handle text selection for toolbar (mouse selection inside the editor)
  const handleSelect = useCallback(() => {
    if (!isEditing) return;
    updateToolbarPosition();

    const editorEl = contentRef.current;
    if (!editorEl) return;

    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    const selectionInside =
      !!range &&
      (editorEl.contains(range.commonAncestorContainer) ||
        editorEl.contains(sel?.anchorNode ?? null) ||
        editorEl.contains(sel?.focusNode ?? null));

    if (selectionInside && range) {
      // Only snapshot non-collapsed selections so we can restore them after toolbar/right-panel clicks.
      if (!range.collapsed && range.toString().length > 0) {
        lastSelectionRangeRef.current = range.cloneRange();
      }

      const span = getStyledSpanAtSelection(editorEl);
      if (span) {
        activeInlineSpanRef.current = span;
        // Keep toolbar UI synced to the selected span's fill (but avoid re-render loops)
        const fill = getSpanFillStyles(span);
        if (fill.textFillType) {
          setStyles((prev) => {
            const nextFillType = fill.textFillType ?? prev.textFillType;
            const nextColor = fill.textColor ?? prev.textColor;
            const nextGradient = fill.textGradient ? cloneGradient(fill.textGradient) : prev.textGradient;

            const sameGradient = gradientEquals(prev.textGradient, nextGradient as any);
            const unchanged = prev.textFillType === nextFillType && prev.textColor === nextColor && sameGradient;
            if (unchanged) return prev;

            return {
              ...prev,
              textFillType: nextFillType,
              textColor: nextColor,
              textGradient: nextGradient,
            };
          });
        }
      }
    }
  }, [isEditing, updateToolbarPosition]);

  // Apply style changes - selection-first for color/gradient/formatting, otherwise whole block
  // Returns true if inline styling was applied (for context callback)
  const handleStyleChange = useCallback((newStyles: Partial<TextStyles>): boolean => {
    const editorEl = contentRef.current;

    const shouldApplyInline =
      newStyles.textColor !== undefined ||
      newStyles.textGradient !== undefined ||
      newStyles.textFillType !== undefined ||
      newStyles.fontWeight !== undefined ||
      newStyles.fontStyle !== undefined ||
      newStyles.textDecoration !== undefined;

    // Build style options for inline span styling
    const buildStyleOptions = (): SelectionStyleOptions | null => {
      const opts: SelectionStyleOptions = {};

      if (newStyles.textFillType === 'gradient') {
        opts.gradient = newStyles.textGradient || styles.textGradient || defaultGradient;
      } else if (newStyles.textColor !== undefined) {
        // Explicit solid color change
        opts.color = newStyles.textColor;
      } else if (newStyles.textFillType === 'solid') {
        // Do NOT default to white (causes "whole block turns white" bugs).
        // Use existing style, then computed color from the editor, then fall back to currentColor.
        const computed = editorEl ? window.getComputedStyle(editorEl).color : '';
        opts.color = styles.textColor || computed || 'currentColor';
      }

      if (newStyles.fontWeight) {
        const wMap: Record<string, string> = { normal: '400', medium: '500', semibold: '600', bold: '700', black: '900' };
        opts.fontWeight = wMap[newStyles.fontWeight] || newStyles.fontWeight;
      }
      if (newStyles.fontStyle) opts.fontStyle = newStyles.fontStyle;
      if (newStyles.textDecoration) opts.textDecoration = newStyles.textDecoration;

      return Object.keys(opts).length > 0 ? opts : null;
    };

    // Helper: sync toolbar local state so pickers show updated value
    const syncToolbarState = () => {
      const sync: Partial<TextStyles> = {};
      if (newStyles.textFillType !== undefined) sync.textFillType = newStyles.textFillType;
      if (newStyles.textGradient) sync.textGradient = cloneGradient(newStyles.textGradient);
      if (newStyles.textColor !== undefined) sync.textColor = newStyles.textColor;
      if (Object.keys(sync).length) setStyles(prev => ({ ...prev, ...sync }));
    };

    // ─────────────────────────────────────────────────────────────────────────
    // INLINE STYLING PATH
    // ─────────────────────────────────────────────────────────────────────────
    if (shouldApplyInline && editorEl && isEditing) {
      const styleOpts = buildStyleOptions();
      if (!styleOpts) return false;

      // Get current DOM selection state
      const sel = window.getSelection();
      let liveRange: Range | null = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      const liveHasSelection = liveRange && !liveRange.collapsed && editorEl.contains(liveRange.commonAncestorContainer);

      // If live selection is collapsed/empty, try restoring saved selection
      if (!liveHasSelection && lastSelectionRangeRef.current) {
        try {
          if (editorEl.contains(lastSelectionRangeRef.current.commonAncestorContainer)) {
            sel?.removeAllRanges();
            sel?.addRange(lastSelectionRangeRef.current.cloneRange());
            liveRange = lastSelectionRangeRef.current.cloneRange();
          }
        } catch { /* ignore */ }
      }

      const hasSelection = liveRange && !liveRange.collapsed && liveRange.toString().length > 0;

      // Find existing styled span at selection/caret (fresh lookup)
      const findSpanFromRange = (range: Range | null): HTMLSpanElement | null => {
        if (!range) return null;
        let node: Node | null = range.startContainer;
        let el: HTMLElement | null = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
        while (el && el !== editorEl) {
          if (el.tagName === 'SPAN' && el.getAttribute('style')) return el as HTMLSpanElement;
          el = el.parentElement;
        }
        return null;
      };

      let targetSpan = getStyledSpanAtSelection(editorEl);

      // When the toolbar/inspector has focus, the selection may no longer be "in" the editor.
      // Fall back to the last known styled span so sliders remain stable.
      if (!targetSpan) {
        const active = activeInlineSpanRef.current;
        if (active && editorEl.contains(active)) targetSpan = active;
      }
      if (!targetSpan) {
        targetSpan = findSpanFromRange(lastSelectionRangeRef.current);
      }

      // CASE A: We have a real text selection → wrap it (or update if whole span selected)
      if (hasSelection && liveRange) {
        // Check if selection exactly matches an existing span's contents
        if (targetSpan) {
          try {
            const spanRange = document.createRange();
            spanRange.selectNodeContents(targetSpan);
            const isExact =
              liveRange.compareBoundaryPoints(Range.START_TO_START, spanRange) === 0 &&
              liveRange.compareBoundaryPoints(Range.END_TO_END, spanRange) === 0;
            if (isExact) {
              // Update existing span in place
              updateSpanStyle(targetSpan, styleOpts);
              activeInlineSpanRef.current = targetSpan;
              setSessionHasInlineStyles(true);
              scheduleInlineHtmlSave();
              syncToolbarState();
              return true;
            }
          } catch { /* fallthrough to wrap */ }
        }

        // Wrap the selection with new span
        const span = applyStylesToSelection(styleOpts);
        if (span) {
          activeInlineSpanRef.current = span;

          // Persist the new selection (span contents) so toolbar/right-panel sliders keep working
          try {
            const r = document.createRange();
            r.selectNodeContents(span);
            lastSelectionRangeRef.current = r.cloneRange();
          } catch {
            // ignore
          }

          setSessionHasInlineStyles(true);
          scheduleInlineHtmlSave();
          syncToolbarState();
          return true;
        }
      }

      // CASE B: Caret inside existing span (no text selected) → update that span
      if (targetSpan) {
        updateSpanStyle(targetSpan, styleOpts);
        activeInlineSpanRef.current = targetSpan;
        setSessionHasInlineStyles(true);
        scheduleInlineHtmlSave();
        syncToolbarState();
        return true;
      }

      // CASE C: No selection and no target span while editing → user must select text first
      if (import.meta.env.DEV) {
        console.debug('[InlineTextEditor] inline-style ignored (no selection)', {
          elementId,
          newStyles,
          hasSavedSelection: !!lastSelectionRangeRef.current,
        });
      }
      toast.info('Select text to apply styling');
      return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BLOCK-LEVEL STYLES (font size, align, shadow, etc.)
    // ─────────────────────────────────────────────────────────────────────────
    const clonedStyles: Partial<TextStyles> = {};

    if (newStyles.fontSize !== undefined) clonedStyles.fontSize = newStyles.fontSize;
    if (newStyles.fontWeight !== undefined) clonedStyles.fontWeight = newStyles.fontWeight;
    if (newStyles.fontStyle !== undefined) clonedStyles.fontStyle = newStyles.fontStyle;
    if (newStyles.textDecoration !== undefined) clonedStyles.textDecoration = newStyles.textDecoration;
    if (newStyles.textAlign !== undefined) clonedStyles.textAlign = newStyles.textAlign;
    if (newStyles.fontFamily !== undefined) clonedStyles.fontFamily = newStyles.fontFamily;
    if (newStyles.textColor !== undefined) clonedStyles.textColor = newStyles.textColor;
    if (newStyles.textFillType !== undefined) clonedStyles.textFillType = newStyles.textFillType;
    if (newStyles.textShadow !== undefined) clonedStyles.textShadow = newStyles.textShadow;
    if (newStyles.highlightColor !== undefined) clonedStyles.highlightColor = newStyles.highlightColor;
    if (newStyles.highlightUseGradient !== undefined) clonedStyles.highlightUseGradient = newStyles.highlightUseGradient;

    if (newStyles.textGradient) {
      clonedStyles.textGradient = cloneGradient(newStyles.textGradient);
    }
    if (newStyles.highlightGradient) {
      clonedStyles.highlightGradient = cloneGradient(newStyles.highlightGradient);
    }

    if (clonedStyles.textFillType === 'gradient' && !clonedStyles.textGradient && !styles.textGradient) {
      clonedStyles.textGradient = cloneGradient(defaultGradient);
    }

    setStyles(prev => ({ ...prev, ...clonedStyles }));

    const changedKeys = Object.keys(clonedStyles) as (keyof TextStyles)[];
    setModifiedProps(prev => {
      const next = new Set(prev);
      changedKeys.forEach(k => next.add(k));
      return next;
    });

    const currentValue = contentRef.current?.innerText ?? value;
    onChange(currentValue, clonedStyles);
    return false;
  }, [styles, value, onChange, scheduleInlineHtmlSave, isEditing]);

  // Register with inline edit context when editing (for Right Panel integration)
  // Use refs to persist state across renders and avoid stale closures
  const unregisterTimerRef = useRef<number | null>(null);
  const registeredElementIdRef = useRef<string | null>(null);
  const isEditingRef = useRef(isEditing);
  
  // Keep ref in sync with state
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);
  
  useEffect(() => {
    // Clear any pending unregister when effect re-runs
    if (unregisterTimerRef.current) {
      window.clearTimeout(unregisterTimerRef.current);
      unregisterTimerRef.current = null;
    }
    
    if (!elementId) return;

    // Wrapper that restores the user's last in-editor selection before applying styles.
    const applyFromInspector = (nextStyles: Partial<TextStyles>): boolean => {
      const el = contentRef.current;
      if (!el) return false;

      // Re-enter editing mode if we were recently editing (within debounce window)
      if (!isEditingRef.current && registeredElementIdRef.current === elementId) {
        setIsEditing(true);
        setShowToolbar(true);
      }

      // Keep editing active, but don't steal focus from inspector controls (sliders/inputs)
      const activeEl = document.activeElement as HTMLElement | null;
      const isInteractingWithInspector =
        !!activeEl?.closest('.builder-right-panel') ||
        !!activeEl?.closest('[data-radix-popper-content-wrapper]') ||
        !!activeEl?.closest('[data-radix-popover-content]') ||
        !!activeEl?.closest('[data-radix-select-content]');

      if (!isInteractingWithInspector) {
        el.focus();
      }

      // Restore saved selection
      const sel = window.getSelection();
      if (sel && lastSelectionRangeRef.current) {
        try {
          if (el.contains(lastSelectionRangeRef.current.commonAncestorContainer)) {
            sel.removeAllRanges();
            sel.addRange(lastSelectionRangeRef.current.cloneRange());
          }
        } catch { /* ignore */ }
      }

      return handleStyleChange(nextStyles);
    };

    // Build EditorBridge with apply + getSelectionStyles
    const getSelectionStyles = (): Partial<TextStyles> | null => {
      const root = contentRef.current;
      if (!root) return null;

      const findSpanFromRange = (range: Range | null): HTMLSpanElement | null => {
        if (!range) return null;
        let node: Node | null = range.startContainer;
        let el: HTMLElement | null = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
        while (el && el !== root) {
          if (el.tagName === 'SPAN' && el.getAttribute('style')) return el as HTMLSpanElement;
          el = el.parentElement;
        }
        return null;
      };

      const span =
        getStyledSpanAtSelection(root) ||
        (activeInlineSpanRef.current && root.contains(activeInlineSpanRef.current) ? activeInlineSpanRef.current : null) ||
        findSpanFromRange(lastSelectionRangeRef.current);

      if (!span) return null;
      return getSpanFillStyles(span) as Partial<TextStyles>;
    };

    const bridge = { apply: applyFromInspector, getSelectionStyles };

    if (isEditing) {
      registeredElementIdRef.current = elementId;
      const unregister = registerEditor(elementId, bridge);
      
      return () => {
        // Debounce unregistration to allow RightPanel clicks to still work
        unregisterTimerRef.current = window.setTimeout(() => {
          unregister();
          registeredElementIdRef.current = null;
        }, 300);
      };
    } else if (registeredElementIdRef.current === elementId) {
      // Re-register briefly if we just stopped editing (allows RightPanel clicks to work)
      const unregister = registerEditor(elementId, bridge);
      
      unregisterTimerRef.current = window.setTimeout(() => {
        unregister();
        registeredElementIdRef.current = null;
      }, 300);
      
      return () => {
        if (unregisterTimerRef.current) {
          window.clearTimeout(unregisterTimerRef.current);
          unregisterTimerRef.current = null;
        }
      };
    }
  }, [isEditing, elementId, registerEditor, handleStyleChange]);

  // Get CSS classes based on styles
  const getStyleClasses = () => {
    const classes: string[] = [];
    
    // Font size (extended for hero headlines)
    switch (styles.fontSize) {
      case 'sm': classes.push('text-sm'); break;
      case 'md': classes.push('text-base'); break;
      case 'lg': classes.push('text-lg'); break;
      case 'xl': classes.push('text-xl'); break;
      case '2xl': classes.push('text-2xl'); break;
      case '3xl': classes.push('text-3xl'); break;
      case '4xl': classes.push('text-4xl'); break;
      case '5xl': classes.push('text-5xl'); break;
    }
    
    // Font weight (extended)
    switch (styles.fontWeight) {
      case 'normal': classes.push('font-normal'); break;
      case 'medium': classes.push('font-medium'); break;
      case 'semibold': classes.push('font-semibold'); break;
      case 'bold': classes.push('font-bold'); break;
      case 'black': classes.push('font-black'); break;
    }
    
    // Font style
    if (styles.fontStyle === 'italic') classes.push('italic');
    
    // Text decoration
    if (styles.textDecoration === 'underline') classes.push('underline');
    
    // Text align
    switch (styles.textAlign) {
      case 'left': classes.push('text-left'); break;
      case 'center': classes.push('text-center'); break;
      case 'right': classes.push('text-right'); break;
    }
    
    return classes.join(' ');
  };

  // Get base gradient styles (for direct application to text)
  const getGradientStyles = (): React.CSSProperties => {
    if (styles.textFillType === 'gradient' && styles.textGradient) {
      return {
        // Use backgroundImage instead of background to avoid CSS shorthand conflicts
        backgroundImage: gradientToCSS(styles.textGradient),
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      } as React.CSSProperties;
    }
    // Fallback: if fillType is gradient but no gradient exists, use default
    if (styles.textFillType === 'gradient') {
      return {
        backgroundImage: gradientToCSS(defaultGradient),
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      } as React.CSSProperties;
    }
    return {};
  };

  // Get inline styles for extended properties
  // When editing AND using gradient, apply gradient to the contenteditable div itself
  const getInlineStyles = (): React.CSSProperties => {
    const inlineStyles: React.CSSProperties = {};

    // Font family
    if (styles.fontFamily && styles.fontFamily !== 'inherit') {
      inlineStyles.fontFamily = styles.fontFamily;
    }

    // Font size - apply as inline style for pixel values (Tailwind classes handle presets)
    if (styles.fontSize) {
      const presetSizes = new Set(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']);
      if (!presetSizes.has(styles.fontSize)) {
        inlineStyles.fontSize = styles.fontSize;
      }
    }

    // Font weight - ALWAYS apply as inline style for reliability
    // (Tailwind classes are backup but inline takes precedence)
    if (styles.fontWeight) {
      const weightMap: Record<string, number> = { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 };
      inlineStyles.fontWeight = weightMap[styles.fontWeight] || 400;
    }

    // Font style (italic)
    if (styles.fontStyle === 'italic') {
      inlineStyles.fontStyle = 'italic';
    }

    // When editing with gradient, apply gradient styles to the container div
    // This ensures the gradient is visible while the user is editing
    // IMPORTANT: if the content is using inline spans (HTML), do NOT apply a block-level gradient
    // to the entire contentEditable or it will visually override the selection-only gradient.
    if (isEditing && styles.textFillType === 'gradient' && !sessionHasInlineStyles && !isHtmlContent) {
      const gradientValue = styles.textGradient || defaultGradient;
      inlineStyles.backgroundImage = gradientToCSS(gradientValue);
      inlineStyles.WebkitBackgroundClip = 'text';
      inlineStyles.WebkitTextFillColor = 'transparent';
      (inlineStyles as Record<string, string>).backgroundClip = 'text';
      // CRITICAL: Set color to transparent to prevent white flash fallback
      inlineStyles.color = 'transparent';
    } else if (styles.textFillType === 'gradient' && !isEditing && !isHtmlContent) {
      // Even when not editing, if fillType is gradient, ensure no white fallback
      // (but never do this for HTML content with inline spans, or it can hide unstyled nodes)
      inlineStyles.color = 'transparent';
    } else if (styles.textFillType !== 'gradient') {
      // Text color (only if not gradient)
      if (styles.textColor) {
        inlineStyles.color = styles.textColor;
      }
    }

    // Text shadow
    if (styles.textShadow && styles.textShadow !== 'none') {
      const shadowMap: Record<string, string> = {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.15)',
        medium: '0 2px 4px rgba(0, 0, 0, 0.25)',
        strong: '0 4px 8px rgba(0, 0, 0, 0.4)',
        glow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)',
        neon: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor',
        depth: '0 1px 0 rgba(0, 0, 0, 0.1), 0 2px 0 rgba(0, 0, 0, 0.08), 0 3px 0 rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.15)',
      };
      inlineStyles.textShadow = shadowMap[styles.textShadow];
    }

    return inlineStyles;
  };

  // Get highlight styles for {{text}} syntax
  const getHighlightStyles = (): React.CSSProperties => {
    const highlightStyles: React.CSSProperties = {};
    
    if (styles.highlightUseGradient && styles.highlightGradient) {
      // Use backgroundImage to avoid CSS shorthand conflicts
      highlightStyles.backgroundImage = gradientToCSS(styles.highlightGradient);
      highlightStyles.WebkitBackgroundClip = 'text';
      highlightStyles.WebkitTextFillColor = 'transparent';
      (highlightStyles as Record<string, string>).backgroundClip = 'text';
    } else if (styles.highlightColor) {
      highlightStyles.color = styles.highlightColor;
    } else {
      // Default highlight: use builder accent (pink/magenta) instead of gold
      highlightStyles.color = 'hsl(var(--builder-accent-secondary))';
    }
    
    return highlightStyles;
  };
  
  // Get non-highlighted segment styles (applies base gradient to non-highlighted text)
  const getNonHighlightStyles = (): React.CSSProperties => {
    // For non-highlighted segments when base is gradient, apply gradient per span
    if (styles.textFillType === 'gradient' && styles.textGradient) {
      return {
        ...getGradientStyles(),
        display: 'inline', // Important: inline-block can break text flow
      };
    }
    // Otherwise just use the text color
    if (styles.textColor) {
      return { color: styles.textColor };
    }
    return {};
  };

  // Check if content has highlight syntax (only for plain text values)
  const isHtmlContent = value && containsHTML(value);
  const contentHasHighlights = value && !isHtmlContent && hasHighlightSyntax(value);

  // Render content with highlight syntax support and HTML preservation
  const renderContent = () => {
    if (!value) {
      return !isEditing ? placeholder : '';
    }
    
    // When editing, check if the value contains HTML (inline styled spans)
    if (isEditing) {
      // If value is HTML, we need to render it using dangerouslySetInnerHTML
      // The contentEditable will handle the HTML natively
      if (isHtmlContent) {
        // Return null here - we'll use dangerouslySetInnerHTML on the div instead
        return null;
      }
      return value;
    }
    
    // When not editing and content is HTML, render without forcing a block-level gradient.
    // If the HTML contains inline styled spans, those should be the source of truth.
    if (isHtmlContent) {
      const hasInlineStyledSpans = /<span[^>]*style=/i.test(value || '');

      // Legacy behavior: if the whole block is gradient and there are NO inline spans,
      // we can wrap with a gradient span.
      if (styles.textFillType === 'gradient' && !hasInlineStyledSpans) {
        const gradientValue = styles.textGradient || defaultGradient;
        return (
          <span 
            style={{
              backgroundImage: gradientToCSS(gradientValue),
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            } as React.CSSProperties}
            dangerouslySetInnerHTML={{ __html: sanitizeStyledHTML(value) }}
          />
        );
      }

      // Otherwise: let the inline spans render as-is
      return null;
    }
    
    // When not editing, render highlights (for legacy {{text}} syntax)
    if (contentHasHighlights) {
      const segments = parseHighlightedText(value);
      const highlightStyles = getHighlightStyles();
      const nonHighlightStyles = getNonHighlightStyles();
      
      return segments.map((segment, index) => {
        if (segment.isHighlighted) {
          return (
            <span key={index} style={highlightStyles} className="font-bold">
              {segment.text}
            </span>
          );
        }
        // Apply base gradient/color to non-highlighted segments
        return (
          <span key={index} style={nonHighlightStyles}>
            {segment.text}
          </span>
        );
      });
    }
    
    // No highlights - check if gradient should be applied
    if (styles.textFillType === 'gradient') {
      // Use existing gradient or fallback to default
      const gradientValue = styles.textGradient || defaultGradient;
      return (
        <span style={{
          backgroundImage: gradientToCSS(gradientValue),
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent', // Prevent white fallback
        } as React.CSSProperties}>
          {value}
        </span>
      );
    }
    
    // Solid color - apply via inline style if set
    if (styles.textColor) {
      return (
        <span style={{ color: styles.textColor }}>
          {value}
        </span>
      );
    }
    
    return value;
  };
  
  // Track the last value we applied to the contentEditable while editing.
  // This prevents cursor/selection glitches when the parent re-renders.
  const lastAppliedHtmlRef = useRef<string>('');
  const lastAppliedPlainTextRef = useRef<string>('');

  // Keep editing DOM in sync with external value changes *only when safe*.
  // While we're applying inline spans, the DOM is the source of truth until the debounced save updates `value`.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (!isEditing) {
      lastAppliedHtmlRef.current = '';
      lastAppliedPlainTextRef.current = '';
      if (sessionHasInlineStyles) setSessionHasInlineStyles(false);
      return;
    }

    // If we just introduced inline spans locally, don't overwrite from `value` yet.
    if (sessionHasInlineStyles && !isHtmlContent) return;

    if (isHtmlContent) {
      const sanitized = sanitizeStyledHTML(value || '');
      if (lastAppliedHtmlRef.current !== sanitized && el.innerHTML !== sanitized) {
        el.innerHTML = sanitized;
        lastAppliedHtmlRef.current = sanitized;
      }
      return;
    }

    const nextText = value || '';
    if (lastAppliedPlainTextRef.current !== nextText && el.innerText !== nextText) {
      el.innerText = nextText;
      lastAppliedPlainTextRef.current = nextText;
    }
  }, [isEditing, isHtmlContent, value, sessionHasInlineStyles]);

  const shouldUseDangerouslySetHtml =
    !isEditing && !!isHtmlContent && styles.textFillType !== 'gradient';

  // Toolbar UI interactions can collapse the text selection.
  // Restore the last non-collapsed in-editor selection before applying styles.
  const handleToolbarStyleChange = useCallback(
    (nextStyles: Partial<TextStyles>) => {
      const el = contentRef.current;
      if (!el) return;

      // DO NOT steal focus from sliders/pickers inside the toolbar popovers.
      // Some slider interactions don't focus an element, so we also rely on recent pointerdown.
      const activeEl = document.activeElement as HTMLElement | null;
      const isInteractingWithToolbar =
        !!activeEl?.closest('.rich-text-toolbar') ||
        !!activeEl?.closest('[data-radix-popper-content-wrapper]') ||
        !!activeEl?.closest('[data-radix-popover-content]') ||
        !!activeEl?.closest('[data-radix-select-content]');
      const recentlyPointeredToolbar = Date.now() - lastToolbarInteractionAtRef.current < 800;

      if (!isInteractingWithToolbar && !recentlyPointeredToolbar) {
        el.focus();
      }

      const sel = window.getSelection();
      if (sel && lastSelectionRangeRef.current) {
        try {
          if (el.contains(lastSelectionRangeRef.current.commonAncestorContainer)) {
            sel.removeAllRanges();
            sel.addRange(lastSelectionRangeRef.current.cloneRange());
          }
        } catch {
          // ignore
        }
      }

      handleStyleChange(nextStyles);
    },
    [handleStyleChange]
  );

  const setContainerRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;

      if (!forwardedRef) return;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [forwardedRef]
  );

  return (
    <div ref={setContainerRefs} className="relative">
      {/* Floating Rich Text Toolbar */}
      {showToolbar && (
        <RichTextToolbar
          ref={toolbarRef}
          styles={styles}
          onChange={handleToolbarStyleChange}
          position={toolbarPosition}
          onClose={() => setShowToolbar(false)}
        />
      )}

      {/* Editable Content */}
      <div
        ref={contentRef}
        contentEditable={isEditing && !disabled}
        suppressContentEditableWarning
        onDoubleClick={handleDoubleClick}
        onBlur={handleBlur}
        onSelect={handleSelect}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setIsEditing(false);
            setShowToolbar(false);
            contentRef.current?.blur();
          }
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            setIsEditing(false);
            setShowToolbar(false);
            contentRef.current?.blur();
          }
        }}
        style={getInlineStyles()}
        className={`
          outline-none transition-all duration-150
          ${getStyleClasses()}
          ${isEditing
            ? 'ring-2 ring-[hsl(var(--builder-accent))] rounded px-1 -mx-1 bg-white/5'
            : 'cursor-pointer hover:ring-1 hover:ring-[hsl(var(--builder-accent-muted))] rounded'
          }
          ${!value && !isEditing ? 'text-gray-400' : ''}
          ${className}
        `}
        {...(shouldUseDangerouslySetHtml
          ? { dangerouslySetInnerHTML: { __html: sanitizeStyledHTML(value || '') } }
          : {})}
      >
        {/* When editing, we never render children from React to avoid DOM clobbering. */}
        {!isEditing && !shouldUseDangerouslySetHtml ? renderContent() : null}
      </div>
    </div>
  );
});

InlineTextEditor.displayName = 'InlineTextEditor';
