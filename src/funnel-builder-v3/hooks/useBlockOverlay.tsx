import React, { useState, ReactNode } from 'react';
import { Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';

interface UseBlockOverlayOptions {
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
  blockType: string;
  // Disable overlay when block has active editing
  isEditing?: boolean;
  // Custom hint text
  hintText?: string;
  // For embedded elements (like video in VideoQuestionBlock), select child element instead of block
  isEmbedded?: boolean;
  childElementId?: string; // ID of child element to select when embedded (e.g., 'video')
  // Disable overlay when child element is selected (for embedded mode)
  isChildSelected?: boolean;
}

export function useBlockOverlay(options: UseBlockOverlayOptions) {
  const { 
    blockId, 
    stepId, 
    isPreview, 
    blockType, 
    isEditing, 
    hintText,
    isEmbedded,
    childElementId,
    isChildSelected
  } = options;
  const funnelContext = useFunnelOptional();
  const setSelectedChildElement = funnelContext?.setSelectedChildElement ?? (() => {});
  const [isHovered, setIsHovered] = useState(false);
  
  const canEdit = blockId && stepId && !isPreview;
  const shouldShowOverlay = canEdit && !isEditing && !isChildSelected;
  
  const wrapWithOverlay = (element: ReactNode) => {
    if (!shouldShowOverlay) return element;
    
    return (
      <div
        className={cn(
          'relative',
          isChildSelected && 'ring-2 ring-primary ring-offset-2 rounded-lg'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (isEmbedded && childElementId) {
              // For embedded elements, select the child element
              setSelectedChildElement(childElementId);
            } else if (blockId) {
              // For standalone blocks, select the block
              funnelContext?.setSelectedBlockId(blockId);
            }
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={cn(
            'absolute inset-0 z-10 cursor-pointer rounded-lg transition-all',
            isHovered && 'bg-primary/5 ring-2 ring-primary/30',
            isChildSelected && 'pointer-events-none'
          )}
          style={{ pointerEvents: isChildSelected ? 'none' : 'auto' }}
        >
          {/* Hover hint */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none",
            isHovered ? 'opacity-100' : 'opacity-0'
          )}>
            <div className="bg-background/95 px-3 py-1.5 rounded-lg shadow-lg border border-primary/20">
              <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Edit3 className="h-3 w-3" />
                {hintText || `Click to edit ${blockType}`}
              </span>
            </div>
          </div>
        </div>
        {element}
      </div>
    );
  };
  
  return { wrapWithOverlay, isHovered };
}
