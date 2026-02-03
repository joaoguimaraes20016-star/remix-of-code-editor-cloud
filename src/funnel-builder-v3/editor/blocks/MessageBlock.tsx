import React, { useState, useEffect, useCallback } from 'react';
import { MessageContent, ButtonContent, TextStyles, ConsentSettings } from '@/funnel-builder-v3/types/funnel';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useEditableStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';
import { toast } from 'sonner';

// Default consent settings
const defaultConsent: ConsentSettings = {
  enabled: false,
  text: 'I have read and accept the',
  linkText: 'privacy policy',
  linkUrl: '#',
  required: true,
};

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

interface MessageBlockProps {
  content: MessageContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function MessageBlock({ content, blockId, stepId, isPreview }: MessageBlockProps) {
  const { 
    label, 
    placeholder, 
    minRows, 
    maxLength, 
    questionColor,
    questionStyles,
    submitButton = defaultSubmitButton,
    consent = defaultConsent,
  } = content;
  const runtime = useFunnelRuntimeOptional();
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const selectedChildElement = funnelContext?.selectedChildElement ?? null;
  const setSelectedChildElement = funnelContext?.setSelectedChildElement ?? (() => {});
  const [text, setText] = useState('');
  const [hasConsented, setHasConsented] = useState(false);

  const canEdit = blockId && stepId && !isPreview;
  const isButtonSelected = !isPreview && selectedChildElement === 'submit-button';

  // Wire question text toolbar to block content (like QuizBlock)
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

  // Load saved value from runtime on mount
  useEffect(() => {
    if (runtime && blockId) {
      const saved = runtime.formData[blockId];
      if (typeof saved === 'string') {
        setText(saved);
      }
    }
  }, [runtime, blockId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    if (blockId) {
      runtime?.setFormField(blockId, value);
    }
  };

  const handleLabelChange = useCallback((newLabel: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { label: newLabel });
    }
  }, [blockId, stepId, updateBlockContent]);

  // Handle submit button click
  const handleSubmit = () => {
    if (!runtime) return;
    
    // Save the message value
    if (blockId) {
      runtime.setFormField(blockId, text);
    }
    
    // Handle action
    const action = submitButton.action || 'next-step';
    const actionValue = submitButton.actionValue;

    if (action === 'url' && actionValue) {
      window.open(actionValue, '_blank');
    } else if (action === 'scroll' && actionValue) {
      const element = document.getElementById(actionValue);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else if ((action as string) === 'specific-step' && actionValue) {
      runtime.goToStep(actionValue);
    } else {
      runtime.goToNextStep();
    }
  };

  // Handle button click in editor (for child element selection)
  const handleButtonClick = (e: React.MouseEvent) => {
    if (!isPreview && setSelectedChildElement) {
      e.stopPropagation();
      setSelectedChildElement('submit-button');
    }
  };

  // Button styling
  const { 
    text: buttonText, 
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

  const shouldApplyCustomBg = variant !== 'outline';
  const hasCustomBg = shouldApplyCustomBg && (!!backgroundColor || !!backgroundGradient);
  const hasTextGradient = !!textGradient;

  const buttonStyle: React.CSSProperties = {};
  if (hasCustomBg) {
    if (backgroundGradient) {
      buttonStyle.background = backgroundGradient;
    } else if (backgroundColor) {
      buttonStyle.backgroundColor = backgroundColor;
    }
  }
  if (variant === 'outline' && borderColor) {
    buttonStyle.borderColor = borderColor;
    buttonStyle.borderWidth = borderWidth || 2;
    buttonStyle.borderStyle = 'solid';
  }
  if (color && !textGradient) {
    buttonStyle.color = color;
  }
  if (fontSize) {
    buttonStyle.fontSize = `${fontSize}px`;
  }

  return (
    <div className="space-y-4">
      {/* Question heading - styled like Quiz block */}
      <div className={cn(
        "text-lg font-semibold text-center",
        !questionColor && !questionStyles?.textGradient && "text-foreground"
      )}>
        {canEdit ? (
          <EditableText
            value={label || ''}
            onChange={handleLabelChange}
            as="h3"
            isPreview={isPreview}
            showToolbar={true}
            richText={true}
            singleLine={true}
            styles={mergedQuestionStyles}
            onStyleChange={handleQuestionStyleChange}
            placeholder="Enter your question..."
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
                {label}
              </span>
            );
          })()
        )}
      </div>
      <Textarea
        placeholder={placeholder}
        rows={minRows}
        maxLength={maxLength}
        className="resize-none"
        value={text}
        onChange={handleChange}
      />
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {text.length} / {maxLength}
        </p>
      )}

      {/* Privacy Consent Checkbox */}
      {consent.enabled && (
        <div className="flex items-start gap-3 py-2">
          <Checkbox
            id="privacy-consent-message"
            checked={hasConsented}
            onCheckedChange={(checked) => setHasConsented(checked === true)}
            className="mt-0.5"
          />
          <label 
            htmlFor="privacy-consent-message" 
            className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
          >
            {consent.text}{' '}
            <a 
              href={consent.linkUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
              onClick={(e) => e.stopPropagation()}
            >
              {consent.linkText}
            </a>
            {consent.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
        </div>
      )}
      
      {/* Submit Button - wrapped with visual cue in editor mode */}
      <div 
        className={cn(
          "relative group",
          !isPreview && "cursor-pointer"
        )}
      >
        {/* Editor mode: show "Click to edit" hint on hover */}
        {!isPreview && !isButtonSelected && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <span className="text-[10px] text-muted-foreground bg-background/90 px-2 py-0.5 rounded shadow-sm border whitespace-nowrap">
              Click to edit button
            </span>
          </div>
        )}
        <Button
          type="button"
          variant={hasCustomBg ? 'ghost' : (variant === 'primary' ? 'default' : variant)}
          onClick={(e) => {
            handleButtonClick(e);
            if (isPreview || runtime) {
              handleSubmit();
            }
          }}
          className={cn(
            sizeClasses[size],
            fullWidth && 'w-full',
            hasCustomBg && 'hover:opacity-90',
            'font-medium transition-all rounded-xl',
            isButtonSelected && 'ring-2 ring-primary ring-offset-2',
            // In editor mode, add subtle hover effect to indicate it's clickable
            !isPreview && !isButtonSelected && 'group-hover:ring-1 group-hover:ring-primary/30'
          )}
          style={buttonStyle}
        >
          {hasTextGradient ? (
            <span
              className="text-gradient-clip"
              style={{ '--text-gradient': textGradient } as React.CSSProperties}
            >
              {buttonText || 'Submit'}
            </span>
          ) : (
            buttonText || 'Submit'
          )}
        </Button>
      </div>
    </div>
  );
}
