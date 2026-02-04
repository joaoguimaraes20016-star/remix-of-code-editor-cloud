import React, { useState, useEffect, useCallback } from 'react';
import { QuizContent, TextStyles, ButtonContent } from '@/funnel-builder-v3/types/funnel';
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

interface QuizBlockProps {
  content: QuizContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function QuizBlock({ content, blockId, stepId, isPreview }: QuizBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const selectedChildElement = funnelContext?.selectedChildElement ?? null;
  const setSelectedChildElement = funnelContext?.setSelectedChildElement ?? (() => {});
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
  const [selected, setSelected] = useState<string[]>([]);
  
  // Default to true if not specified
  const shouldShowSubmitButton = showSubmitButton !== false;

  const canEdit = blockId && stepId && !isPreview;
  const hasChildSelected = !!selectedChildElement;

  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'quiz',
    hintText: 'Click to edit quiz',
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
    if (!runtime) {
      console.log('[QuizBlock] No runtime available - editor mode');
      return;
    }
    
    try {
      // Get action from new format or legacy nextStepId
      const action = option.action || (option.nextStepId ? 'next-step' : 'next-step');
      const actionValue = option.actionValue || option.nextStepId;
      
      // ALL actions submit data first (fire-and-forget for speed)
      runtime.submitForm().catch((error) => {
        console.error('[QuizBlock] submitForm error:', error);
        // Don't block navigation on submission error
      });
      
      // Then perform the action immediately (don't wait for submit)
      switch (action) {
        case 'url':
          if (actionValue) {
            try {
              window.open(actionValue, '_blank');
            } catch (error) {
              console.error('[QuizBlock] window.open error:', error);
            }
          } else {
            console.warn('[QuizBlock] URL action missing actionValue');
          }
          break;
        case 'submit':
          // Just submit, no navigation (already done above)
          break;
        case 'next-step':
        default:
          // Navigate immediately
          try {
            if (actionValue) {
              runtime.goToStep(actionValue);
            } else {
              runtime.goToNextStep();
            }
          } catch (error) {
            console.error('[QuizBlock] Navigation error:', error);
          }
          break;
      }
    } catch (error) {
      console.error('[QuizBlock] executeAnswerAction unexpected error:', error);
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

    // Update runtime if available
    if (runtime && blockId) {
      runtime.setSelection(blockId, multiSelect ? newSelected : optionId);
    }

    // Only execute answer action if NO submit button
    if (!shouldShowSubmitButton && runtime) {
      const selectedOption = options.find(o => o.id === optionId);
      if (selectedOption) {
        executeAnswerAction(selectedOption);
      }
    }
  };

  // Handle submit button click - when submit button exists, it OVERRIDES answer actions
  const handleSubmit = () => {
    console.log('[QuizBlock] ====== handleSubmit CALLED ======', {
      hasRuntime: !!runtime,
      isPreview,
      selectedCount: selected.length,
      blockId,
      stepId,
    });

    if (!runtime) {
      console.warn('[QuizBlock] No runtime available - editor mode or runtime not initialized', {
        isPreview,
        blockId,
        stepId,
      });
      return;
    }
    
    if (selected.length === 0) {
      console.warn('[QuizBlock] handleSubmit called but no options selected');
      return;
    }
    
    try {
      const action = submitButton.action || 'next-step';
      const actionValue = submitButton.actionValue;
      
      // ALL buttons submit data first (fire-and-forget for speed)
      runtime.submitForm().catch((error) => {
        console.error('[QuizBlock] submitForm error:', error);
        // Don't block navigation on submission error
      });
      
      // Then perform the action immediately (don't wait for submit)
      switch (action) {
        case 'url':
          if (actionValue) {
            try {
              window.open(actionValue, '_blank');
            } catch (error) {
              console.error('[QuizBlock] window.open error:', error);
            }
          } else {
            console.warn('[QuizBlock] URL action missing actionValue');
          }
          break;
        case 'scroll':
          if (actionValue) {
            try {
              const element = document.getElementById(actionValue);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              } else {
                console.warn(`[QuizBlock] Scroll target not found: ${actionValue}`);
              }
            } catch (error) {
              console.error('[QuizBlock] scrollIntoView error:', error);
            }
          } else {
            console.warn('[QuizBlock] Scroll action missing actionValue');
          }
          break;
        case 'submit':
          // Just submit, no navigation (already done above)
          break;
        case 'next-step':
        default:
          // Navigate immediately
          try {
            console.log('[QuizBlock] Attempting navigation', {
              actionValue,
              hasActionValue: !!actionValue,
              isHttp: actionValue?.startsWith('http'),
              isHash: actionValue?.startsWith('#'),
            });
            if (actionValue && !actionValue.startsWith('http') && !actionValue.startsWith('#')) {
              console.log('[QuizBlock] Calling goToStep with:', actionValue);
              runtime.goToStep(actionValue);
            } else {
              console.log('[QuizBlock] Calling goToNextStep');
              runtime.goToNextStep();
            }
            console.log('[QuizBlock] Navigation call completed');
          } catch (error) {
            console.error('[QuizBlock] Navigation error:', error);
          }
          break;
      }
    } catch (error) {
      console.error('[QuizBlock] handleSubmit unexpected error:', error);
    }
  };

