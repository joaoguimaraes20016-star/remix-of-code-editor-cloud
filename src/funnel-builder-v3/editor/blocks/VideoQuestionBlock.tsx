import React, { useState, useEffect, useCallback } from 'react';
import { VideoQuestionContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useEditableStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';

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
    optionStyle = 'outline',
    questionColor,
    optionTextColor,
    selectedOptionColor,
    questionStyles,
  } = content;
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent } = useFunnel();
  const [selected, setSelected] = useState<string | null>(null);
  const embedUrl = getEmbedUrl(videoSrc, videoType);

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
          const isSelected = selected === option.id;
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
