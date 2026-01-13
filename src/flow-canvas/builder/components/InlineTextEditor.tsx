import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { toast } from 'sonner';
import { RichTextToolbar } from './RichTextToolbar';
import { gradientToCSS, cloneGradient, defaultGradient } from './modals';
import type { GradientValue } from './modals';
import { parseHighlightedText, hasHighlightSyntax } from '../utils/textHighlight';
import {
  applyStylesToSelection,
  containsHTML,
  getStyledSpanAtSelection,
  getSpanFillStyles,
  getComputedTextColorAtSelection,
  hasSelectionInElement,
  mergeAdjacentStyledSpans,
  removeFormatFromSelection,
  sanitizeStyledHTML,
  unwrapNestedStyledSpans,
  updateSpanStyle,
  insertStyledSpanAtCaret,
} from '../utils/selectionStyles';
import type { SelectionStyleOptions } from '../utils/selectionStyles';
import { getSelectionFormatState, type FormatState } from '../utils/selectionFormat';
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
  
  // Selection-level fill state (separate from block-level styles)
  // This tracks the fill of the current selection/caret for toolbar display
  // WITHOUT affecting the container's color (prevents "whole block turns color" bug)
  const [selectionFill, setSelectionFill] = useState<{
    textFillType?: 'solid' | 'gradient';
    textColor?: string;
    textGradient?: GradientValue;
  }>({});

  // Tri-state formatting state (source of truth for B/I/U button states)
  const [selectionFormat, setSelectionFormat] = useState<FormatState>({
    bold: 'off',
    italic: 'off',
    underline: 'off',
  });
  
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
  const activeInlineSpanIdRef = useRef<string | null>(null); // Stable ID to re-acquire span after DOM mutations
  const inlineSaveTimerRef = useRef<number | null>(null);

  // Persist the last selection range so Right Panel edits can apply to the intended letters
  const lastSelectionRangeRef = useRef<Range | null>(null);
  // Persist the last caret (collapsed) range so toolbar toggles can apply to "next typed text"
  const lastCaretRangeRef = useRef<Range | null>(null);
  // Track the "auto select-all" range from double-click so we can ignore it when it's stale
  const autoSelectAllRangeRef = useRef<Range | null>(null);
  // Timestamp of last intentional user selection (not auto-select-all)
  const lastUserSelectionAtRef = useRef<number>(0);
  // (prevents edit-mode from closing when using sliders / popovers that don't move focus)
  const lastPointerDownInInspectorRef = useRef(false);
  const lastPointerDownInToolbarRef = useRef(false);
  const lastToolbarInteractionAtRef = useRef<number>(0);
  const lastInspectorInteractionAtRef = useRef<number>(0);
  
  // Pointer-lock refs: TRUE lock for pointer-down state (fixes long slider drags beyond 800ms timeout)
  const isPointerDownRef = useRef(false);
  const pointerDownContextRef = useRef<'toolbar' | 'inspector' | null>(null);
  
  // Slider interaction lock - prevents selection overwrites during rapid slider updates
  const isSliderDraggingRef = useRef(false);
  const sliderDragTimeoutRef = useRef<number | null>(null);

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

      // CHANGED: Place caret at END instead of selecting all text.
      // This prevents "whole block becomes bold" when user clicks Bold without selecting anything.
      // The user can still select-all via Cmd+A if they want to format everything.
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false); // collapse to END
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Clear any stale auto-select-all range
      autoSelectAllRangeRef.current = null;
      lastSelectionRangeRef.current = null;
      // Store the initial caret position
      lastCaretRangeRef.current = range.cloneRange();
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
    
    // If pointer is still down on toolbar/inspector, don't exit (slider drag in progress)
    if (isPointerDownRef.current && (pointerDownContextRef.current === 'toolbar' || pointerDownContextRef.current === 'inspector')) {
      return;
    }
    
    // SAFETY NET: If we VERY recently interacted with the toolbar (within 500ms),
    // prevent blur. This handles edge cases where focus collapses before style is applied.
    if (!relatedTarget && Date.now() - lastToolbarInteractionAtRef.current < 500) {
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
    // Clear selection fill on exit so next edit session starts fresh
    setSelectionFill({});
    
    if (contentRef.current) {
      // Clean up adjacent spans with same styles
      mergeAdjacentStyledSpans(contentRef.current);
      
      // Clean up caret host markers before saving - they're only needed during live editing
      const caretHosts = contentRef.current.querySelectorAll('span[data-caret-host]');
      caretHosts.forEach(el => {
        el.removeAttribute('data-caret-host');
        // If the span only contains ZWSP and nothing else, remove it entirely
        if (el.textContent === '\u200B') {
          el.parentNode?.removeChild(el);
        }
      });
      
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
  // Also maintains TRUE pointer-lock state for arbitrarily long slider drags
  useEffect(() => {
    if (!isEditing) return;

    const handlePointerDown = (ev: PointerEvent) => {
      const target = ev.target as HTMLElement | null;
      const isInspector = !!target?.closest('.builder-right-panel') ||
                          !!target?.closest('[data-radix-popper-content-wrapper]') ||
                          !!target?.closest('[data-radix-popover-content]');
      lastPointerDownInInspectorRef.current = isInspector;
      if (isInspector) lastInspectorInteractionAtRef.current = Date.now();

      const toolbarHit =
        !!target?.closest('.rich-text-toolbar') ||
        !!target?.closest('[data-radix-popper-content-wrapper]') ||
        !!target?.closest('[data-radix-popover-content]') ||
        !!target?.closest('[data-radix-select-content]');
      lastPointerDownInToolbarRef.current = toolbarHit;
      if (toolbarHit) lastToolbarInteractionAtRef.current = Date.now();
      
      // Set pointer-lock state for long drags
      isPointerDownRef.current = true;
      if (toolbarHit) {
        pointerDownContextRef.current = 'toolbar';
      } else if (isInspector) {
        pointerDownContextRef.current = 'inspector';
      } else {
        pointerDownContextRef.current = null;
      }
    };
    
    const handlePointerUp = (ev: PointerEvent) => {
      isPointerDownRef.current = false;
      pointerDownContextRef.current = null;
      
      // CRITICAL FIX: Capture selection on ANY pointerup, not just when target is inside editor.
      // This fixes drag-selections where mouse is released outside the contentEditable bounds.
      const editorEl = contentRef.current;
      if (!editorEl) return;
      
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // Check if the range is inside the editor (even if pointerup target was outside)
        const isRangeInEditor = (r: Range): boolean => {
          try {
            return (
              editorEl.contains(r.startContainer) ||
              editorEl.contains(r.endContainer) ||
              editorEl.contains(r.commonAncestorContainer) ||
              r.startContainer === editorEl ||
              r.endContainer === editorEl
            );
          } catch {
            return false;
          }
        };
        
        if (isRangeInEditor(range)) {
          if (!range.collapsed && range.toString().length > 0) {
            lastSelectionRangeRef.current = range.cloneRange();
            lastUserSelectionAtRef.current = Date.now();
            if (import.meta.env.DEV) {
              console.debug('[PointerUp] Captured selection:', range.toString().slice(0, 30));
            }
          } else if (range.collapsed) {
            lastCaretRangeRef.current = range.cloneRange();
            lastUserSelectionAtRef.current = Date.now();
          }
        }
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointercancel', handlePointerUp, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      document.removeEventListener('pointercancel', handlePointerUp, true);
    };
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
    // Use start/end containers for reliable detection (anchor/focus can be outside for drag selections)
    const selectionInside =
      !!range &&
      (editorEl.contains(range.startContainer) ||
        editorEl.contains(range.endContainer) ||
        editorEl.contains(range.commonAncestorContainer) ||
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
        // Use start/end containers for reliable detection (anchor/focus can be outside for drag selections)
        const selectionInside =
          !!range &&
          (editorEl.contains(range.startContainer) ||
            editorEl.contains(range.endContainer) ||
            editorEl.contains(range.commonAncestorContainer) ||
            editorEl.contains(sel?.anchorNode ?? null) ||
            editorEl.contains(sel?.focusNode ?? null));

        if (selectionInside && range) {
          // Snapshot selections/caret for later toolbar/right-panel actions.
          // - Non-collapsed: keep as lastSelectionRangeRef
          // - Collapsed caret: keep as lastCaretRangeRef
          if (!range.collapsed && range.toString().length > 0 && !isSliderDraggingRef.current) {
            lastSelectionRangeRef.current = range.cloneRange();
            lastUserSelectionAtRef.current = Date.now();
          } else if (range.collapsed) {
            lastCaretRangeRef.current = range.cloneRange();
            lastUserSelectionAtRef.current = Date.now();
          }

          // Compute B/I/U tri-state from the actual DOM selection (not block-level styles)
          try {
            const fmt = getSelectionFormatState(editorEl, range);
            setSelectionFormat((prev) =>
              prev.bold === fmt.bold && prev.italic === fmt.italic && prev.underline === fmt.underline ? prev : fmt
            );
          } catch {
            // ignore
          }

          // Only update active span when the selection/caret is inside the editor.
          const span = getStyledSpanAtSelection(editorEl);
          if (span) {
            activeInlineSpanRef.current = span;
            activeInlineSpanIdRef.current = span.dataset.inlineStyleId || null;

            // Keep toolbar color/gradient UI synced to the selected span even if
            // selection changes via keyboard (handleSelect doesn't fire reliably).
            const fill = getSpanFillStyles(span);
            if (fill.textFillType) {
              setSelectionFill((prev) => {
                const nextFillType = fill.textFillType ?? prev.textFillType;
                const nextColor = fill.textColor ?? prev.textColor;
                const nextGradient = fill.textGradient ? cloneGradient(fill.textGradient) : prev.textGradient;

                const sameGradient = gradientEquals(prev.textGradient, nextGradient as any);
                const unchanged = prev.textFillType === nextFillType && prev.textColor === nextColor && sameGradient;
                if (unchanged) return prev;

                return {
                  textFillType: nextFillType,
                  textColor: nextColor,
                  textGradient: nextGradient,
                };
              });
            }
          } else {
            // No styled span found - compute the actual text color from the DOM
            const computedColor = getComputedTextColorAtSelection(editorEl);
            if (computedColor) {
              // Check if this is a "transparent" color (indicates gradient text with -webkit-text-fill-color: transparent)
              const isTransparent =
                computedColor === 'transparent' ||
                computedColor === 'rgba(0, 0, 0, 0)' ||
                /rgba?\([^)]*,\s*0\s*\)/.test(computedColor);

              if (!isTransparent) {
                // Real solid color - update selectionFill (not block-level styles)
                setSelectionFill((prev) => {
                  if (prev.textFillType === 'solid' && prev.textColor === computedColor) return prev;
                  return {
                    textFillType: 'solid',
                    textColor: computedColor,
                  };
                });
              }
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
  // NOTE: During active editing, we must NOT run full sanitizeStyledHTML() here because it:
  // - strips ZWSP caret hosts
  // - can restructure spans (breaks selection targeting)
  // Sanitization happens on blur/save and when rendering outside edit mode.
  const scheduleInlineHtmlSave = useCallback(() => {
    const editorEl = contentRef.current;
    if (!editorEl) return;

    if (inlineSaveTimerRef.current) {
      window.clearTimeout(inlineSaveTimerRef.current);
    }

    const stripEditingArtifacts = (html: string) => {
      // Remove ZWSP and caret-host markers from the SAVED html only.
      // (Do not touch the live DOM here.)
      return html
        .replace(/\u200B/g, '')
        .replace(/\sdata-caret-host=("1"|'1')/g, '');
    };

    inlineSaveTimerRef.current = window.setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;

      const htmlContent = stripEditingArtifacts(el.innerHTML);
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
    // Use start/end containers for reliable detection (anchor/focus can be outside for drag selections)
    const selectionInside =
      !!range &&
      (editorEl.contains(range.startContainer) ||
        editorEl.contains(range.endContainer) ||
        editorEl.contains(range.commonAncestorContainer) ||
        editorEl.contains(sel?.anchorNode ?? null) ||
        editorEl.contains(sel?.focusNode ?? null));

    if (selectionInside && range) {
      // Snapshot selection/caret for later toolbar actions.
      if (!range.collapsed && range.toString().length > 0 && !isSliderDraggingRef.current) {
        lastSelectionRangeRef.current = range.cloneRange();
        lastUserSelectionAtRef.current = Date.now();
      } else if (range.collapsed) {
        lastCaretRangeRef.current = range.cloneRange();
        lastUserSelectionAtRef.current = Date.now();
      }

      // Compute B/I/U tri-state from actual DOM selection
      try {
        const fmt = getSelectionFormatState(editorEl, range);
        setSelectionFormat((prev) =>
          prev.bold === fmt.bold && prev.italic === fmt.italic && prev.underline === fmt.underline ? prev : fmt
        );
      } catch {
        // ignore
      }

      const span = getStyledSpanAtSelection(editorEl);
      if (span) {
        activeInlineSpanRef.current = span;
        activeInlineSpanIdRef.current = span.dataset.inlineStyleId || null;
    // Keep toolbar UI synced to the selected span's fill via selectionFill (NOT styles)
        const fill = getSpanFillStyles(span);
        if (fill.textFillType) {
          setSelectionFill((prev) => {
            const nextFillType = fill.textFillType ?? prev.textFillType;
            const nextColor = fill.textColor ?? prev.textColor;
            const nextGradient = fill.textGradient ? cloneGradient(fill.textGradient) : prev.textGradient;

            const sameGradient = gradientEquals(prev.textGradient, nextGradient as any);
            const unchanged = prev.textFillType === nextFillType && prev.textColor === nextColor && sameGradient;
            if (unchanged) return prev;

            return {
              textFillType: nextFillType,
              textColor: nextColor,
              textGradient: nextGradient,
            };
          });
        }
      } else {
        // No styled span - compute the actual text color from the DOM
        const computedColor = getComputedTextColorAtSelection(editorEl);
        if (computedColor) {
          // Check if this is a "transparent" color (indicates gradient text)
          const isTransparent = computedColor === 'transparent' || 
            computedColor === 'rgba(0, 0, 0, 0)' || 
            /rgba?\([^)]*,\s*0\s*\)/.test(computedColor);
          
          if (!isTransparent) {
            // Real solid color - update selectionFill (not block-level styles)
            setSelectionFill((prev) => {
              if (prev.textFillType === 'solid' && prev.textColor === computedColor) return prev;
              return {
                textFillType: 'solid',
                textColor: computedColor,
              };
            });
          }
        }
      }
    }
  }, [isEditing, updateToolbarPosition]);

  // Apply style changes - selection-first for color/gradient/formatting, otherwise whole block
  // Returns true if inline styling was applied (for context callback)
  const handleStyleChange = useCallback((newStyles: Partial<TextStyles>): boolean => {
    const editorEl = contentRef.current;
    let didHandleToggle = false;

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

      // Check if user explicitly requested a color/gradient change
      const hasColorRequest = newStyles.textFillType !== undefined || 
                              newStyles.textColor !== undefined || 
                              newStyles.textGradient !== undefined;

      // Check if this is a formatting-only change (bold/italic/underline)
      const isFormattingOnly = !hasColorRequest && (
        newStyles.fontWeight !== undefined ||
        newStyles.fontStyle !== undefined ||
        newStyles.textDecoration !== undefined
      );

      if (hasColorRequest) {
        // User explicitly wants to change color/gradient
        if (newStyles.textFillType === 'gradient') {
          opts.gradient = newStyles.textGradient || styles.textGradient || defaultGradient;
          opts.color = undefined;
        } else if (newStyles.textColor !== undefined || newStyles.textFillType === 'solid') {
          const computed = editorEl ? window.getComputedStyle(editorEl).color : '';
          opts.color = newStyles.textColor || styles.textColor || computed || 'currentColor';
          opts.gradient = undefined;
        }
      } else if (isFormattingOnly) {
        // CRITICAL FIX: When applying B/I/U only, inherit the block-level gradient/color
        // so the new span doesn't lose the existing visual style.
        // The selectionStyles utility also handles inheriting from existing spans,
        // but this covers the case where no span exists yet (block-level gradient).
        if (styles.textFillType === 'gradient' && styles.textGradient) {
          opts.gradient = cloneGradient(styles.textGradient);
        } else if (styles.textColor) {
          opts.color = styles.textColor;
        }
        // If no block-level color set, leave undefined - selectionStyles will handle computed color
      }

      // ─────────────────────────────────────────────────────────────────────────
      // CRITICAL TOGGLE LOGIC (DOM = source of truth)
      // - Decisions MUST be based on live DOM selection formatting.
      // - React state (selectionFormat) is for UI only.
      // ─────────────────────────────────────────────────────────────────────────
      const computeLiveFormat = (): FormatState => {
        if (!editorEl) {
          return { bold: 'off', italic: 'off', underline: 'off' };
        }

        const sel = window.getSelection();
        const liveRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

        const isRangeInEditor = (r: Range | null) => {
          if (!r) return false;
          try {
            return (
              editorEl.contains(r.startContainer) ||
              editorEl.contains(r.endContainer) ||
              editorEl.contains(r.commonAncestorContainer) ||
              r.startContainer === editorEl ||
              r.endContainer === editorEl
            );
          } catch {
            return false;
          }
        };

        // When clicking the toolbar, browser selection can temporarily “move”.
        // We still compute from DOM, but may need to fall back to the last known DOM Range.
        const isRecent = Date.now() - lastUserSelectionAtRef.current < 10000;

        const range: Range | null =
          (isRangeInEditor(liveRange) ? liveRange : null) ??
          (isRecent && isRangeInEditor(lastSelectionRangeRef.current) ? lastSelectionRangeRef.current : null) ??
          (isRecent && isRangeInEditor(lastCaretRangeRef.current) ? lastCaretRangeRef.current : null);

        if (!range) {
          return { bold: 'off', italic: 'off', underline: 'off' };
        }

        try {
          return getSelectionFormatState(editorEl, range);
        } catch {
          return { bold: 'off', italic: 'off', underline: 'off' };
        }
      };

      const liveFormat = computeLiveFormat();

      if (newStyles.fontWeight) {
        const wMap: Record<string, string> = {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700',
          black: '900',
        };

        const requestedWeight = wMap[newStyles.fontWeight] || newStyles.fontWeight;
        const wantsBold = Number(requestedWeight) >= 600 || newStyles.fontWeight === 'bold';

        // TRUE TOGGLE:
        // - If selection is bold/mixed -> REMOVE (null)
        // - Else -> APPLY (requestedWeight)
        if (wantsBold) {
          opts.fontWeight = liveFormat.bold !== 'off' ? null : requestedWeight;
        } else {
          opts.fontWeight = null;
        }
      }

      if (newStyles.fontStyle) {
        const wantsItalic = newStyles.fontStyle === 'italic';
        if (wantsItalic) {
          opts.fontStyle = liveFormat.italic !== 'off' ? null : 'italic';
        } else {
          opts.fontStyle = null;
        }
      }

      if (newStyles.textDecoration) {
        const wantsUnderline = String(newStyles.textDecoration).toLowerCase().includes('underline');
        if (wantsUnderline) {
          opts.textDecoration = liveFormat.underline !== 'off' ? null : 'underline';
        } else {
          opts.textDecoration = null;
        }
      }

      return Object.keys(opts).length > 0 ? opts : null;
    };

    // Helper: sync toolbar local state so pickers show updated value
    // IMPORTANT: During inline editing, update selectionFill (NOT styles) to avoid
    // coloring the entire container block when applying a selection-only color.
    const syncToolbarState = () => {
      const sync: Partial<{ textFillType: 'solid' | 'gradient'; textColor: string; textGradient: GradientValue }> = {};
      if (newStyles.textFillType !== undefined) sync.textFillType = newStyles.textFillType;
      if (newStyles.textGradient) sync.textGradient = cloneGradient(newStyles.textGradient);
      if (newStyles.textColor !== undefined) sync.textColor = newStyles.textColor;
      if (Object.keys(sync).length) setSelectionFill(prev => ({ ...prev, ...sync }));
    };

    // DOM cleanup that preserves selection/caret across structural normalization.
    // IMPORTANT: During live editing, we do NOT call sanitizeStyledHTML() because it
    // strips ZWSP caret hosts, breaking caret toggles. Sanitization happens on blur/save.
    const normalizeInlineDom = (preserveCaretHosts = true) => {
      if (!editorEl) return;

      const sel = window.getSelection();
      const live = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

      const isRangeInEditor = (r: Range | null) => {
        if (!r) return false;
        try {
          return (
            editorEl.contains(r.startContainer) ||
            editorEl.contains(r.endContainer) ||
            editorEl.contains(r.commonAncestorContainer)
          );
        } catch {
          return false;
        }
      };

      const baseRange =
        (isRangeInEditor(live) ? live : null) ??
        (isRangeInEditor(lastSelectionRangeRef.current) ? lastSelectionRangeRef.current : null) ??
        (isRangeInEditor(lastCaretRangeRef.current) ? lastCaretRangeRef.current : null);

      const mkId = (prefix: string) =>
        `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

      const startId = mkId('inline-marker-start');
      const endId = baseRange && !baseRange.collapsed ? mkId('inline-marker-end') : null;

      const insertMarkerAt = (r: Range, id: string) => {
        const marker = document.createElement('span');
        marker.setAttribute('data-inline-marker', id);
        r.insertNode(marker);
      };

      // Insert selection markers so we can restore caret/selection after DOM mutations.
      // (Even unwrap/merge/normalize can invalidate live Range containers.)
      if (baseRange) {
        try {
          if (endId) {
            const endRange = baseRange.cloneRange();
            endRange.collapse(false);
            insertMarkerAt(endRange, endId);
          }

          const startRange = baseRange.cloneRange();
          startRange.collapse(true);
          insertMarkerAt(startRange, startId);
        } catch {
          // If we fail to insert markers, proceed without preservation.
        }
      }

      // Structural cleanup only (no innerHTML rewrite during live editing)
      unwrapNestedStyledSpans(editorEl);
      mergeAdjacentStyledSpans(editorEl);

      // Unwrap style-less spans that we may have created while removing formatting.
      // (Leaves styled spans intact; strips markup-only wrappers.)
      const allSpans = Array.from(editorEl.querySelectorAll('span')) as HTMLSpanElement[];
      for (const sp of allSpans) {
        // Keep our selection markers
        if (sp.getAttribute('data-inline-marker')) continue;
        // Preserve caret host spans during live editing
        if (preserveCaretHosts && sp.dataset.caretHost) continue;
        // Preserve gradient metadata spans
        if (sp.getAttribute('data-gradient')) continue;

        // Normalize empty/garbage style attributes (e.g. style="" or style=" ; ")
        // so they can be unwrapped cleanly.
        const rawStyle = sp.getAttribute('style');
        if (rawStyle != null) {
          const meaningful = rawStyle
            .split(';')
            .map((p) => p.trim())
            .filter(Boolean)
            .some((pair) => {
              const idx = pair.indexOf(':');
              if (idx === -1) return false;
              const value = pair.slice(idx + 1).trim();
              return value.length > 0;
            });
          if (!meaningful) sp.removeAttribute('style');
        }

        // Only unwrap spans that are truly style-less wrappers
        if (sp.getAttribute('style')) continue;

        const parent = sp.parentNode;
        if (!parent) continue;
        while (sp.firstChild) parent.insertBefore(sp.firstChild, sp);
        parent.removeChild(sp);
      }

      editorEl.normalize();

      // Restore selection from markers if present
      const startEl = editorEl.querySelector(`span[data-inline-marker="${startId}"]`) as HTMLSpanElement | null;
      const endEl = endId
        ? (editorEl.querySelector(`span[data-inline-marker="${endId}"]`) as HTMLSpanElement | null)
        : null;

      if (startEl) {
        try {
          const nextRange = document.createRange();
          if (endEl) {
            nextRange.setStartAfter(startEl);
            nextRange.setEndBefore(endEl);
          } else {
            nextRange.setStartAfter(startEl);
            nextRange.collapse(true);
          }

          sel?.removeAllRanges();
          sel?.addRange(nextRange);

          // Remove markers
          endEl?.remove();
          startEl.remove();

          // Update cached ranges
          if (!nextRange.collapsed && nextRange.toString().length > 0) {
            lastSelectionRangeRef.current = nextRange.cloneRange();
          } else if (nextRange.collapsed) {
            lastCaretRangeRef.current = nextRange.cloneRange();
          }
        } catch {
          // ignore
        }
      }

      // Re-acquire active span ref by stable ID
      if (activeInlineSpanIdRef.current) {
        const found = editorEl.querySelector(`span[data-inline-style-id="${activeInlineSpanIdRef.current}"]`);
        activeInlineSpanRef.current = (found as HTMLSpanElement) || null;
      }
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

      // IMPORTANT: commonAncestorContainer can be the editor element itself (contains() would be false).
      // Use start/end containers to reliably detect in-editor selections.
      let liveHasSelection =
        !!liveRange &&
        !liveRange.collapsed &&
        liveRange.toString().length > 0 &&
        (editorEl.contains(liveRange.startContainer) ||
          editorEl.contains(liveRange.endContainer) ||
          editorEl.contains(sel?.anchorNode ?? null) ||
          editorEl.contains(sel?.focusNode ?? null));

      if (import.meta.env.DEV) {
        console.debug('[handleStyleChange] initial', {
          elementId,
          newStyles,
          liveHasSelection,
          liveRangeText: liveRange?.toString()?.slice(0, 60),
          savedRangeText: lastSelectionRangeRef.current?.toString()?.slice(0, 60),
          isSliderDragging: isSliderDraggingRef.current,
        });
      }

      // If live selection is collapsed/empty, try restoring saved selection
      // CRITICAL: Only restore if the saved selection is RECENT (within 10 seconds)
      // This prevents restoring a stale "select-all" from minutes ago
      const selectionIsRecent = Date.now() - lastUserSelectionAtRef.current < 10000;
      
      if (!liveHasSelection && lastSelectionRangeRef.current && selectionIsRecent) {
        try {
          // More robust check - verify the range endpoints are still valid
          const savedRange = lastSelectionRangeRef.current;
          const startContainer = savedRange.startContainer;
          const endContainer = savedRange.endContainer;

          // Check if EITHER endpoint is still in the editor (more lenient)
          const startValid = editorEl.contains(startContainer) || startContainer === editorEl;
          const endValid = editorEl.contains(endContainer) || endContainer === editorEl;

          if (startValid && endValid) {
            sel?.removeAllRanges();
            sel?.addRange(savedRange.cloneRange());
            liveRange = savedRange.cloneRange();
            liveHasSelection = true;

            if (import.meta.env.DEV) {
              console.debug('[handleStyleChange] Selection restored from saved:', savedRange.toString().slice(0, 30));
            }
          } else if (import.meta.env.DEV) {
            console.debug('[handleStyleChange] Saved range endpoints invalid');
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.debug('[handleStyleChange] Restoration failed:', err);
          }
        }
      }

      // If we still don't have a live range inside the editor, try restoring the last caret.
      // CRITICAL: Only restore if recent (within 10 seconds)
      if ((!liveRange || !editorEl.contains(liveRange.commonAncestorContainer)) && lastCaretRangeRef.current && selectionIsRecent) {
        try {
          const savedCaret = lastCaretRangeRef.current;
          const startValid = editorEl.contains(savedCaret.startContainer) || savedCaret.startContainer === editorEl;
          const endValid = editorEl.contains(savedCaret.endContainer) || savedCaret.endContainer === editorEl;
          if (startValid && endValid) {
            sel?.removeAllRanges();
            sel?.addRange(savedCaret.cloneRange());
            liveRange = savedCaret.cloneRange();
          }
        } catch {
          // ignore
        }
      }

      const hasSelection = liveRange && !liveRange.collapsed && liveRange.toString().length > 0;

      // If caret is active (collapsed selection), insert a styled span so toggles apply
      // to "next typed" characters (and the user sees the toolbar state update).
      const isFormattingToggle =
        styleOpts.fontWeight !== undefined ||
        styleOpts.fontStyle !== undefined ||
        styleOpts.textDecoration !== undefined;

      // NOTE: We intentionally do NOT "patch" selectionFormat based on what we *think* we applied.
      // The toolbar must be driven by computed DOM state (getSelectionFormatState) only.
      const recomputeFormatState = () => {
        if (!isFormattingToggle) return;
        try {
          const sel = window.getSelection();
          const liveRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

          const isRangeInEditor = (r: Range | null) => {
            if (!r) return false;
            try {
              return (
                editorEl.contains(r.startContainer) ||
                editorEl.contains(r.endContainer) ||
                editorEl.contains(r.commonAncestorContainer)
              );
            } catch {
              return false;
            }
          };

          const rangeForFormat =
            (isRangeInEditor(liveRange) ? liveRange : null) ??
            (isRangeInEditor(lastSelectionRangeRef.current) ? lastSelectionRangeRef.current : null) ??
            (isRangeInEditor(lastCaretRangeRef.current) ? lastCaretRangeRef.current : null);

          if (rangeForFormat) {
            const fmt = getSelectionFormatState(editorEl, rangeForFormat);
            setSelectionFormat(fmt);
          }
        } catch {
          // ignore
        }
      };

      const caretInsideEditor =
        !!liveRange &&
        liveRange.collapsed &&
        (editorEl.contains(liveRange.startContainer) ||
          editorEl.contains(liveRange.endContainer) ||
          editorEl.contains(sel?.anchorNode ?? null) ||
          editorEl.contains(sel?.focusNode ?? null));

      if (!hasSelection && caretInsideEditor && isFormattingToggle) {
        const caretOpts: SelectionStyleOptions = { ...styleOpts };

        // GUARANTEED CARET TOGGLE:
        // If the caret is already inside a styled span (e.g. <span style="font-weight:700">),
        // we must update THAT span. Otherwise, toggle-off can never work because inserting a
        // new span with “unset” styles would be a no-op.
        const findStyledSpanAtCaret = (): HTMLSpanElement | null => {
          if (!liveRange) return null;
          let node: Node | null = liveRange.startContainer;
          let el: HTMLElement | null =
            node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
          while (el && el !== editorEl) {
            if (el.tagName === 'SPAN' && el.getAttribute('style')) return el as HTMLSpanElement;
            el = el.parentElement;
          }
          return null;
        };

        const target = findStyledSpanAtCaret();

        // Only insert a caret host span when we're APPLYING a style (setting a value).
        // If we're only unsetting styles (null) and we aren't inside a styled span,
        // there is nothing to remove.
        const hasAnySetValue =
          caretOpts.color !== undefined ||
          caretOpts.gradient !== undefined ||
          (caretOpts.fontWeight !== undefined && caretOpts.fontWeight !== null) ||
          (caretOpts.fontStyle !== undefined && caretOpts.fontStyle !== null) ||
          (caretOpts.textDecoration !== undefined && caretOpts.textDecoration !== null);

        if (target) {
          updateSpanStyle(target, caretOpts);
          activeInlineSpanRef.current = target;
          activeInlineSpanIdRef.current = target.dataset.inlineStyleId || null;
        } else if (hasAnySetValue) {
          const span = insertStyledSpanAtCaret(caretOpts);
          if (span) {
            activeInlineSpanRef.current = span;
            activeInlineSpanIdRef.current = span.dataset.inlineStyleId || null;
          }
        }

        lastCaretRangeRef.current = window.getSelection()?.getRangeAt(0)?.cloneRange() ?? null;
        setSessionHasInlineStyles(true);

        normalizeInlineDom();
        scheduleInlineHtmlSave();
        syncToolbarState();

        requestAnimationFrame(recomputeFormatState);
        return true;
      }

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

      // If the ref is stale (DOM mutation removed it), try re-acquiring by stable ID
      if (!targetSpan && activeInlineSpanIdRef.current) {
        const found = editorEl.querySelector(`span[data-inline-style-id="${activeInlineSpanIdRef.current}"]`);
        if (found) {
          targetSpan = found as HTMLSpanElement;
          activeInlineSpanRef.current = targetSpan; // Re-sync ref
        }
      }

      // Mark slider dragging to prevent selection overwrites during rapid updates
      // BUT: only for gradient changes (continuous slider drags), NOT for solid color clicks
      // This ensures solid color changes don't freeze a stale selection
      const isContinuousDrag = newStyles.textGradient !== undefined || newStyles.highlightGradient !== undefined;
      if (isContinuousDrag) {
        isSliderDraggingRef.current = true;
        if (sliderDragTimeoutRef.current) window.clearTimeout(sliderDragTimeoutRef.current);
        sliderDragTimeoutRef.current = window.setTimeout(() => {
          isSliderDraggingRef.current = false;
        }, 400);
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
              activeInlineSpanIdRef.current = targetSpan.dataset.inlineStyleId || null;
              setSessionHasInlineStyles(true);

              normalizeInlineDom();
              scheduleInlineHtmlSave();
              syncToolbarState();

              requestAnimationFrame(recomputeFormatState);
              return true;
            }
          } catch {
            /* fallthrough to wrap */
          }
        }

        // Determine if we're in "remove mode" for any formatting property
        const isRemoveMode = 
          styleOpts.fontWeight === null ||
          styleOpts.fontStyle === null ||
          styleOpts.textDecoration === null;

        if (isRemoveMode) {
          const removed = removeFormatFromSelection({
            fontWeight: styleOpts.fontWeight === null,
            fontStyle: styleOpts.fontStyle === null,
            textDecoration: styleOpts.textDecoration === null,
          });

          if (removed) {
            didHandleToggle = true;

            setSessionHasInlineStyles(true);

            // 🔒 ATOMIC EXIT: normalize and leave — never re-wrap
            normalizeInlineDom();
            scheduleInlineHtmlSave();
            syncToolbarState();

            requestAnimationFrame(recomputeFormatState);
            return true; // 🚨 NOTHING BELOW MAY RUN
          }

          return false;
        }

        // TOGGLE ON: Wrap the selection with new span
        const span = applyStylesToSelection(styleOpts);
        if (span) {
          const newSpanId = span.dataset.inlineStyleId || null;
          activeInlineSpanIdRef.current = newSpanId;

          setSessionHasInlineStyles(true);

          normalizeInlineDom();
          scheduleInlineHtmlSave();
          syncToolbarState();

          // After DOM normalization, re-acquire the created span by its stable ID.
          let foundSpan: HTMLSpanElement | null = null;
          if (newSpanId) {
            foundSpan = editorEl.querySelector(`span[data-inline-style-id="${newSpanId}"]`) as HTMLSpanElement | null;
            activeInlineSpanRef.current = foundSpan;
          }

          // Update lastSelectionRangeRef to the normalized span's contents
          try {
            const target = foundSpan || span;
            if (editorEl.contains(target)) {
              const r = document.createRange();
              r.selectNodeContents(target);
              lastSelectionRangeRef.current = r.cloneRange();
              // Also restore browser selection
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(r);
            }
          } catch {
            // ignore
          }

          requestAnimationFrame(recomputeFormatState);
          return true;
        }
        
        // HARD STOP: If we had a selection but applyStylesToSelection failed,
        // do NOT fall through to CASE B or block-level formatting.
        // This prevents "whole block becomes bold" when inline wrap fails.
        if (isFormattingToggle) {
          if (import.meta.env.DEV) {
            console.warn('[handleStyleChange] applyStylesToSelection returned null', {
              elementId,
              styleOpts,
              liveSelection: window.getSelection()?.toString()?.slice(0, 60),
              hasSelection,
            });
          }
          toast.info('Could not apply style to selection. Please reselect text.');
          return false;
        }
      }

      // Guard: if remove-mode already handled, exit
      if (didHandleToggle) {
        return true;
      }

      // CASE B: Caret inside existing span (no text selected) → update that span
      if (targetSpan) {
        updateSpanStyle(targetSpan, styleOpts);
        activeInlineSpanRef.current = targetSpan;
        activeInlineSpanIdRef.current = targetSpan.dataset.inlineStyleId || null;
        setSessionHasInlineStyles(true);

        normalizeInlineDom();
        scheduleInlineHtmlSave();
        syncToolbarState();

        requestAnimationFrame(recomputeFormatState);
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
    
    // IMPORTANT: If we tried to apply inline (shouldApplyInline was true) but failed,
    // DON'T fall back to block-level for color/fill properties - this prevents
    // "whole block turns color" when inline styling fails due to lost selection.
    const wasInlineAttempt = shouldApplyInline;
    
    const clonedStyles: Partial<TextStyles> = {};

    if (newStyles.fontSize !== undefined) clonedStyles.fontSize = newStyles.fontSize;
    
    // GUARD: Don't apply fontWeight/fontStyle/textDecoration at block level when this was
    // an inline attempt that failed. This prevents "whole block becomes bold/italic/underline"
    // when the user had a text selection but the inline wrap failed.
    if (!wasInlineAttempt) {
      if (newStyles.fontWeight !== undefined) clonedStyles.fontWeight = newStyles.fontWeight;
      if (newStyles.fontStyle !== undefined) clonedStyles.fontStyle = newStyles.fontStyle;
      if (newStyles.textDecoration !== undefined) clonedStyles.textDecoration = newStyles.textDecoration;
    }
    if (newStyles.textAlign !== undefined) clonedStyles.textAlign = newStyles.textAlign;
    if (newStyles.fontFamily !== undefined) clonedStyles.fontFamily = newStyles.fontFamily;
    
    // Only apply color/fill at block level if this was NOT an inline attempt that failed
    if (!wasInlineAttempt) {
      if (newStyles.textColor !== undefined) clonedStyles.textColor = newStyles.textColor;
      if (newStyles.textFillType !== undefined) clonedStyles.textFillType = newStyles.textFillType;
      if (newStyles.textGradient) {
        clonedStyles.textGradient = cloneGradient(newStyles.textGradient);
      }
    }
    
    if (newStyles.textShadow !== undefined) clonedStyles.textShadow = newStyles.textShadow;
    if (newStyles.highlightColor !== undefined) clonedStyles.highlightColor = newStyles.highlightColor;
    if (newStyles.highlightUseGradient !== undefined) clonedStyles.highlightUseGradient = newStyles.highlightUseGradient;

    if (newStyles.highlightGradient) {
      clonedStyles.highlightGradient = cloneGradient(newStyles.highlightGradient);
    }

    // Only set up default gradient if we're actually applying gradient at block level
    if (!wasInlineAttempt && clonedStyles.textFillType === 'gradient' && !clonedStyles.textGradient && !styles.textGradient) {
      clonedStyles.textGradient = cloneGradient(defaultGradient);
    }
    
    // If nothing to apply at block level, just return
    if (Object.keys(clonedStyles).length === 0) {
      return false;
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

    // Wrapper that captures/restores the user's last in-editor selection OR caret before applying styles.
    // This is critical for B/I/U toggles to work even when no text is selected (caret-only behavior).
    const applyFromInspector = (nextStyles: Partial<TextStyles>): boolean => {
      const el = contentRef.current;
      if (!el) return false;

      // Re-enter editing mode if we were recently editing (within debounce window)
      if (!isEditingRef.current && registeredElementIdRef.current === elementId) {
        setIsEditing(true);
        setShowToolbar(true);
      }

      // STEP 0: Capture live selection/caret BEFORE any focus changes
      const sel = window.getSelection();
      const liveRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

      const isRangeInsideEditor = (r: Range | null) => {
        if (!r) return false;
        try {
          return (
            el.contains(r.startContainer) ||
            el.contains(r.endContainer) ||
            el.contains(r.commonAncestorContainer) ||
            r.startContainer === el ||
            r.endContainer === el
          );
        } catch {
          return false;
        }
      };

      const liveHasTextSelection =
        !!liveRange && !liveRange.collapsed && liveRange.toString().length > 0 && isRangeInsideEditor(liveRange);
      const liveHasCaret = !!liveRange && liveRange.collapsed && isRangeInsideEditor(liveRange);

      if (liveHasTextSelection && liveRange) {
        lastSelectionRangeRef.current = liveRange.cloneRange();
      } else if (liveHasCaret && liveRange) {
        lastCaretRangeRef.current = liveRange.cloneRange();
      }

      // Keep editing active, but don't steal focus from inspector controls (sliders/inputs)
      // Use pointer-lock for long drags, plus time-based fallback and activeElement check
      const activeEl = document.activeElement as HTMLElement | null;
      const pointerDownOnInspector = isPointerDownRef.current && pointerDownContextRef.current === 'inspector';
      const recentlyInteractedWithInspector = Date.now() - lastInspectorInteractionAtRef.current < 800;
      const isInteractingWithInspector =
        pointerDownOnInspector ||
        recentlyInteractedWithInspector ||
        !!activeEl?.closest('.builder-right-panel') ||
        !!activeEl?.closest('[data-radix-popper-content-wrapper]') ||
        !!activeEl?.closest('[data-radix-popover-content]') ||
        !!activeEl?.closest('[data-radix-select-content]');

      if (!isInteractingWithInspector) {
        el.focus();
      }

      // STEP 1: Restore preferred range (selection > caret > last caret > last selection)
      // CRITICAL: Only use saved ranges if they are recent (within 10 seconds)
      const isRecentSelection = Date.now() - lastUserSelectionAtRef.current < 10000;
      const preferredRange: Range | null =
        (liveHasTextSelection ? liveRange : null) ??
        (liveHasCaret ? liveRange : null) ??
        (isRecentSelection ? lastCaretRangeRef.current : null) ??
        (isRecentSelection ? lastSelectionRangeRef.current : null);

      if (sel && preferredRange) {
        try {
          const startValid = el.contains(preferredRange.startContainer) || preferredRange.startContainer === el;
          const endValid = el.contains(preferredRange.endContainer) || preferredRange.endContainer === el;
          if (startValid && endValid) {
            sel.removeAllRanges();
            sel.addRange(preferredRange.cloneRange());
          }
        } catch {
          // ignore
        }
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

      if (span) {
        const spanStyles = getSpanFillStyles(span) as Partial<TextStyles>;
        // Ensure gradient has a value if type is gradient
        if (spanStyles.textFillType === 'gradient' && !spanStyles.textGradient) {
          spanStyles.textGradient = styles.textGradient ?? defaultGradient;
        }
        return spanStyles;
      }
      
      // No styled span - compute from DOM
      const computedColor = getComputedTextColorAtSelection(root);
      if (computedColor) {
        const isTransparent = computedColor === 'transparent' || 
          computedColor === 'rgba(0, 0, 0, 0)' || 
          /rgba?\([^)]*,\s*0\s*\)/.test(computedColor);
        
        if (isTransparent) {
          // Likely gradient text
          return { textFillType: 'gradient', textGradient: styles.textGradient ?? defaultGradient };
        }
        
        // Normalize RGB to hex for consistent display in Right Panel
        let normalizedColor = computedColor;
        const match = computedColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
          normalizedColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }
        
        // Solid color
        return { textFillType: 'solid', textColor: normalizedColor };
      }
      
      return null;
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
  // While we're applying inline spans, the DOM is the source of truth until blur/save.
  // Re-applying innerHTML during an edit session recreates nodes and INVALIDATES Range refs,
  // which makes B/I/U toggles feel "stuck" on the second click.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (!isEditing) {
      lastAppliedHtmlRef.current = '';
      lastAppliedPlainTextRef.current = '';
      if (sessionHasInlineStyles) setSessionHasInlineStyles(false);
      return;
    }

    // CRITICAL: once we are in an inline-style session, do not clobber the live DOM from props.
    // The DOM is already authoritative; the parent `value` updates are just persistence.
    if (sessionHasInlineStyles) return;

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

  // FIX: Always use dangerouslySetInnerHTML for HTML content, even with gradient.
  // The inline spans contain their own styles; blocking this caused "changes don't persist" bug.
  const shouldUseDangerouslySetHtml = !isEditing && !!isHtmlContent;

  // Toolbar UI interactions can collapse the text selection.
  // Restore the last non-collapsed in-editor selection before applying styles.
  const handleToolbarStyleChange = useCallback(
    (nextStyles: Partial<TextStyles>) => {
      const el = contentRef.current;
      if (!el) return;
      
      // Mark toolbar interaction timestamp for blur safety net
      lastToolbarInteractionAtRef.current = Date.now();

      // STEP 1: Capture live selection/caret FIRST before any focus changes.
      // IMPORTANT: if the user only has a caret (collapsed selection), we must NOT
      // blindly restore an older non-collapsed selection, or caret toggles will never work.
      const sel = window.getSelection();
      const liveRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

      const isRangeInsideEditor = (r: Range | null) => {
        if (!r) return false;
        return (
          el.contains(r.startContainer) ||
          el.contains(r.endContainer) ||
          el.contains(r.commonAncestorContainer) ||
          el === r.startContainer ||
          el === r.endContainer
        );
      };

      const liveHasTextSelection =
        !!liveRange &&
        !liveRange.collapsed &&
        liveRange.toString().length > 0 &&
        isRangeInsideEditor(liveRange);

      const liveHasCaret = !!liveRange && liveRange.collapsed && isRangeInsideEditor(liveRange);

      // Snapshot the *right* kind of intent
      if (liveHasTextSelection && liveRange) {
        lastSelectionRangeRef.current = liveRange.cloneRange();
        if (import.meta.env.DEV) {
          console.debug('[Toolbar] Captured live selection:', liveRange.toString().slice(0, 30));
        }
      } else if (liveHasCaret && liveRange) {
        lastCaretRangeRef.current = liveRange.cloneRange();
        if (import.meta.env.DEV) {
          console.debug('[Toolbar] Captured live caret');
        }
      }

      // DO NOT steal focus from sliders/pickers inside the toolbar popovers.
      // Use pointer-lock refs for reliable detection of slider drags (no 800ms timeout limit).
      const activeEl = document.activeElement as HTMLElement | null;
      const isInteractingWithToolbar =
        !!activeEl?.closest('.rich-text-toolbar') ||
        !!activeEl?.closest('[data-radix-popper-content-wrapper]') ||
        !!activeEl?.closest('[data-radix-popover-content]') ||
        !!activeEl?.closest('[data-radix-select-content]');

      // Check if pointer is currently down on toolbar (slider drag in progress)
      const isPointerDownOnToolbar = isPointerDownRef.current && pointerDownContextRef.current === 'toolbar';

      // Also check if any Radix popover is open in the DOM (gradient panel, color picker, etc.)
      const hasOpenPopover = !!document.querySelector(
        '[data-radix-popper-content-wrapper], [data-radix-popover-content], [data-radix-select-content]'
      );

      // Only refocus editor if NOT interacting with toolbar and NOT in a drag
      if (!isInteractingWithToolbar && !isPointerDownOnToolbar && !hasOpenPopover) {
        el.focus();
      }

      // STEP 2: Restore the *correct* range before applying.
      // Prefer live selection, then live caret, then last caret (if recent), then last selection (if recent).
      const isRecentSelection = Date.now() - lastUserSelectionAtRef.current < 10000;
      const preferredRange: Range | null =
        (liveHasTextSelection ? liveRange : null) ??
        (liveHasCaret ? liveRange : null) ??
        (isRecentSelection ? lastCaretRangeRef.current : null) ??
        (isRecentSelection ? lastSelectionRangeRef.current : null);

      if (sel && preferredRange) {
        try {
          const startValid = el.contains(preferredRange.startContainer) || preferredRange.startContainer === el;
          const endValid = el.contains(preferredRange.endContainer) || preferredRange.endContainer === el;

          if (startValid && endValid) {
            sel.removeAllRanges();
            sel.addRange(preferredRange.cloneRange());

            if (import.meta.env.DEV) {
              console.debug('[Toolbar] Range restored', {
                collapsed: preferredRange.collapsed,
                text: preferredRange.toString().slice(0, 30),
              });
            }
          } else if (import.meta.env.DEV) {
            console.debug('[Toolbar] Range restore skipped - endpoints not in editor');
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.debug('[Toolbar] Range restore failed:', err);
          }
        }
      } else if (import.meta.env.DEV) {
        console.debug('[Toolbar] No range to restore');
      }

      const applied = handleStyleChange(nextStyles);
      if (import.meta.env.DEV) {
        console.warn('[Toolbar] onChange applied=', applied, {
          nextStyles,
          liveSelection: window.getSelection()?.toString()?.slice(0, 60),
          savedSelection: lastSelectionRangeRef.current?.toString()?.slice(0, 60),
        });
      }
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

  // Merge block-level styles with selection fill for toolbar display
  // Selection fill takes priority so the toolbar reflects the current selection's appearance
  const toolbarStyles: Partial<TextStyles> = {
    ...styles,
    // Override fill properties with selection-level values when editing
    ...(selectionFill.textFillType !== undefined && { textFillType: selectionFill.textFillType }),
    ...(selectionFill.textColor !== undefined && { textColor: selectionFill.textColor }),
    ...(selectionFill.textGradient !== undefined && { textGradient: selectionFill.textGradient }),
  };

  return (
    <div ref={setContainerRefs} className="relative">
      {/* Floating Rich Text Toolbar */}
      {showToolbar && (
        <RichTextToolbar
          ref={toolbarRef}
          styles={toolbarStyles}
          formatState={selectionFormat}
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
          const isMod = e.metaKey || e.ctrlKey;
          const k = e.key.toLowerCase();

          // Keep formatting in our span-based system (don't let the browser insert <b>/<u>/<i> tags).
          if (isMod && !e.shiftKey && (k === 'b' || k === 'i' || k === 'u')) {
            e.preventDefault();

            // Guaranteed toggle behavior is handled in handleStyleChange (DOM is source of truth).
            if (k === 'b') {
              handleStyleChange({ fontWeight: 'bold' });
            } else if (k === 'i') {
              handleStyleChange({ fontStyle: 'italic' });
            } else if (k === 'u') {
              handleStyleChange({ textDecoration: 'underline' });
            }
            return;
          }

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
            ? 'ring-2 ring-[hsl(var(--builder-accent))] rounded px-1 -mx-1 bg-[hsl(var(--builder-accent)/0.1)]'
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
