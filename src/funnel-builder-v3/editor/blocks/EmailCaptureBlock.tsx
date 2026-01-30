import React, { useState, useEffect, useCallback } from 'react';
import { EmailCaptureContent, TextStyles } from '@/types/funnel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFunnelRuntimeOptional } from '@/context/FunnelRuntimeContext';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';
import { toast } from 'sonner';
import { useSimpleStyleSync } from '@/hooks/useEditableStyleSync';

interface EmailCaptureBlockProps {
  content: EmailCaptureContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function EmailCaptureBlock({ content, blockId, stepId, isPreview }: EmailCaptureBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent } = useFunnel();
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder={placeholder}
          className="flex-1 h-12"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button 
          type="submit"
          className={cn("h-12 px-6 shrink-0", hasCustomBg && "hover:opacity-90")}
          variant={hasCustomBg ? "ghost" : "default"}
          style={buttonStyle}
          disabled={isSubmitting}
        >
          <span 
            className={cn(hasTextGradient && "text-gradient-clip")}
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
        <div className="text-xs text-center text-muted-foreground">
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
