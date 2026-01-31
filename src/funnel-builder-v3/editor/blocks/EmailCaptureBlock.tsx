import React, { useState, useEffect, useCallback } from 'react';
import { EmailCaptureContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { toast } from 'sonner';
import { useSimpleStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';

interface EmailCaptureBlockProps {
  content: EmailCaptureContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function EmailCaptureBlock({ content, blockId, stepId, isPreview }: EmailCaptureBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent, currentViewport } = useFunnel();
  const { 
    placeholder, 
    buttonText, 
    subtitle, 
    buttonColor, 
    buttonGradient,
    buttonTextColor,
    buttonTextGradient 
  } = content;
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = blockId && stepId && !isPreview;
  const isMobile = currentViewport === 'mobile';
  
  // Context-aware text sizing based on content length
  const getButtonTextSize = () => {
    const textLength = buttonText?.length || 0;
    if (!isMobile) return 'text-base';
    if (textLength > 20) return 'text-[10px]';
    if (textLength > 15) return 'text-xs';
    return 'text-sm';
  };
  
  const getPlaceholderTextSize = () => {
    const textLength = placeholder?.length || 0;
    if (!isMobile) return '';
    if (textLength > 25) return 'text-[11px] placeholder:text-[11px]';
    if (textLength > 20) return 'text-xs placeholder:text-xs';
    return 'text-sm placeholder:text-sm';
  };
  
  const buttonTextSize = getButtonTextSize();
  const placeholderTextSize = getPlaceholderTextSize();

  // Wire button text toolbar to block content
  const { styles: buttonTextStyles, handleStyleChange: handleButtonTextStyleChange } = useSimpleStyleSync(
    blockId,
    stepId,
    buttonTextColor,
    buttonTextGradient,
    updateBlockContent,
    'buttonTextColor',
    'buttonTextGradient'
  );

  // Load saved email from runtime
  useEffect(() => {
    if (runtime) {
      const savedEmail = runtime.formData['email'];
      if (typeof savedEmail === 'string') {
        setEmail(savedEmail);
      }
    }
  }, [runtime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!runtime) return; // Editor mode

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    // Save to runtime
    runtime.setFormField('email', email);
    
    setIsSubmitting(true);
    
    try {
      // Navigate to next step
      runtime.goToNextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonTextChange = useCallback((newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { buttonText: newText });
    }
  }, [blockId, stepId, updateBlockContent]);

  const handleSubtitleChange = useCallback((newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { subtitle: newText });
    }
  }, [blockId, stepId, updateBlockContent]);

  // Button background styling
  const buttonStyle: React.CSSProperties = {};
  if (buttonGradient) {
    buttonStyle.background = buttonGradient;
  } else if (buttonColor) {
    buttonStyle.backgroundColor = buttonColor;
  }
  
  const hasCustomBg = !!buttonColor || !!buttonGradient;

  // Button text gradient styling
  const hasTextGradient = !!buttonTextGradient;
  const buttonTextWrapperStyle: React.CSSProperties = hasTextGradient
    ? { '--text-gradient': buttonTextGradient } as React.CSSProperties
    : buttonTextColor
      ? { color: buttonTextColor }
      : {};

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-1.5">
        <Input
          type="email"
          placeholder={placeholder}
          className={cn(
            "flex-1",
            isMobile ? "h-9 px-2.5" : "h-12",
            placeholderTextSize
          )}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button 
          type="submit"
          className={cn(
            "shrink-0 whitespace-nowrap",
            isMobile ? "h-9 px-3" : "h-12 px-6",
            hasCustomBg && "hover:opacity-90"
          )}
          variant={hasCustomBg ? "ghost" : "default"}
          style={buttonStyle}
          disabled={isSubmitting}
        >
          <span 
            className={cn(
              hasTextGradient && "text-gradient-clip",
              buttonTextSize
            )}
            style={buttonTextWrapperStyle}
          >
            {canEdit ? (
              <EditableText
                value={buttonText}
                onChange={handleButtonTextChange}
                as="span"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={buttonTextStyles}
                onStyleChange={handleButtonTextStyleChange}
              />
            ) : (
              isSubmitting ? '...' : buttonText
            )}
          </span>
        </Button>
      </div>
      {(subtitle || canEdit) && (
        <div className={cn(
          "text-center text-muted-foreground leading-tight",
          isMobile ? "text-[10px] px-1" : "text-xs"
        )}>
          {canEdit ? (
            <EditableText
              value={subtitle || ''}
              onChange={handleSubtitleChange}
              as="p"
              isPreview={isPreview}
              showToolbar={true}
              richText={true}
              styles={{}}
              onStyleChange={() => {}}
              placeholder="Add subtitle..."
            />
          ) : (
            subtitle
          )}
        </div>
      )}
    </form>
  );
}
