/**
 * Context to bridge Right Panel style changes with InlineTextEditor
 * When a user has text selected and uses the Right Panel to change color/gradient,
 * this context routes those changes through InlineTextEditor's selection-aware logic.
 */

import React, { createContext, useContext, useCallback, useRef } from 'react';
import type { TextStyles } from '../components/InlineTextEditor';

type StyleChangeHandler = (styles: Partial<TextStyles>) => boolean;

interface InlineEditContextValue {
  /**
   * Register an active InlineTextEditor's handleStyleChange function.
   * Returns an unregister function.
   */
  registerEditor: (elementId: string, handler: StyleChangeHandler) => () => void;
  
  /**
   * Apply styles to the currently active editor's selection.
   * Returns true if an editor handled the change, false otherwise.
   */
  applyInlineStyle: (elementId: string, styles: Partial<TextStyles>) => boolean;
  
  /**
   * Check if an editor is currently active with a selection for a given element.
   */
  hasActiveEditor: (elementId: string) => boolean;
}

const InlineEditContext = createContext<InlineEditContextValue | null>(null);

export function InlineEditProvider({ children }: { children: React.ReactNode }) {
  // Map of elementId -> styleChangeHandler
  const editorsRef = useRef<Map<string, StyleChangeHandler>>(new Map());
  
  const registerEditor = useCallback((elementId: string, handler: StyleChangeHandler) => {
    editorsRef.current.set(elementId, handler);
    return () => {
      editorsRef.current.delete(elementId);
    };
  }, []);
  
  const applyInlineStyle = useCallback((elementId: string, styles: Partial<TextStyles>): boolean => {
    const handler = editorsRef.current.get(elementId);
    if (handler) {
      return handler(styles);
    }
    return false;
  }, []);
  
  const hasActiveEditor = useCallback((elementId: string): boolean => {
    return editorsRef.current.has(elementId);
  }, []);
  
  return (
    <InlineEditContext.Provider value={{ registerEditor, applyInlineStyle, hasActiveEditor }}>
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
      hasActiveEditor: () => false,
    };
  }
  return ctx;
}
