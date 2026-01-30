import React, { useState, useEffect } from 'react';
import { PhoneCaptureContent } from '@/funnel-builder-v3/types/funnel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSimpleStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';

interface PhoneCaptureBlockProps {
  content: PhoneCaptureContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function PhoneCaptureBlock({ content, blockId, stepId, isPreview }: PhoneCaptureBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent } = useFunnel();
  const { 
    placeholder, 
    buttonText, 
    defaultCountry, 
    buttonColor, 
    buttonGradient,
    buttonTextColor,
    buttonTextGradient
  } = content;
  const [phone, setPhone] = useState('');
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

  // Load saved phone from runtime
  useEffect(() => {
    if (runtime) {
      const savedPhone = runtime.formData['phone'];
      if (typeof savedPhone === 'string') {
        setPhone(savedPhone);
      }
    }
  }, [runtime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!runtime) return; // Editor mode

    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    // Save to runtime
    runtime.setFormField('phone', phone);
    
    setIsSubmitting(true);
    
    try {
      // Navigate to next step
      runtime.goToNextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonTextChange = (newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { buttonText: newText });
    }
  };

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
        <div className="flex items-center gap-2 px-3 bg-muted rounded-l-lg border border-r-0 border-input">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {defaultCountry || '+1'}
          </span>
        </div>
        <Input
          type="tel"
          placeholder={placeholder || 'Enter your phone number'}
          className="flex-1 rounded-l-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <Button 
        type="submit"
        className={cn("w-full", hasCustomBg && "hover:opacity-90")}
        variant={hasCustomBg ? "ghost" : "default"}
        style={buttonStyle}
        size="lg"
        disabled={isSubmitting}
      >
        <span 
          className={cn(hasTextGradient && "text-gradient-clip")}
          style={buttonTextWrapperStyle}
        >
          {canEdit ? (
            <EditableText
              value={buttonText || 'Get Started'}
              onChange={handleButtonTextChange}
              as="span"
              isPreview={isPreview}
              showToolbar={true}
              richText={true}
              styles={buttonTextStyles}
              onStyleChange={handleButtonTextStyleChange}
            />
          ) : (
            isSubmitting ? 'Submitting...' : (buttonText || 'Get Started')
          )}
        </span>
      </Button>
    </form>
  );
}