  // Handle submit button click in editor/preview modes
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('[QuizBlock] ====== handleButtonClick FIRED ======', {
      isPreview,
      hasRuntime: !!runtime,
      selectedCount: selected.length,
    });

    if (!isPreview) {
      // In editor mode: select the button element
      e.stopPropagation();
      setSelectedChildElement('submit-button');
    } else {
      // In preview mode: submit action
      handleSubmit();
    }
  };

  const isButtonSelected = !isPreview && selectedChildElement === 'submit-button';

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

  // Build option classes based on style (without custom colors - those are inline)
  const getOptionClasses = (isSelected: boolean, hasCustomBg: boolean) => {
    const baseClasses = 'w-full p-4 rounded-xl text-left transition-all flex items-center justify-between gap-3';
    
    // If option has custom background, use minimal styling
    if (hasCustomBg) {
      return cn(
        baseClasses,
        'border-2',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'
      );
    }
    
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

  // Build text color styles - prioritize per-option colors
  const getTextColor = (isSelected: boolean, option: { textColor?: string }) => {
    // Per-option color takes precedence
    if (option.textColor) {
      return option.textColor;
    }
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

  // Build option inline styles for custom colors
  const getOptionStyle = (option: { backgroundColor?: string }) => {
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
          const hasCustomBg = !!option.backgroundColor;
          const textColor = getTextColor(isSelected, option);
          const optionInlineStyle = getOptionStyle(option);
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={getOptionClasses(isSelected, hasCustomBg)}
              style={optionInlineStyle}
            >
              <span 
                className="font-medium flex-1"
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
              {/* Selection indicator: Radio for single select, Checkbox for multi select */}
              {multiSelect ? (
                // Checkbox style for Multiple Choice
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                  isSelected 
                    ? "bg-primary border-primary" 
                    : "border-muted-foreground/30"
                )}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              ) : (
                // Radio style for Choice (single select)
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  isSelected 
                    ? "border-primary" 
                    : "border-muted-foreground/30"
                )}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Submit Button - uses full ButtonContent for consistency with regular buttons */}
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
        
        // Build custom styles matching ButtonBlock logic
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
            variant={hasCustomBg ? 'ghost' : (variant === 'primary' ? 'default' : variant)}
            onClick={handleButtonClick}
            disabled={isPreview && selected.length === 0}
            className={cn(
              sizeClasses[size],
              fullWidth && 'w-full',
              hasCustomBg && 'hover:opacity-90',
              'mt-4 font-medium transition-all rounded-xl',
              isPreview && selected.length === 0 && 'opacity-50 cursor-not-allowed',
              isButtonSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            style={customStyle}
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
