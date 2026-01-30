import React, { useState, useEffect, useCallback } from 'react';
import { ImageQuizContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useEditableStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';

interface ImageQuizBlockProps {
  content: ImageQuizContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function ImageQuizBlock({ content, blockId, stepId, isPreview }: ImageQuizBlockProps) {
  const { 
    question, 
    options,
    optionStyle = 'outline',
    questionColor,
    optionTextColor,
    selectedOptionColor,
    questionStyles,
  } = content;
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent } = useFunnel();
  const [selected, setSelected] = useState<string | null>(null);

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
        setSelected(typeof savedSelection === 'string' ? savedSelection : savedSelection[0]);
      }
    }
  }, [runtime, blockId]);

  const handleSelect = (optionId: string) => {
    setSelected(optionId);

    if (runtime && blockId) {
      runtime.setSelection(blockId, optionId);

      // Auto-navigate after selection
      const selectedOption = options.find(o => o.id === optionId);
      if (selectedOption?.nextStepId) {
        setTimeout(() => runtime.goToStep(selectedOption.nextStepId!), 300);
      } else {
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

  // Build option card classes based on style
  const getCardClasses = (isSelected: boolean) => {
    const baseClasses = 'relative rounded-xl overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-primary/50';
    
    if (optionStyle === 'filled') {
      return cn(
        baseClasses,
        isSelected
          ? 'ring-2 ring-primary bg-primary/10'
          : 'bg-muted hover:bg-muted/80'
      );
    }
    
    // Outline style (default)
    return cn(
      baseClasses,
      'border-2',
      isSelected
        ? 'border-primary ring-2 ring-primary/20'
        : 'border-border hover:border-primary/30'
    );
  };

  // Build text label classes
  const getLabelClasses = (isSelected: boolean) => {
    const baseClasses = 'p-2 text-center text-sm font-medium';
    
    if (optionStyle === 'filled') {
      return cn(
        baseClasses,
        isSelected ? 'bg-primary/20' : 'bg-muted/50'
      );
    }
    
    return cn(
      baseClasses,
      isSelected ? 'bg-primary/5' : ''
    );
  };

  // Get text color
  const getTextColor = (isSelected: boolean) => {
    if (isSelected && selectedOptionColor) {
      return selectedOptionColor;
    }
    if (!isSelected && optionTextColor) {
      return optionTextColor;
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
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selected === option.id;
          const textColor = getTextColor(isSelected);
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={getCardClasses(isSelected)}
            >
              <div className="aspect-square bg-muted">
                <img
                  src={option.image}
                  alt={option.text}
                  className="w-full h-full object-cover"
                />
              </div>
              <div 
                className={getLabelClasses(isSelected)}
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
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
