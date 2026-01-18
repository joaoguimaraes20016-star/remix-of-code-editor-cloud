/**
 * Context to bridge Right Panel style changes with InlineTextEditor
 * When a user has text selected and uses the Right Panel to change color/gradient,
 * this context routes those changes through InlineTextEditor's selection-aware logic.
 * 
 * Phase 5 Improvements:
 * - Added selection change notification for better Right Panel sync
 * - Added active element tracking for debugging
 * - Improved bridge cleanup handling
 */

import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import type { TextStyles } from '../components/InlineTextEditor';

type StyleChangeHandler = (styles: Partial<TextStyles>) => boolean;

type SelectionStylesGetter = () => Partial<TextStyles> | null;

type EditorBridge = {
  apply: StyleChangeHandler;
  getSelectionStyles: SelectionStylesGetter;
};

interface InlineEditContextValue {
  /**
   * Register an active InlineTextEditor bridge.
   * Returns an unregister function.
   */
  registerEditor: (elementId: string, bridge: EditorBridge) => () => void;

  /**
   * Apply styles to the currently active editor's selection.
   * Returns true if an editor handled the change, false otherwise.
   */
  applyInlineStyle: (elementId: string, styles: Partial<TextStyles>) => boolean;

  /**
   * Read the currently selected span's styles (if any).
   * Used to keep Right Panel + floating toolbar in sync with the actual selection.
   */
  getInlineSelectionStyles: (elementId: string) => Partial<TextStyles> | null;

  /**
   * Check if an editor is currently active for a given element.
   */
  hasActiveEditor: (elementId: string) => boolean;

  /**
   * Get the currently active element ID (if any).
   * Useful for debugging and conditional rendering.
   */
  getActiveElementId: () => string | null;

  /**
   * Subscribe to selection changes within active editors.
   * Returns an unsubscribe function.
   */
  onSelectionChange: (callback: (elementId: string) => void) => () => void;

  /**
   * Notify listeners that selection has changed in an editor.
   * Called by InlineTextEditor when selection changes.
   */
  notifySelectionChange: (elementId: string) => void;

  /**
   * Close all other active editors except the one with the given ID.
   * Call this when a new editor is about to activate.
   */
  closeOtherEditors: (exceptElementId: string) => void;

  /**
   * Subscribe to "close me" requests.
   * Returns an unsubscribe function.
   */
  onCloseRequest: (elementId: string, callback: () => void) => () => void;
}

const InlineEditContext = createContext<InlineEditContextValue | null>(null);

