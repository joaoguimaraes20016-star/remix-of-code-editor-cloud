import React, { useState, useCallback, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface CommitSliderProps {
  /** Current value from external state */
  value: number;
  /** Called only when user releases the slider (mouseup/touchend) */
  onValueCommit: (value: number) => void;
  /** Optional: also update while dragging (for real-time preview without history) */
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * A slider that commits values only on release, not while dragging.
 * 
 * This prevents:
 * - Rapid history entries during drag
 * - Auto-save spam
 * - Performance issues from too many state updates
 * 
 * Usage:
 * <CommitSlider 
 *   value={fontSize} 
 *   onValueCommit={(v) => handlePropsChange('fontSize', v)}
 *   min={12} max={72} step={1}
 * />
 */
export const CommitSlider: React.FC<CommitSliderProps> = ({
  value,
  onValueCommit,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled = false,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local value with external when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleValueChange = useCallback((newValue: number[]) => {
    setIsDragging(true);
    setLocalValue(newValue[0]);
    // Optionally notify parent for live preview (without history/autosave)
    onValueChange?.(newValue[0]);
  }, [onValueChange]);

  const handleValueCommit = useCallback((newValue: number[]) => {
    setIsDragging(false);
    onValueCommit(newValue[0]);
  }, [onValueCommit]);

  return (
    <Slider
      value={[localValue]}
      onValueChange={handleValueChange}
      onValueCommit={handleValueCommit}
      min={min}
      max={max}
      step={step}
      className={cn('w-full', className)}
      disabled={disabled}
    />
  );
};

export default CommitSlider;
