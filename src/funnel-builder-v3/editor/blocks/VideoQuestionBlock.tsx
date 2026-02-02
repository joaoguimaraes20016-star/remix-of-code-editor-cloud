import React, { useState, useEffect, useCallback } from 'react';
import { VideoQuestionContent, TextStyles, ButtonContent } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useEditableStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';
import { Button } from '@/components/ui/button';

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

interface VideoQuestionBlockProps {
  content: VideoQuestionContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

function getEmbedUrl(src: string, type: 'youtube' | 'vimeo' | 'hosted'): string {
  if (type === 'youtube') {
    const videoId = src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : src;
  }
  if (type === 'vimeo') {
    const videoId = src.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : src;
  }
  return src;
}

export function VideoQuestionBlock({ content, blockId, stepId, isPreview }: VideoQuestionBlockProps) {
  const { 
    videoSrc, 
    videoType, 
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
  const { updateBlockContent, selectedChildElement, setSelectedChildElement } = useFunnel();
  const [selected, setSelected] = useState<string[]>([]);
  const embedUrl = getEmbedUrl(videoSrc, videoType);

  const canEdit = blockId && stepId && !isPreview;
  const shouldShowSubmitButton = showSubmitButton || multiSelect;
  const isButtonSelected = !isPreview && selectedChildElement === 'submit-button';

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
    
    switch (action) {
      case 'url':
        if (actionValue) {
          window.open(actionValue, '_blank');
        }
        break;
      case 'submit':
        runtime.submitForm();
        break;
      case 'next-step':
      default:
        if (actionValue) {
          setTimeout(() => runtime.goToStep(actionValue), 300);
        } else {
          setTimeout(() => runtime.goToNextStep(), 300);
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
      
      // When submit button exists, it OVERRIDES answer actions
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
          runtime.submitForm();
          break;
        case 'next-step':
        default:
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

  // Build question text styles including gradient support
  const hasQuestionGradient = !!questionStyles?.textGradient;
  const questionTextStyle: React.CSSProperties = {
    ...(hasQuestionGradient
      ? { '--text-gradient': questionStyles.textGradient } as React.CSSProperties
      : { color: questionColor || undefined }),
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
        {videoType === 'hosted' ? (
          <video
            src={videoSrc}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <iframe
            src={embedUrl}
            title="Video question"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {/* Question */}
      {canEdit ? (
        <div className={cn(
          "text-lg font-semibold text-center",
          !questionColor && !questionStyles?.textGradient && "text-foreground"
        )}>
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
        </div>
      ) : (
        <div 
          className={cn(
            "text-lg font-semibold text-center",
            hasQuestionGradient && "text-gradient-clip",
            !hasQuestionGradient && !questionColor && "text-foreground"
          )}
          style={questionTextStyle}
        >
          {question}
        </div>
      )}

      {/* Options */}
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
                className={cn(
                  'font-medium flex-1',
                  !option.textColor && optionStyle !== 'filled' && isSelected && !selectedOptionColor && 'text-primary'
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
              {/* Selection indicator: Radio for single select, Checkbox for multi select */}
              {multiSelect ? (
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                  isSelected 
                    ? "bg-primary border-primary" 
                    : "border-muted-foreground/30"
                )}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              ) : (
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
}
