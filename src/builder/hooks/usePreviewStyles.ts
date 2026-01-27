/**
 * usePreviewStyles - Live preview state for slider feedback
 * 
 * Manages temporary preview values that apply instantly during slider drag
 * without committing to the permanent element state.
 */

import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface PreviewValue {
  value: unknown;
  timestamp: number;
}

interface PreviewState {
  [elementId: string]: {
    [property: string]: PreviewValue;
  };
}

interface UsePreviewStylesReturn {
  setPreview: (elementId: string, property: string, value: unknown) => void;
  clearPreview: (elementId: string, property?: string) => void;
  clearAllPreviews: () => void;
  getPreviewValue: <T>(elementId: string, property: string, fallback: T) => T;
  hasPreview: (elementId: string, property?: string) => boolean;
  getPreviewProps: (elementId: string) => Record<string, unknown>;
}

// ============================================================================
// PREVIEW CONTEXT
// ============================================================================

const PreviewContext = createContext<UsePreviewStylesReturn | null>(null);

export function usePreviewContext(): UsePreviewStylesReturn {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreviewContext must be used within a PreviewStylesProvider');
  }
  return context;
}

export { PreviewContext };

// ============================================================================
// MAIN HOOK
// ============================================================================

const PREVIEW_TIMEOUT_MS = 5000;

export function usePreviewStyles(): UsePreviewStylesReturn {
  const [previews, setPreviews] = useState<PreviewState>({});
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkStale = () => {
      const now = Date.now();
      setPreviews((current) => {
        const updated: PreviewState = {};
        let hasChanges = false;
        
        for (const [elementId, properties] of Object.entries(current)) {
          const validProperties: Record<string, PreviewValue> = {};
          
          for (const [prop, previewValue] of Object.entries(properties)) {
            if (now - previewValue.timestamp < PREVIEW_TIMEOUT_MS) {
              validProperties[prop] = previewValue;
            } else {
              hasChanges = true;
            }
          }
          
          if (Object.keys(validProperties).length > 0) {
            updated[elementId] = validProperties;
          } else {
            hasChanges = true;
          }
        }
        
        return hasChanges ? updated : current;
      });
    };

    const interval = setInterval(checkStale, 1000);
    return () => clearInterval(interval);
  }, []);

  const setPreview = useCallback((elementId: string, property: string, value: unknown) => {
    setPreviews((current) => ({
      ...current,
      [elementId]: {
        ...current[elementId],
        [property]: {
          value,
          timestamp: Date.now(),
        },
      },
    }));

    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
  }, []);

  const clearPreview = useCallback((elementId: string, property?: string) => {
    setPreviews((current) => {
      if (!current[elementId]) return current;
      
      if (property) {
        const { [property]: _, ...rest } = current[elementId];
        if (Object.keys(rest).length === 0) {
          const { [elementId]: __, ...remaining } = current;
          return remaining;
        }
        return { ...current, [elementId]: rest };
      } else {
        const { [elementId]: _, ...rest } = current;
        return rest;
      }
    });
  }, []);

  const clearAllPreviews = useCallback(() => {
    setPreviews({});
  }, []);

  const getPreviewValue = useCallback(function<T>(elementId: string, property: string, fallback: T): T {
    const preview = previews[elementId]?.[property];
    if (preview) {
      return preview.value as T;
    }
    return fallback;
  }, [previews]);

  const hasPreview = useCallback((elementId: string, property?: string): boolean => {
    if (!previews[elementId]) return false;
    if (property) {
      return property in previews[elementId];
    }
    return Object.keys(previews[elementId]).length > 0;
  }, [previews]);

  const getPreviewProps = useCallback((elementId: string): Record<string, unknown> => {
    const elementPreviews = previews[elementId];
    if (!elementPreviews) return {};
    
    const result: Record<string, unknown> = {};
    for (const [prop, previewValue] of Object.entries(elementPreviews)) {
      result[prop] = previewValue.value;
    }
    return result;
  }, [previews]);

  return {
    setPreview,
    clearPreview,
    clearAllPreviews,
    getPreviewValue,
    hasPreview,
    getPreviewProps,
  };
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface PreviewStylesProviderProps {
  children: React.ReactNode;
}

export function PreviewStylesProvider({ children }: PreviewStylesProviderProps) {
  const previewStyles = usePreviewStyles();
  
  return React.createElement(
    PreviewContext.Provider,
    { value: previewStyles },
    children
  );
}

// ============================================================================
// HELPER HOOK FOR SLIDER INTEGRATION
// ============================================================================

export function useSliderPreview(
  elementId: string,
  property: string,
  committedValue: number,
  onCommit: (value: number) => void
): {
  displayValue: number;
  handleChange: (value: number) => void;
  handleCommit: (value: number) => void;
} {
  const { setPreview, clearPreview, getPreviewValue } = usePreviewStyles();
  
  const displayValue = getPreviewValue(elementId, property, committedValue);
  
  const handleChange = useCallback((value: number) => {
    setPreview(elementId, property, value);
  }, [elementId, property, setPreview]);
  
  const handleCommit = useCallback((value: number) => {
    clearPreview(elementId, property);
    onCommit(value);
  }, [elementId, property, clearPreview, onCommit]);
  
  return {
    displayValue,
    handleChange,
    handleCommit,
  };
}
