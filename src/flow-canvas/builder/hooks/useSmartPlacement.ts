/**
 * useSmartPlacement - Intelligent toolbar/action bar positioning
 * 
 * Features:
 * - Auto-detects if toolbar would overflow device-frame bounds
 * - Flips to inside (prefer-inside strategy) when near edges
 * - Supports session-only manual drag repositioning
 * - Returns position offset and drag handlers
 */

import { useState, useLayoutEffect, useCallback, useRef } from 'react';

export type PlacementSide = 'left' | 'right' | 'top' | 'bottom';
export type PlacementStrategy = 'prefer-inside' | 'prefer-outside';

interface SmartPlacementOptions {
  /** Preferred initial side */
  preferredSide: PlacementSide;
  /** Strategy when near edges */
  strategy?: PlacementStrategy;
  /** Padding from frame edge */
  edgePadding?: number;
  /** Enable manual dragging */
  draggable?: boolean;
  /** Unique key for this placement (used for drag state) */
  placementKey?: string;
}

interface SmartPlacementResult {
  /** Ref to attach to the positioned element */
  ref: React.RefCallback<HTMLElement>;
  /** Computed side after smart placement */
  computedSide: PlacementSide;
  /** Manual offset from dragging */
  manualOffset: { x: number; y: number };
  /** Whether currently being dragged */
  isDragging: boolean;
  /** Props to spread on drag handle */
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    style: React.CSSProperties;
  };
  /** Reset manual position */
  resetPosition: () => void;
  /** Style object to apply for positioning */
  positionStyle: React.CSSProperties;
  /** Class names for positioning */
  positionClasses: string;
}

// Session storage for manual offsets (reset on refresh)
const manualOffsets = new Map<string, { x: number; y: number }>();

export function useSmartPlacement(options: SmartPlacementOptions): SmartPlacementResult {
  const {
    preferredSide,
    strategy = 'prefer-inside',
    edgePadding = 8,
    draggable = true,
    placementKey = 'default',
  } = options;

  const elementRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLElement | null>(null);
  
  const [computedSide, setComputedSide] = useState<PlacementSide>(preferredSide);
  const [manualOffset, setManualOffset] = useState<{ x: number; y: number }>(
    manualOffsets.get(placementKey) || { x: 0, y: 0 }
  );
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartPos = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  // Ref callback to capture element and find frame
  const ref = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
    if (node) {
      frameRef.current = node.closest('.device-frame') as HTMLElement | null;
    }
  }, []);

  // Compute optimal side based on available space
  useLayoutEffect(() => {
    const el = elementRef.current;
    const frame = frameRef.current;
    if (!el || !frame) return;

    const compute = () => {
      const frameRect = frame.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      
      // For prefer-inside strategy, check if preferred side would clip
      if (strategy === 'prefer-inside') {
        let newSide = preferredSide;
        
        if (preferredSide === 'left') {
          // Check if left side would clip outside frame
          if (elRect.left < frameRect.left + edgePadding) {
            newSide = 'right'; // Flip to inside (right side of element = inside frame)
          }
        } else if (preferredSide === 'right') {
          if (elRect.right > frameRect.right - edgePadding) {
            newSide = 'left';
          }
        } else if (preferredSide === 'top') {
          if (elRect.top < frameRect.top + edgePadding) {
            newSide = 'bottom';
          }
        } else if (preferredSide === 'bottom') {
          if (elRect.bottom > frameRect.bottom - edgePadding) {
            newSide = 'top';
          }
        }
        
        setComputedSide(newSide);
      }
    };

    // Initial compute
    compute();

    // Recompute on resize
    const ro = new ResizeObserver(compute);
    ro.observe(frame);
    
    return () => ro.disconnect();
  }, [preferredSide, strategy, edgePadding, placementKey]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: manualOffset.x,
      offsetY: manualOffset.y,
    };

    const handleMouseMove = (moveE: MouseEvent) => {
      if (!dragStartPos.current) return;
      
      const dx = moveE.clientX - dragStartPos.current.x;
      const dy = moveE.clientY - dragStartPos.current.y;
      
      const newOffset = {
        x: dragStartPos.current.offsetX + dx,
        y: dragStartPos.current.offsetY + dy,
      };
      
      setManualOffset(newOffset);
      manualOffsets.set(placementKey, newOffset);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartPos.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [draggable, manualOffset, placementKey]);

  const resetPosition = useCallback(() => {
    setManualOffset({ x: 0, y: 0 });
    manualOffsets.delete(placementKey);
  }, [placementKey]);

  // Generate position classes based on computed side
  const getPositionClasses = (): string => {
    // For "prefer-inside", we position INSIDE the parent element
    switch (computedSide) {
      case 'left':
        return 'absolute left-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'absolute right-2 top-1/2 -translate-y-1/2';
      case 'top':
        return 'absolute top-2 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'absolute bottom-2 left-1/2 -translate-x-1/2';
      default:
        return 'absolute left-2 top-1/2 -translate-y-1/2';
    }
  };

  // Manual offset style
  const positionStyle: React.CSSProperties = {
    transform: manualOffset.x !== 0 || manualOffset.y !== 0
      ? `translate(${manualOffset.x}px, ${manualOffset.y}px)`
      : undefined,
  };

  return {
    ref,
    computedSide,
    manualOffset,
    isDragging,
    dragHandleProps: {
      onMouseDown: handleMouseDown,
      style: { cursor: isDragging ? 'grabbing' : 'grab' },
    },
    resetPosition,
    positionStyle,
    positionClasses: getPositionClasses(),
  };
}
