import React, { useState, useEffect, useCallback } from 'react';
import { QuizContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useEditableStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';

interface QuizBlockProps {
  content: QuizContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function QuizBlock({ content, blockId, stepId, isPreview }: QuizBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent } = useFunnel();
  const { 
    question, 
    options, 
    multiSelect,
    optionStyle = 'outline',
    questionColor,
    optionTextColor,
    selectedOptionColor,
    questionStyles,
  } = content;
  const [selected, setSelected] = useState<string[]>([]);

  const canEdit = blockId && stepId && !isPreview;

  // Wire question text toolbar to block content
  const { styles: questionToolbarStyles, handleStyleChange: handleQuestionStyleChange } = useEditableStyleSync(
    blockId,
    stepId,
    questionColor,
    questionStyles?.textGradient,
    questionStyles,
    updateBlockContent,
    'questionColor',
    'questionStyles.textGradient'
  );

  // Default question styles merged with toolbar styles
  const mergedQuestionStyles: TextStyles = {
    fontSize: 18,
    fontWeight: 600,
    textAlign: 'center',
    ...questionToolbarStyles,
  };

  // Sync with runtime selections if available
  useEffect(() => {
    if (runtime && blockId) {
      const savedSelection = runtime.selections[blockId];
      if (savedSelection) {
        setSelected(Array.isArray(savedSelection) ? savedSelection : [savedSelection]);
      }
    }
  }, [runtime, blockId]);

  const handleSelect = (optionId: string) => {
    let newSelected: string[];
    
    if (multiSelect) {
      newSelected = selected.includes(optionId)
        ? selected.filter(id => id !== optionId)
        : [...selected, optionId];
    } else {
      newSelected = [optionId];
    }
    
    setSelected(newSelected);

    // Update runtime if available
    if (runtime && blockId) {
      runtime.setSelection(blockId, multiSelect ? newSelected : optionId);
    }

    // Handle navigation for single-select quizzes
    if (!multiSelect && runtime) {
      const selectedOption = options.find(o => o.id === optionId);
      if (selectedOption?.nextStepId) {
        // Navigate to the specific step configured for this option
        setTimeout(() => runtime.goToStep(selectedOption.nextStepId!), 300);
      } else {
        // Auto-advance to next step after selection
        setTimeout(() => runtime.goToNextStep(), 300);
      }
    }
  };

  const handleQuestionChange = useCallback((newQuestion: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { question: newQuestion });
    }
  }, [blockId, stepId, updateBlockContent]);

  const handleOptionTextChange = (optionId: string, newText: string) => {
    if (blockId && stepId) {
      const updatedOptions = options.map(opt =>
        opt.id === optionId ? { ...opt, text: newText } : opt
      );
      updateBlockContent(stepId, blockId, { options: updatedOptions });
    }
  };

  // Build option classes based on style
  const getOptionClasses = (isSelected: boolean) => {
    const baseClasses = 'w-full p-4 rounded-xl text-left transition-all flex items-center justify-between gap-3';
    
    if (optionStyle === 'filled') {
      return cn(
        baseClasses,
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted hover:bg-muted/80'
      );
    }
    
    // Outline style (default)
    return cn(
      baseClasses,
      'border-2',
      isSelected
        ? 'border-primary bg-primary/5'
        : 'border-border hover:border-primary/30 hover:bg-accent/50'
    );
  };

  // Build text color styles
  const getTextColor = (isSelected: boolean) => {
    if (isSelected && selectedOptionColor) {
      return selectedOptionColor;
    }
    if (!isSelected && optionTextColor) {
      return optionTextColor;
    }
    // Fallback to default behavior
    if (optionStyle === 'filled') {
      return isSelected ? undefined : undefined; // Use class defaults
    }
    return isSelected ? 'hsl(var(--primary))' : undefined;
  };

  return (
    <div className="space-y-4">
      <div className={cn(
        "text-lg font-semibold text-center",
        !questionColor && !questionStyles?.textGradient && "text-foreground"
      )}>
        {canEdit ? (
          <EditableText
            value={question}
            onChange={handleQuestionChange}
            as="h3"
            isPreview={isPreview}
            showToolbar={true}
            richText={true}
            singleLine={true}
            styles={mergedQuestionStyles}
            onStyleChange={handleQuestionStyleChange}
          />
        ) : (
          (() => {
            // For preview mode: apply gradient or solid color styling
            const hasQuestionGradient = !!questionStyles?.textGradient;
            const previewStyle: React.CSSProperties = hasQuestionGradient
              ? { '--text-gradient': questionStyles!.textGradient } as React.CSSProperties
              : { color: questionColor || undefined };
            return (
              <span 
                className={cn(hasQuestionGradient && 'text-gradient-clip')}
                style={previewStyle}
              >
                {question}
              </span>
            );
          })()
        )}
      </div>
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const textColor = getTextColor(isSelected);
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={getOptionClasses(isSelected)}
            >
              <span 
                className={cn(
                  'font-medium flex-1',
                  optionStyle !== 'filled' && isSelected && !selectedOptionColor && 'text-primary'
                )}
                style={{ color: textColor }}
              >
                {canEdit ? (
                  <EditableText
                    value={option.text}
                    onChange={(newText) => handleOptionTextChange(option.id, newText)}
                    as="span"
                    isPreview={isPreview}
                    showToolbar={true}
                    richText={true}
                    styles={{}}
                    onStyleChange={() => {}}
                  />
                ) : (
                  option.text
                )}
              </span>
              {isSelected && (
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                  optionStyle === 'filled' 
                    ? "bg-primary-foreground/20" 
                    : "bg-primary"
                )}>
                  <Check className={cn(
                    "h-4 w-4",
                    optionStyle === 'filled' 
                      ? "text-primary-foreground" 
                      : "text-primary-foreground"
                  )} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
