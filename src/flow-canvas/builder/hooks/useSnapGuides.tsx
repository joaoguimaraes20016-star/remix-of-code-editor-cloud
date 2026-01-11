import { useState, useCallback, useMemo } from 'react';

export interface SnapGuide {
  type: 'horizontal' | 'vertical';
  position: number; // px from left (vertical) or top (horizontal)
  label?: string;
}

export interface SnapGuidesState {
  guides: SnapGuide[];
  isActive: boolean;
  draggedElementId: string | null;
}

interface ElementBounds {
  id: string;
  top: number;
  left: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

const SNAP_THRESHOLD = 8; // pixels

export function useSnapGuides() {
  const [state, setState] = useState<SnapGuidesState>({
    guides: [],
    isActive: false,
    draggedElementId: null,
  });

  const startDrag = useCallback((elementId: string) => {
    setState({
      guides: [],
      isActive: true,
      draggedElementId: elementId,
    });
  }, []);

  const endDrag = useCallback(() => {
    setState({
      guides: [],
      isActive: false,
      draggedElementId: null,
    });
  }, []);

  const updateGuides = useCallback((
    draggedBounds: ElementBounds,
    siblingBounds: ElementBounds[],
    containerBounds: DOMRect
  ) => {
    if (!state.isActive) return;

    const guides: SnapGuide[] = [];
    const containerCenterX = containerBounds.left + containerBounds.width / 2;
    const containerCenterY = containerBounds.top + containerBounds.height / 2;

    // Check center alignment with container
    if (Math.abs(draggedBounds.centerX - containerCenterX) < SNAP_THRESHOLD) {
      guides.push({
        type: 'vertical',
        position: containerCenterX,
        label: 'Center',
      });
    }

    // Check alignment with siblings
    for (const sibling of siblingBounds) {
      if (sibling.id === draggedBounds.id) continue;

      // Vertical guides (left, center, right alignment)
      if (Math.abs(draggedBounds.left - sibling.left) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: sibling.left });
      }
      if (Math.abs(draggedBounds.centerX - sibling.centerX) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: sibling.centerX });
      }
      if (Math.abs(draggedBounds.right - sibling.right) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: sibling.right });
      }

      // Horizontal guides (top, center, bottom alignment)
      if (Math.abs(draggedBounds.top - sibling.top) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: sibling.top });
      }
      if (Math.abs(draggedBounds.centerY - sibling.centerY) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: sibling.centerY });
      }
      if (Math.abs(draggedBounds.bottom - sibling.bottom) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: sibling.bottom });
      }

      // Spacing guides (equal distances)
      const gapTop = draggedBounds.top - sibling.bottom;
      const gapBottom = sibling.top - draggedBounds.bottom;
      
      if (gapTop > 0 && gapTop < 100) {
        // Could show spacing indicator
      }
    }

    // Dedupe guides by position
    const uniqueGuides = guides.filter((guide, index, arr) => 
      arr.findIndex(g => g.type === guide.type && Math.abs(g.position - guide.position) < 2) === index
    );

    setState(prev => ({ ...prev, guides: uniqueGuides }));
  }, [state.isActive]);

  const clearGuides = useCallback(() => {
    setState(prev => ({ ...prev, guides: [] }));
  }, []);

  return {
    ...state,
    startDrag,
    endDrag,
    updateGuides,
    clearGuides,
  };
}

// Snap guides overlay component
export const SnapGuidesOverlay: React.FC<{
  guides: SnapGuide[];
  containerRef?: React.RefObject<HTMLElement>;
}> = ({ guides, containerRef }) => {
  if (guides.length === 0) return null;

  const containerRect = containerRef?.current?.getBoundingClientRect();

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998]">
      {guides.map((guide, i) => (
        <div
          key={`${guide.type}-${guide.position}-${i}`}
          className={cn(
            "absolute",
            guide.type === 'vertical' 
              ? "w-px h-full top-0" 
              : "h-px w-full left-0"
          )}
          style={{
            [guide.type === 'vertical' ? 'left' : 'top']: guide.position,
            background: 'linear-gradient(to bottom, transparent, hsl(var(--builder-accent)), transparent)',
          }}
        >
          {guide.label && (
            <div 
              className={cn(
                "absolute px-1.5 py-0.5 rounded text-[10px] font-medium",
                "bg-[hsl(var(--builder-accent))] text-white",
                guide.type === 'vertical' 
                  ? "top-2 left-1/2 -translate-x-1/2" 
                  : "left-2 top-1/2 -translate-y-1/2"
              )}
            >
              {guide.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default useSnapGuides;
