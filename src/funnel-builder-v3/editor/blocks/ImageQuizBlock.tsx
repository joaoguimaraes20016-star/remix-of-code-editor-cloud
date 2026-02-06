import React, { useState, useEffect, useCallback } from 'react';
import { ImageQuizContent, TextStyles, ButtonContent } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useEditableStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';
import { Button } from '@/components/ui/button';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

// Default submit button configuration
const defaultSubmitButton: ButtonContent = {
  text: 'Submit',
  variant: 'primary',
  size: 'md',
  action: 'next-step',
  fullWidth: true,
  backgroundColor: '#3b82f6',
  color: '#ffffff',
};

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
    multiSelect,
    showSubmitButton,
    submitButton = defaultSubmitButton,
    optionStyle = 'outline',
    questionColor,
    optionTextColor,
    selectedOptionColor,
    questionStyles,
  } = content;
  const runtime = useFunnelRuntimeOptional();
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const selectedChildElement = funnelContext?.selectedChildElement ?? null;
  const setSelectedChildElement = funnelContext?.setSelectedChildElement ?? (() => {});
  const setSelectedBlockId = funnelContext?.setSelectedBlockId ?? (() => {});
  const [selected, setSelected] = useState<string[]>([]);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const canEdit = blockId && stepId && !isPreview;
  const shouldShowSubmitButton = showSubmitButton || multiSelect;
  const isButtonSelected = !isPreview && selectedChildElement === 'submit-button';
  const hasChildSelected = !!selectedChildElement;

  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'image-quiz',
    hintText: 'Click to edit image quiz',
    isEditing: hasChildSelected // Disable overlay when child is selected
  });

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

  // Helper function to execute answer action
  const executeAnswerAction = (option: any) => {
    if (!runtime) return;
    
    // Get action from new format or legacy nextStepId
    const action = option.action || (option.nextStepId ? 'next-step' : 'next-step');
    const actionValue = option.actionValue || option.nextStepId;
    
    // ALL actions submit data first (fire-and-forget for speed)
    runtime.submitForm();
    
    // Then perform the action immediately (don't wait for submit)
    switch (action) {
      case 'url':
        if (actionValue) {
          window.open(actionValue, '_blank');
        }
        break;
      case 'submit':
        // Just submit, no navigation (already done above)
        break;
      case 'next-step':
      default:
        // Navigate immediately
        if (actionValue) {
          runtime.goToStep(actionValue);
        } else {
          runtime.goToNextStep();
        }
        break;
    }
  };

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

    if (runtime && blockId) {
      runtime.setSelection(blockId, multiSelect ? newSelected : optionId);

      // Only execute answer action if NO submit button
      if (!shouldShowSubmitButton) {
        const selectedOption = options.find(o => o.id === optionId);
        if (selectedOption) {
          executeAnswerAction(selectedOption);
        }
      }
    }
  };

  // Handle submit button click - when submit button exists, it OVERRIDES answer actions
  const handleSubmit = () => {
    if (runtime && selected.length > 0) {
      const action = submitButton.action || 'next-step';
      const actionValue = submitButton.actionValue;
      
      // ALL buttons submit data first (fire-and-forget for speed)
      runtime.submitForm();
      
      // Then perform the action immediately (don't wait for submit)
      switch (action) {
        case 'url':
          if (actionValue) {
            window.open(actionValue, '_blank');
          }
          break;
        case 'scroll':
          if (actionValue) {
            const element = document.getElementById(actionValue);
            element?.scrollIntoView({ behavior: 'smooth' });
          }
          break;
        case 'submit':
          // Just submit, no navigation (already done above)
          break;
        case 'next-step':
        default:
          // Navigate immediately
          if (actionValue && !actionValue.startsWith('http') && !actionValue.startsWith('#')) {
            runtime.goToStep(actionValue);
          } else {
            runtime.goToNextStep();
          }
          break;
      }
    }
  };

  // Handle button click in editor/preview modes
  const handleButtonClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.stopPropagation();
      setSelectedChildElement('submit-button');
    } else {
      handleSubmit();
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
  const getCardClasses = (isSelected: boolean, hasCustomBorder: boolean) => {
    const baseClasses = 'relative rounded-xl overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-primary/50';
    
    // If custom border color, use simpler styling
    if (hasCustomBorder) {
      return cn(
        baseClasses,
        'border-2',
        isSelected && 'ring-2 ring-primary/20'
      );
    }
    
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
  const getLabelClasses = (isSelected: boolean, hasCustomBg: boolean) => {
    const baseClasses = 'p-2 text-center text-sm font-medium';
    
    // If has custom background, skip default backgrounds
    if (hasCustomBg) {
      return baseClasses;
    }
    
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

  // Get text color - prioritize per-option colors
  const getTextColor = (isSelected: boolean, option: { textColor?: string }) => {
    if (option.textColor) {
      return option.textColor;
    }
    if (isSelected && selectedOptionColor) {
      return selectedOptionColor;
    }
    if (!isSelected && optionTextColor) {
      return optionTextColor;
    }
    return isSelected ? 'hsl(var(--primary))' : undefined;
  };

  // Build inline styles for custom colors
  const getCardStyle = (option: { borderColor?: string }) => {
    const style: React.CSSProperties = {};
    if (option.borderColor) {
      style.borderColor = option.borderColor;
    }
    return style;
  };

  const getLabelStyle = (option: { backgroundColor?: string; textColor?: string }) => {
    const style: React.CSSProperties = {};
    if (option.backgroundColor) {
      style.backgroundColor = option.backgroundColor;
    }
    return style;
  };

  const quizElement = (
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
          const isSelected = selected.includes(option.id);
          const hasCustomBorder = !!option.borderColor;
          const hasCustomBg = !!option.backgroundColor;
          const textColor = getTextColor(isSelected, option);
          const cardStyle = getCardStyle(option);
          const labelStyle = { ...getLabelStyle(option), color: textColor };
          
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={getCardClasses(isSelected, hasCustomBorder)}
              style={{ ...cardStyle, touchAction: 'manipulation' as const }}
            >
              <div className="aspect-square bg-muted">
                <img
                  src={option.image}
                  alt={option.text}
                  className="w-full h-full object-cover"
                />
              </div>
              <div 
                className={getLabelClasses(isSelected, hasCustomBg)}
                style={labelStyle}
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
              {/* Selection indicator: Radio for single select, Checkbox for multi select */}
              <div className="absolute top-2 right-2">
                {multiSelect ? (
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    isSelected 
                      ? "bg-primary border-primary" 
                      : "border-white/70 bg-black/20"
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                ) : (
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected 
                      ? "border-primary bg-white" 
                      : "border-white/70 bg-black/20"
                  )}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Submit Button */}
      {shouldShowSubmitButton && (() => {
        const { 
          text, 
          variant = 'primary', 
          size = 'md', 
          fullWidth = true, 
          backgroundColor, 
          backgroundGradient, 
          color, 
          textGradient, 
          borderColor, 
          borderWidth, 
          fontSize 
        } = submitButton;
        
        const sizeClasses: Record<string, string> = {
          sm: 'h-9 px-4 text-sm',
          md: 'h-11 px-6 text-base',
          lg: 'h-14 px-8 text-lg',
        };
        
        const customStyle: React.CSSProperties = {};
        
        if (fontSize) {
          customStyle.fontSize = `${fontSize}px`;
        }
        
        const shouldApplyCustomBg = variant !== 'outline' && variant !== 'ghost';
        
        if (shouldApplyCustomBg) {
          if (backgroundGradient) {
            customStyle.background = backgroundGradient;
          } else if (backgroundColor) {
            customStyle.backgroundColor = backgroundColor;
          }
        }
        
        if (variant === 'outline') {
          if (borderColor) {
            customStyle.borderColor = borderColor;
          }
          if (borderWidth) {
            customStyle.borderWidth = `${borderWidth}px`;
          }
        }
        
        if (!textGradient && color) {
          customStyle.color = color;
        }
        
        const hasCustomBg = shouldApplyCustomBg && (!!backgroundColor || !!backgroundGradient);
        const hasTextGradient = !!textGradient;
        
        return (
          <Button
            type="button"
            variant={hasCustomBg ? 'ghost' : (variant === 'primary' ? 'default' : variant)}
            onClick={handleButtonClick}
            onMouseEnter={() => canEdit && setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            disabled={isPreview && selected.length === 0}
            className={cn(
              sizeClasses[size],
              fullWidth && 'w-full',
              hasCustomBg && 'hover:opacity-90',
              (isButtonHovered || isButtonSelected) && 'ring-2 ring-primary ring-offset-2',
              isButtonHovered && !isButtonSelected && 'ring-primary/50',
              'mt-4 font-medium rounded-xl',
              isPreview && selected.length === 0 && 'opacity-50 cursor-not-allowed'
            )}
            style={{ ...customStyle, touchAction: 'manipulation' as const }}
          >
            {hasTextGradient ? (
              <span
                className="text-gradient-clip"
                style={{ '--text-gradient': textGradient } as React.CSSProperties}
              >
                {text || 'Submit'}
              </span>
            ) : (
              text || 'Submit'
            )}
          </Button>
        );
      })()}
    </div>
  );

  return wrapWithOverlay(quizElement);
}
