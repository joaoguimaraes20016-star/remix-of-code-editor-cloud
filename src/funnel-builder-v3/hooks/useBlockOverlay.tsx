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
  
  // Check if an element is interactive (should not be blocked by overlay)
  const isInteractiveElement = (element: Element | null): boolean => {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const interactiveTags = ['button', 'input', 'select', 'textarea', 'a', 'label'];
    
    // Check if it's an interactive tag
    if (interactiveTags.includes(tagName)) return true;
    
    // Check if it has an interactive role
    const role = element.getAttribute('role');
    if (role && ['button', 'link', 'textbox', 'combobox', 'option'].includes(role)) return true;
    
    // Check if it's inside an interactive element
    const closestInteractive = element.closest('button, input, select, textarea, a, label, [role="button"], [role="link"], [contenteditable="true"]');
    if (closestInteractive && closestInteractive !== element) return true;
    
    // Check if it's contenteditable
    if (element.hasAttribute('contenteditable') || element.closest('[contenteditable]')) return true;
    
    return false;
  };

  const wrapWithOverlay = (element: ReactNode) => {
    if (!shouldShowOverlay) return element;
    
    return (
      <div
        className={cn(
          'relative',
          isChildSelected && 'ring-2 ring-primary ring-offset-2 rounded-lg'
        )}
        data-overlay-wrapper="true"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          onClick={(e) => {
            const overlayEl = e.currentTarget as HTMLElement;
            
            // Temporarily disable pointer events to see what's underneath
            const originalPointerEvents = overlayEl.style.pointerEvents;
            overlayEl.style.pointerEvents = 'none';
            
            // Get the element underneath at the click coordinates
            const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
            
            // Restore pointer events
            overlayEl.style.pointerEvents = originalPointerEvents;
            
            // Check if the element underneath is interactive
            if (elementUnder && elementUnder instanceof Element) {
              // Walk up the DOM tree to find interactive elements
              let currentElement: Element | null = elementUnder;
              let foundInteractive = false;
              
              // Check the element itself and all parents up to the overlay wrapper
              const wrapper = overlayEl.closest('[data-overlay-wrapper]');
              while (currentElement && currentElement !== wrapper) {
                if (isInteractiveElement(currentElement)) {
                  foundInteractive = true;
                  break;
                }
                currentElement = currentElement.parentElement;
              }
              
              // If an interactive element was clicked, don't block it
              if (foundInteractive) {
                // Create a new click event and dispatch it on the interactive element
                const clickEvent = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  clientX: e.clientX,
                  clientY: e.clientY,
                  button: e.button,
                  buttons: e.buttons,
                });
                elementUnder.dispatchEvent(clickEvent);
                return; // Don't handle the overlay click
              }
            }
            
            // Only handle clicks on non-interactive areas (empty space)
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
            const overlayEl = e.currentTarget as HTMLElement;
            
            // Temporarily disable pointer events to see what's underneath
            const originalPointerEvents = overlayEl.style.pointerEvents;
            overlayEl.style.pointerEvents = 'none';
            
            // Get the element underneath at the click coordinates
            const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
            
            // Restore pointer events
            overlayEl.style.pointerEvents = originalPointerEvents;
            
            // Check if the element underneath is interactive
            if (elementUnder && elementUnder instanceof Element) {
              let currentElement: Element | null = elementUnder;
              let foundInteractive = false;
              
              const wrapper = overlayEl.closest('[data-overlay-wrapper]');
              while (currentElement && currentElement !== wrapper) {
                if (isInteractiveElement(currentElement)) {
                  foundInteractive = true;
                  break;
                }
                currentElement = currentElement.parentElement;
              }
              
              // If an interactive element was clicked, don't block it
              if (foundInteractive) {
                // Dispatch mousedown event to the interactive element
                const mouseDownEvent = new MouseEvent('mousedown', {
                  bubbles: true,
                  cancelable: true,
                  clientX: e.clientX,
                  clientY: e.clientY,
                  button: e.button,
                  buttons: e.buttons,
                });
                elementUnder.dispatchEvent(mouseDownEvent);
                return; // Don't handle the overlay mousedown
              }
            }
            
            // Only handle mouse down on non-interactive areas
            e.stopPropagation();
            e.preventDefault();
          }}
          className={cn(
            'absolute inset-0 z-10 cursor-pointer rounded-lg transition-all',
            isHovered && 'bg-primary/5 ring-2 ring-primary/30',
            isChildSelected && 'pointer-events-none'
          )}
          style={{ 
            pointerEvents: isChildSelected ? 'none' : 'auto',
          }}
        >
          {/* Hover hint */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none",
            isHovered ? 'opacity-100' : 'opacity-0'
          )}>
            <div className="bg-background/95 px-3 py-1.5 rounded-lg shadow-lg border border-primary/20 pointer-events-none">
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
