import React, { useState, useRef, useEffect } from 'react';
import { Block, ApplicationFlowSettings } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { InlineTextEditor } from './InlineTextEditor';

interface ApplicationFlowCardProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateBlock: (updates: Partial<Block>) => void;
  readOnly?: boolean;
  selectedStepId?: string | null;
}

export const ApplicationFlowCard: React.FC<ApplicationFlowCardProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdateBlock,
  readOnly = false,
  selectedStepId,
}) => {
  // Get the selected step name for the indicator
  const settings = block.props as Partial<ApplicationFlowSettings>;
  const steps = settings?.steps || [];
  const selectedStep = selectedStepId ? steps.find(s => s.id === selectedStepId) : null;

  // Helper to update an element's content (supports HTML from rich text editor)
  const updateElementContent = (elementId: string, newContent: string) => {
    if (readOnly || !block.elements) return;
    
    const newElements = block.elements.map(el => 
      el.id === elementId ? { ...el, content: newContent } : el
    );
    onUpdateBlock({ elements: newElements });
  };

  return (
    <div
      className={cn(
        'w-full rounded-lg border bg-white dark:bg-gray-900 transition-all duration-200 cursor-pointer overflow-hidden',
        isSelected 
          ? 'border-gray-900 dark:border-white ring-1 ring-gray-900/20 dark:ring-white/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      )}
      onClick={onSelect}
    >
      {/* Clean content preview - headline, subline, button with rich text editing */}
      <div className="text-center py-12 px-8">
        {block.elements && block.elements.length > 0 ? (
          block.elements.map((el) => {
            if (el.type === 'heading') {
              return (
                <div key={el.id} className="block">
                  <InlineTextEditor
                    value={el.content || ''}
                    onChange={(newContent) => updateElementContent(el.id, newContent)}
                    placeholder="Apply Now"
                    className="text-2xl font-bold text-gray-900 dark:text-white inline-block"
                    elementType="heading"
                    elementId={el.id}
                  />
                </div>
              );
            }
            if (el.type === 'text') {
              return (
                <div key={el.id} className="block mt-2">
                  <InlineTextEditor
                    value={el.content || ''}
                    onChange={(newContent) => updateElementContent(el.id, newContent)}
                    placeholder="Answer a few quick questions..."
                    className="text-sm text-gray-500 dark:text-gray-400 inline-block"
                    elementType="text"
                    elementId={el.id}
                  />
                </div>
              );
            }
            if (el.type === 'button') {
              return (
                <span 
                  key={el.id} 
                  className="inline-block mt-6 px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Could add inline editing for button too
                  }}
                >
                  {el.content || 'Start Application →'}
                </span>
              );
            }
            return null;
          })
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Apply Now</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Answer a few quick questions to get started.</p>
            <span className="inline-block mt-6 px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-lg font-medium text-sm">
              Start Application →
            </span>
          </>
        )}
      </div>

      {/* Editing Step Indicator - Clean B&W */}
      {selectedStep && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-600 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-800/50">
          Editing: {selectedStep.name}
        </div>
      )}
    </div>
  );
};
