import React, { useState, useRef, useEffect } from 'react';
import { Block, ApplicationFlowSettings } from '../../types/infostack';
import { cn } from '@/lib/utils';

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

  // Helper to update an element's content
  const updateElementContent = (elementId: string, newContent: string) => {
    if (readOnly || !block.elements) return;
    
    const newElements = block.elements.map(el => 
      el.id === elementId ? { ...el, content: newContent } : el
    );
    onUpdateBlock({ elements: newElements });
  };

  // Editable text component
  const EditableText: React.FC<{
    elementId: string;
    content: string;
    className: string;
    placeholder: string;
  }> = ({ elementId, content, className, placeholder }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(content);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setValue(content);
    }, [content]);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    if (readOnly) {
      return <span className={className}>{content || placeholder}</span>;
    }

    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            if (value !== content) {
              updateElementContent(elementId, value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
              if (value !== content) {
                updateElementContent(elementId, value);
              }
            }
            if (e.key === 'Escape') {
              setIsEditing(false);
              setValue(content);
            }
          }}
          className={cn(
            className,
            'bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none text-center w-full'
          )}
          placeholder={placeholder}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    return (
      <span
        className={cn(className, 'cursor-text hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 transition-colors')}
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {content || placeholder}
      </span>
    );
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
      {/* Clean content preview - headline, subline, button */}
      <div className="text-center py-12 px-8">
        {block.elements && block.elements.length > 0 ? (
          block.elements.map((el) => {
            if (el.type === 'heading') {
              return (
                <EditableText
                  key={el.id}
                  elementId={el.id}
                  content={el.content}
                  className="block text-2xl font-bold text-gray-900 dark:text-white"
                  placeholder="Apply Now"
                />
              );
            }
            if (el.type === 'text') {
              return (
                <EditableText
                  key={el.id}
                  elementId={el.id}
                  content={el.content}
                  className="block text-sm text-gray-500 dark:text-gray-400 mt-2"
                  placeholder="Answer a few quick questions..."
                />
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