export function InlineEditProvider({ children }: { children: React.ReactNode }) {
  // Map of elementId -> editor bridge
  const editorsRef = useRef<Map<string, EditorBridge>>(new Map());
  
  // Track selection change listeners
  const selectionListenersRef = useRef<Set<(elementId: string) => void>>(new Set());
  
  // Track close request listeners (for single-active-editor enforcement)
  const closeListenersRef = useRef<Map<string, () => void>>(new Map());
  
  // Track the most recently active editor for debugging
  const lastActiveElementRef = useRef<string | null>(null);
  
  // Track the most recently activated sub-editor ID (for deterministic findBridge)
  const activeSubEditorRef = useRef<string | null>(null);

  const registerEditor = useCallback((elementId: string, bridge: EditorBridge) => {
    editorsRef.current.set(elementId, bridge);
    lastActiveElementRef.current = elementId;
    activeSubEditorRef.current = elementId; // Track most recent for deterministic targeting
    
    return () => {
      // Only remove if it's still the same bridge (prevents race conditions)
      if (editorsRef.current.get(elementId) === bridge) {
        editorsRef.current.delete(elementId);
        if (lastActiveElementRef.current === elementId) {
          // Set to next active or null
          const remaining = Array.from(editorsRef.current.keys());
          lastActiveElementRef.current = remaining[0] ?? null;
        }
        if (activeSubEditorRef.current === elementId) {
          activeSubEditorRef.current = null;
        }
      }
    };
  }, []);

  /**
   * Find an editor bridge by elementId or any sub-ID matching pattern ${elementId}-*
   * This allows Right Panel to work with sub-element inline editors (e.g., stat-number, badge)
   * Prefers the most recently activated sub-editor for deterministic targeting.
   */
  const findBridge = useCallback((elementId: string): { bridge: EditorBridge; actualId: string } | null => {
    // Direct match
    const directBridge = editorsRef.current.get(elementId);
    if (directBridge) {
      return { bridge: directBridge, actualId: elementId };
    }
    
    // Prefer the active sub-editor if it matches the requested elementId prefix
    if (activeSubEditorRef.current?.startsWith(`${elementId}-`)) {
      const activeBridge = editorsRef.current.get(activeSubEditorRef.current);
      if (activeBridge) {
        return { bridge: activeBridge, actualId: activeSubEditorRef.current };
      }
    }
    
    // Fall back to first matching sub-ID
    for (const [registeredId, bridge] of editorsRef.current.entries()) {
      if (registeredId.startsWith(`${elementId}-`)) {
        return { bridge, actualId: registeredId };
      }
    }
    
    return null;
  }, []);

  const applyInlineStyle = useCallback((elementId: string, styles: Partial<TextStyles>): boolean => {
    const found = findBridge(elementId);
    if (found) {
      return found.bridge.apply(styles);
    }
    return false;
  }, [findBridge]);

  const getInlineSelectionStyles = useCallback((elementId: string): Partial<TextStyles> | null => {
    const found = findBridge(elementId);
    return found?.bridge.getSelectionStyles?.() ?? null;
  }, [findBridge]);

  const hasActiveEditor = useCallback((elementId: string): boolean => {
    // Direct match
    if (editorsRef.current.has(elementId)) return true;
    
    // Check for sub-ID matches
    for (const registeredId of editorsRef.current.keys()) {
      if (registeredId.startsWith(`${elementId}-`)) {
        return true;
      }
    }
    
    return false;
  }, []);

  const getActiveElementId = useCallback((): string | null => {
    return lastActiveElementRef.current;
  }, []);

  const onSelectionChange = useCallback((callback: (elementId: string) => void): (() => void) => {
    selectionListenersRef.current.add(callback);
    return () => {
      selectionListenersRef.current.delete(callback);
    };
  }, []);

  const notifySelectionChange = useCallback((elementId: string): void => {
    selectionListenersRef.current.forEach(callback => {
      try {
        callback(elementId);
      } catch (err) {
        console.error('[InlineEditContext] Selection listener error:', err);
      }
    });
  }, []);

  /**
   * Close all other active editors except the one with the given ID.
   * This enforces single-active-editor behavior.
   */
  const closeOtherEditors = useCallback((exceptElementId: string): void => {
    closeListenersRef.current.forEach((callback, registeredId) => {
      if (registeredId !== exceptElementId) {
        try {
          callback();
        } catch (err) {
          console.error('[InlineEditContext] Close listener error:', err);
        }
      }
    });
  }, []);

  /**
   * Register a close request callback for a specific element.
   * Returns an unsubscribe function.
   */
  const onCloseRequest = useCallback((elementId: string, callback: () => void): (() => void) => {
    closeListenersRef.current.set(elementId, callback);
    return () => {
      closeListenersRef.current.delete(elementId);
    };
  }, []);

  return (
    <InlineEditContext.Provider value={{ 
      registerEditor, 
      applyInlineStyle, 
      getInlineSelectionStyles, 
      hasActiveEditor,
      getActiveElementId,
      onSelectionChange,
      notifySelectionChange,
      closeOtherEditors,
      onCloseRequest,
    }}>
      {children}
    </InlineEditContext.Provider>
  );
}

export function useInlineEdit() {
  const ctx = useContext(InlineEditContext);
  if (!ctx) {
    // Return a no-op version when not inside provider (for standalone usage)
    return {
      registerEditor: () => () => {},
      applyInlineStyle: () => false,
      getInlineSelectionStyles: () => null,
      hasActiveEditor: () => false,
      getActiveElementId: () => null,
      onSelectionChange: () => () => {},
      notifySelectionChange: () => {},
      closeOtherEditors: () => {},
      onCloseRequest: () => () => {},
    };
  }
  return ctx;
}

/**
 * Hook to subscribe to selection changes in a specific editor.
 * Re-renders when selection changes occur.
 * Matches both exact elementId and sub-IDs (e.g., element-123 matches element-123-number).
 */
export function useInlineSelectionSync(elementId: string): number {
  const { onSelectionChange, hasActiveEditor } = useInlineEdit();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!hasActiveEditor(elementId)) return;

    const unsubscribe = onSelectionChange((changedId) => {
      // Match exact ID OR any sub-ID (e.g., element-123-number matches element-123)
      if (changedId === elementId || changedId.startsWith(`${elementId}-`)) {
        setTick(t => t + 1);
      }
    });

    return unsubscribe;
  }, [elementId, onSelectionChange, hasActiveEditor]);

  return tick;
}
