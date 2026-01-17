import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for slider commit pattern - prevents rapid state updates while dragging.
 * 
 * Usage:
 * const { localValue, setLocalValue, handleCommit } = useSliderCommit(
 *   currentValue, 
 *   (value) => handlePropsChange('fontSize', value)
 * );
 * 
 * <Slider 
 *   value={[localValue]}
 *   onValueChange={([v]) => setLocalValue(v)}
 *   onValueCommit={([v]) => handleCommit(v)}
 * />
 * 
 * This ensures:
 * - Smooth UI updates while dragging (local state)
 * - Single history entry on mouse up (commit)
 * - Auto-save only triggered on commit
 */
export function useSliderCommit<T extends number>(
  externalValue: T,
  onCommit: (value: T) => void
): {
  localValue: T;
  setLocalValue: (value: T) => void;
  handleCommit: (value: T) => void;
} {
  const [localValue, setLocalValue] = useState<T>(externalValue);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local value with external when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(externalValue);
    }
  }, [externalValue, isDragging]);

  const handleSetLocalValue = useCallback((value: T) => {
    setIsDragging(true);
    setLocalValue(value);
  }, []);

  const handleCommit = useCallback((value: T) => {
    setIsDragging(false);
    onCommit(value);
  }, [onCommit]);

  return {
    localValue,
    setLocalValue: handleSetLocalValue,
    handleCommit,
  };
}

/**
 * Multi-value version for sliders with multiple thumbs
 */
export function useSliderCommitMulti<T extends number[]>(
  externalValue: T,
  onCommit: (value: T) => void
): {
  localValue: T;
  setLocalValue: (value: T) => void;
  handleCommit: (value: T) => void;
} {
  const [localValue, setLocalValue] = useState<T>(externalValue);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(externalValue);
    }
  }, [externalValue, isDragging]);

  const handleSetLocalValue = useCallback((value: T) => {
    setIsDragging(true);
    setLocalValue(value);
  }, []);

  const handleCommit = useCallback((value: T) => {
    setIsDragging(false);
    onCommit(value);
  }, [onCommit]);

  return {
    localValue,
    setLocalValue: handleSetLocalValue,
    handleCommit,
  };
}
