/**
 * Context to bridge Right Panel style changes with InlineTextEditor
 * When a user has text selected and uses the Right Panel to change color/gradient,
 * this context routes those changes through InlineTextEditor's selection-aware logic.
 */

import React, { createContext, useContext, useCallback, useRef } from 'react';
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
}

const InlineEditContext = createContext<InlineEditContextValue | null>(null);

export function InlineEditProvider({ children }: { children: React.ReactNode }) {
  // Map of elementId -> editor bridge
  const editorsRef = useRef<Map<string, EditorBridge>>(new Map());

  const registerEditor = useCallback((elementId: string, bridge: EditorBridge) => {
    editorsRef.current.set(elementId, bridge);
    return () => {
      editorsRef.current.delete(elementId);
    };
  }, []);

  const applyInlineStyle = useCallback((elementId: string, styles: Partial<TextStyles>): boolean => {
    const bridge = editorsRef.current.get(elementId);
    if (bridge) {
      return bridge.apply(styles);
    }
    return false;
  }, []);

  const getInlineSelectionStyles = useCallback((elementId: string): Partial<TextStyles> | null => {
    const bridge = editorsRef.current.get(elementId);
    return bridge?.getSelectionStyles?.() ?? null;
  }, []);

  const hasActiveEditor = useCallback((elementId: string): boolean => {
    return editorsRef.current.has(elementId);
  }, []);

  return (
    <InlineEditContext.Provider value={{ registerEditor, applyInlineStyle, getInlineSelectionStyles, hasActiveEditor }}>
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
    };
  }
  return ctx;
}
