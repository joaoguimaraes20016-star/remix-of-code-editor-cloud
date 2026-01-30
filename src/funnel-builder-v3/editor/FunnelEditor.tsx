import React, { useState, useCallback } from 'react';
import { LeftPanel } from './LeftPanel';
import { Canvas } from './Canvas';
import { RightPanel } from './RightPanel';
import { EditorHeader } from './EditorHeader';
import { PreviewMode } from './PreviewMode';
import { FunnelProvider, useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { DragOverlayItem } from './DragOverlayItem';
import { Block } from '@/funnel-builder-v3/types/funnel';

// Smooth drop animation
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
  duration: 250,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
};

// Editor content wrapped by FunnelProvider
function EditorContent() {
  const { isPreviewMode, funnel, currentStepId, reorderBlocks } = useFunnel();
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const currentStep = funnel.steps.find(s => s.id === currentStepId);
    if (currentStep) {
      const block = currentStep.blocks.find(b => b.id === active.id);
      if (block) {
        setActiveBlock(block);
      }
    }
  }, [funnel.steps, currentStepId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlock(null);

    if (over && active.id !== over.id && currentStepId) {
      const currentStep = funnel.steps.find(s => s.id === currentStepId);
      if (currentStep) {
        const oldIndex = currentStep.blocks.findIndex((b) => b.id === active.id);
        const newIndex = currentStep.blocks.findIndex((b) => b.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderBlocks(currentStepId, oldIndex, newIndex);
        }
      }
    }
  }, [currentStepId, funnel.steps, reorderBlocks]);

  const handleDragCancel = useCallback(() => {
    setActiveBlock(null);
  }, []);

  return (
    <>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="h-screen flex flex-col bg-background overflow-hidden">
          <EditorHeader />
          <div className="flex-1 flex overflow-hidden">
            <LeftPanel />
            <Canvas />
            <RightPanel />
          </div>
        </div>

        {/* Global Drag Overlay - renders outside normal flow for smooth dragging */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeBlock ? (
            <DragOverlayItem block={activeBlock} variant="canvas" />
          ) : null}
        </DragOverlay>
      </DndContext>
      
      <AnimatePresence>
        {isPreviewMode && <PreviewMode />}
      </AnimatePresence>
    </>
  );
}

export function FunnelEditor() {
  return (
    <FunnelProvider>
      <EditorContent />
    </FunnelProvider>
  );
}
