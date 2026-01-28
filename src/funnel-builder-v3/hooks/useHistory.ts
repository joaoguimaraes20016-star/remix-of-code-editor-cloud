/**
 * Funnel Builder v3 - History Management Hook
 * 
 * Provides undo/redo functionality with debounced snapshots.
 * Max 50 history entries for memory efficiency.
 */

import { useState, useCallback, useRef } from 'react';
import { Funnel } from '../types/funnel';

interface HistoryEntry {
  funnel: Funnel;
  timestamp: number;
  actionLabel?: string;
}

interface HistoryState {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
}

interface UseHistoryOptions {
  maxHistory?: number;
  debounceMs?: number;
}

export interface UseHistoryReturn {
  funnel: Funnel;
  pushState: (funnel: Funnel, actionLabel?: string) => void;
  undo: () => { actionLabel?: string } | null;
  redo: () => { actionLabel?: string } | null;
  canUndo: boolean;
  canRedo: boolean;
  reset: (funnel: Funnel) => void;
  clearHistory: () => void;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function useHistory(
  initialFunnel: Funnel,
  options: UseHistoryOptions = {}
): UseHistoryReturn {
  const { maxHistory = 50, debounceMs = 300 } = options;

  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: { funnel: deepClone(initialFunnel), timestamp: Date.now() },
    future: [],
  }));

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<{ funnel: Funnel; actionLabel?: string } | null>(null);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Flush pending state immediately
  const flushPendingState = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (pendingStateRef.current) {
      const { funnel, actionLabel } = pendingStateRef.current;
      pendingStateRef.current = null;

      setHistory((prev) => {
        // Don't add duplicate states
        if (JSON.stringify(prev.present.funnel) === JSON.stringify(funnel)) {
          return prev;
        }

        const newPast = [...prev.past, prev.present];
        // Trim to max history
        if (newPast.length > maxHistory) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: { funnel: deepClone(funnel), timestamp: Date.now(), actionLabel },
          future: [], // Clear redo stack on new action
        };
      });
    }
  }, [maxHistory]);

  // Push new state with debouncing
  const pushState = useCallback((funnel: Funnel, actionLabel?: string) => {
    pendingStateRef.current = { funnel, actionLabel };

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      flushPendingState();
    }, debounceMs);
  }, [debounceMs, flushPendingState]);

  // Undo - go back one state
  const undo = useCallback(() => {
    // Flush any pending state first
    flushPendingState();

    let undoneAction: { actionLabel?: string } | null = null;

    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previous = newPast.pop()!;

      undoneAction = { actionLabel: prev.present.actionLabel };

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });

    return undoneAction;
  }, [flushPendingState]);

  // Redo - go forward one state
  const redo = useCallback(() => {
    let redoneAction: { actionLabel?: string } | null = null;

    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const next = newFuture.shift()!;

      redoneAction = { actionLabel: next.actionLabel };

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });

    return redoneAction;
  }, []);

  // Reset history with new funnel
  const reset = useCallback((funnel: Funnel) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingStateRef.current = null;

    setHistory({
      past: [],
      present: { funnel: deepClone(funnel), timestamp: Date.now() },
      future: [],
    });
  }, []);

  // Clear history but keep current state
  const clearHistory = useCallback(() => {
    setHistory((prev) => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  return {
    funnel: history.present.funnel,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    clearHistory,
  };
}
