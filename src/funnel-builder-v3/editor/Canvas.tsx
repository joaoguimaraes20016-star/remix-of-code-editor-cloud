import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlockRenderer } from './blocks/BlockRenderer';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical, Trash2, Copy, Plus } from 'lucide-react';
import { Block, ViewportType } from '@/funnel-builder-v3/types/funnel';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AddBlockModal } from './AddBlockModal';
import { useKeyboardShortcuts } from '@/funnel-builder-v3/hooks/useKeyboardShortcuts';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

// Viewport configuration
const viewportConfig: Record<ViewportType, { width: number; height: number; frame: 'phone' | 'tablet' | 'browser' }> = {
  mobile: { width: 375, height: 667, frame: 'phone' },
  tablet: { width: 768, height: 1024, frame: 'tablet' },
  desktop: { width: 1024, height: 768, frame: 'browser' },
};

function SortableBlock({ block, stepId }: { block: Block; stepId: string }) {
  const { selectedBlockId, setSelectedBlockId, deleteBlock, duplicateBlock, currentViewport } = useFunnel();
  const isSelected = selectedBlockId === block.id;

  // Check if block should be hidden for current viewport
  const isHidden = 
    (block.styles.hideOnMobile && currentViewport === 'mobile') ||
    (block.styles.hideOnTablet && currentViewport === 'tablet') ||
    (block.styles.hideOnDesktop && currentViewport === 'desktop');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ 
    id: block.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
  };

  // Render hidden blocks as faded (for editor visibility)
  if (isHidden) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-30 pointer-events-none">
        <BlockRenderer block={block} stepId={stepId} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedBlockId(block.id);
      }}
      className={cn(
        'block-wrapper group relative transition-all duration-150',
        isDragging && 'opacity-0', // Hide original while dragging (overlay shows preview)
        !isDragging && isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
      )}
    >
      {/* Drop indicator line - shows above block when something is being dragged over */}
      {isSorting && !isDragging && (
        <div className="absolute -top-2 left-0 right-0 h-0.5 bg-primary rounded-full opacity-0 group-first:opacity-0" />
      )}

      {/* Drag Handle - Inside block, top-left corner */}
      <div 
        className={cn(
          'absolute left-2 top-2 z-20',
          'opacity-0 group-hover:opacity-100 transition-all duration-200',
          isSelected && 'opacity-100'
        )}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg',
                  'bg-primary/90 text-primary-foreground backdrop-blur-sm',
                  'shadow-lg cursor-grab active:cursor-grabbing',
                  'hover:bg-primary hover:scale-110',
                  'transition-all duration-200 active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                )}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p>Drag to reorder</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Block Actions (top right) */}
      <div 
        className={cn(
          'absolute top-2 right-2 flex gap-1 z-20',
          'opacity-0 group-hover:opacity-100 transition-all duration-200',
          isSelected && 'opacity-100'
        )}
      >
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7 shadow-lg border-2 border-border hover:border-primary/30 transition-all duration-200 hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            duplicateBlock(stepId, block.id);
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7 shadow-lg border-2 border-border hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            deleteBlock(stepId, block.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <BlockRenderer block={block} stepId={stepId} />
    </div>
  );
}

function EmptyState({ onAddClick, viewport }: { onAddClick: () => void; viewport: 'mobile' | 'tablet' | 'desktop' }) {
  const isLargeViewport = viewport === 'tablet' || viewport === 'desktop';
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center"
    >
      <motion.div 
        animate={{ 
          y: [0, -5, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2,
          ease: "easeInOut"
        }}
        className={cn(
          "rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 border border-primary/10",
          isLargeViewport ? "w-24 h-24" : "w-16 h-16"
        )}
      >
        <svg className={cn("text-primary/60", isLargeViewport ? "w-12 h-12" : "w-8 h-8")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      </motion.div>
      <h3 className={cn("font-semibold text-foreground mb-2", isLargeViewport && "text-lg")}>Start Building</h3>
      <p className={cn("text-muted-foreground mb-4", isLargeViewport ? "text-base max-w-[280px]" : "text-sm max-w-[200px]")}>
        Add sections and blocks to build your page
      </p>
      <Button onClick={onAddClick} className={cn("gap-2", isLargeViewport && "h-12 px-6 text-base")}>
        <Plus className={cn(isLargeViewport ? "h-5 w-5" : "h-4 w-4")} />
        Add content
      </Button>
    </motion.div>
  );
}

// Floating Add Section Button
function AddSectionButton({ onClick, viewport }: { onClick: () => void; viewport: 'mobile' | 'tablet' | 'desktop' }) {
  const isLargeViewport = viewport === 'tablet' || viewport === 'desktop';
  
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all flex items-center justify-center gap-2 font-medium text-primary",
        isLargeViewport ? "py-5 px-6 text-base" : "py-3 px-4 text-sm"
      )}
    >
      <Plus className={cn(isLargeViewport ? "h-5 w-5" : "h-4 w-4")} />
      Add content
    </motion.button>
  );
}

export function Canvas() {
  const { funnel, currentStepId, setSelectedBlockId, currentViewport, canvasZoom, setEffectiveZoom } = useFunnel();
  const currentStep = funnel.steps.find(s => s.id === currentStepId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const prevEffectiveZoomRef = useRef<number>(1);

  const viewport = viewportConfig[currentViewport];

  // Track container size for auto-scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onAddBlock: () => setIsAddModalOpen(true),
  });

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
    data: { type: 'canvas', stepId: currentStepId },
  });

  // Calculate auto-scaling to fit canvas in available space
  // The goal: at 100% user zoom, the device frame should fill ~85% of available space
  const isPhone = viewport.frame === 'phone';
  const isTablet = viewport.frame === 'tablet';
  const isBrowser = viewport.frame === 'browser';
  const chromeHeight = 40;
  const framePadding = isBrowser ? 0 : 12;
  
  const totalFrameHeight = viewport.height + (isBrowser ? chromeHeight : 0) + (framePadding * 2);
  const totalFrameWidth = viewport.width + (framePadding * 2);
  // Use more of the available space (less padding) for a larger default frame
  const availableHeight = Math.max(containerSize.height - 32, 400);
  const availableWidth = Math.max(containerSize.width - 32, 300);
  const scaleY = availableHeight / totalFrameHeight;
  const scaleX = availableWidth / totalFrameWidth;
  // Use the smaller dimension to ensure the frame fits, with a higher max cap
  // This ensures frames appear properly sized at 100% zoom
  const autoScale = Math.max(Math.min(scaleX, scaleY, 2.0), 0.5);
  // Final scale = user zoom * baseline auto-scale
  const finalScale = canvasZoom * autoScale;

  // Update context with the effective zoom for any components that need it
  useLayoutEffect(() => {
    if (prevEffectiveZoomRef.current !== finalScale) {
      prevEffectiveZoomRef.current = finalScale;
      setEffectiveZoom(finalScale);
    }
  }, [finalScale, setEffectiveZoom]);

  if (!currentStep) {
    return (
      <div className="flex-1 bg-[hsl(var(--canvas-bg))] flex items-center justify-center">
        <p className="text-muted-foreground">Select a step to edit</p>
      </div>
    );
  }

  // Motion values (px) for smooth viewport morphing without fade-out
  const frameRadius = isPhone ? 48 : isTablet ? 32 : 12;
  const screenRadius = isPhone ? 36 : isTablet ? 24 : 0;
  const viewportTransition = { duration: 0.35, ease: [0.32, 0.72, 0, 1] as const };

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 bg-[hsl(var(--canvas-bg))] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden"
        onClick={() => setSelectedBlockId(null)}
      >
        {/* Zoom wrapper - smooth scaling with CSS transition */}
        <div 
          className="origin-center"
          style={{ 
            transform: `scale(${finalScale})`,
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Device Frame - Smooth resize (no remount, no fade-out) */}
          <motion.div
            className={cn(
              'relative overflow-hidden bg-[hsl(var(--phone-frame))]',
              'shadow-2xl'
            )}
            style={{ boxShadow: 'var(--shadow-phone)' as any, willChange: 'border-radius,padding' }}
            animate={{ borderRadius: frameRadius, padding: framePadding }}
            transition={viewportTransition}
          >

          {/* Browser chrome - fixed height animation (no 'auto' height) */}
          <motion.div
            className="browser-chrome"
            style={{ overflow: 'hidden', transformOrigin: 'top' }}
            animate={{ height: isBrowser ? chromeHeight : 0, opacity: isBrowser ? 1 : 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex items-center gap-1.5 px-3 h-10">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
          </motion.div>

          {/* Screen - animate width/height directly for a true resize (no transform scaling) */}
          <motion.div
            ref={setNodeRef}
            className={cn(
              'relative overflow-hidden bg-[hsl(var(--phone-screen))]',
              isOver && 'ring-2 ring-primary ring-inset bg-primary/5'
            )}
            style={{ willChange: 'width,height,border-radius' }}
            animate={{ width: viewport.width, height: viewport.height, borderRadius: screenRadius }}
            transition={viewportTransition}
          >
            {/* Phone notch - overlay inside screen */}
            {isPhone && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[hsl(var(--phone-frame))] rounded-b-2xl z-20" />
            )}
            
            <ScrollArea className="h-full w-full">
                <div 
                  className="canvas-content flex flex-col p-4 w-full max-w-full overflow-x-hidden"
                  style={{ 
                    backgroundColor: currentStep.settings?.backgroundColor,
                    minHeight: viewport.height,
                    paddingTop: isPhone ? 40 : 16,
                    paddingBottom: funnel.steps.length > 1 ? 64 : 24,
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {currentStep.blocks.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <EmptyState onAddClick={() => setIsAddModalOpen(true)} viewport={currentViewport} />
                      </div>
                    ) : (
                      <SortableContext
                        items={currentStep.blocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4 w-full max-w-full">
                          {currentStep.blocks.map(block => (
                            <SortableBlock
                              key={block.id}
                              block={block}
                              stepId={currentStep.id}
                            />
                          ))}
                        </div>
                        {/* Add Section Button - inline after blocks */}
                        <div className="pt-6">
                          <AddSectionButton onClick={() => setIsAddModalOpen(true)} viewport={currentViewport} />
                        </div>
                      </SortableContext>
                    )}
                  </AnimatePresence>
                </div>
            </ScrollArea>

            {/* Step Indicator */}
            {funnel.steps.length > 1 && funnel.settings.showStepIndicator !== false && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {funnel.steps.map((step, i) => (
                  <motion.div
                    key={step.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      step.id === currentStepId 
                        ? 'bg-primary w-6' 
                        : 'bg-muted-foreground/30 w-2'
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
        </div>
      </div>

      {/* Add Block Modal */}
      <AddBlockModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </>
  );
}
