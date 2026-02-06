import React, { useState, useEffect, useCallback } from 'react';
import { EmailCaptureContent, ButtonContent, ConsentSettings } from '@/funnel-builder-v3/types/funnel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { toast } from 'sonner';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

// Default submit button configuration
const defaultSubmitButton: ButtonContent = {
  text: 'Subscribe',
  variant: 'primary',
  size: 'md',
  action: 'next-step',
  fullWidth: false,
  backgroundColor: '#3b82f6',
  color: '#ffffff',
};

// Default consent settings
const defaultConsent: ConsentSettings = {
  enabled: false,
  text: 'I have read and accept the',
  linkText: 'privacy policy',
  linkUrl: '#',
  required: true,
};

interface EmailCaptureBlockProps {
  content: EmailCaptureContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function EmailCaptureBlock({ content, blockId, stepId, isPreview }: EmailCaptureBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const currentViewport = funnelContext?.currentViewport ?? 'mobile';
  const selectedChildElement = funnelContext?.selectedChildElement ?? null;
  const setSelectedChildElement = funnelContext?.setSelectedChildElement ?? (() => {});
  const { 
    placeholder, 
    subtitle,
    subtitleColor,
    submitButton = defaultSubmitButton,
    consent = defaultConsent,
  } = content;
  
  // Get step background color for dynamic color context
  const currentStep = funnelContext?.funnel?.steps?.find(s => s.id === stepId);
  const stepBackgroundColor = currentStep?.settings?.backgroundColor || '#ffffff';
  
  // If subtitleColor is not set, calculate it from background
  const effectiveSubtitleColor = subtitleColor || (stepBackgroundColor ? 
    (() => {
      // Simple luminance check - if dark background, use white; if light, use dark
      const rgb = stepBackgroundColor.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (rgb) {
        const r = parseInt(rgb[1], 16);
        const g = parseInt(rgb[2], 16);
        const b = parseInt(rgb[3], 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5 ? '#ffffff' : '#6b7280';
      }
      return '#6b7280'; // Default muted color
    })() : '#6b7280');
  const [email, setEmail] = useState('');
  const [hasConsented, setHasConsented] = useState(false);

  const canEdit = blockId && stepId && !isPreview;
  const isMobile = currentViewport === 'mobile';
  const isButtonSelected = !isPreview && selectedChildElement === 'submit-button';
  const hasChildSelected = !!selectedChildElement;
  
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'email-capture',
    hintText: 'Click to edit email capture',
    isEditing: hasChildSelected // Disable overlay when child is selected
  });
  
  // Get button text for sizing calculations
  const buttonText = submitButton.text || 'Subscribe';
  
  // Context-aware text sizing based on content length
  const getButtonTextSize = () => {
    const textLength = buttonText.length || 0;
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

  // Load saved email from runtime
  useEffect(() => {
    if (runtime) {
      const savedEmail = runtime.formData['email'];
      if (typeof savedEmail === 'string') {
        setEmail(savedEmail);
      }
    }
  }, [runtime]);

  // Shared submission logic - called by both button click (direct) and Enter key (form submit)
  const doSubmit = () => {
    if (!runtime) return; // Editor mode

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    // Validate consent if required
    if (consent.enabled && consent.required && !hasConsented) {
      toast.error('Please accept the privacy policy to continue');
      return;
    }

    // Save to runtime
    runtime.setFormField('email', email);
    
    try {
      // Handle action based on submitButton configuration
      const action = submitButton.action || 'next-step';
      const actionValue = submitButton.actionValue;

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
          // Fire-and-forget submission (don't block UI)
          runtime.submitForm(
            consent.enabled ? {
              agreed: hasConsented,
              privacyPolicyUrl: consent.linkUrl,
            } : undefined
          ).catch((error) => {
            console.error('[EmailCaptureBlock] submitForm error:', error);
          });
          break;
        case 'next-step':
        default:
          // Fire-and-forget submission, then navigate immediately
          runtime.submitForm(
            consent.enabled ? {
              agreed: hasConsented,
              privacyPolicyUrl: consent.linkUrl,
            } : undefined
          ).catch((error) => {
            console.error('[EmailCaptureBlock] submitForm error:', error);
          });
          // Navigate immediately without waiting for submission
          if (actionValue && !actionValue.startsWith('http') && !actionValue.startsWith('#')) {
            runtime.goToStep(actionValue);
          } else {
            runtime.goToNextStep();
          }
          break;
      }
    } catch (error) {
      console.error('[EmailCaptureBlock] doSubmit unexpected error:', error);
    }
  };

  // Form onSubmit handler - only fires on Enter key since button is type="button"
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  const handleSubtitleChange = useCallback((newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { subtitle: newText });
    }
  }, [blockId, stepId, updateBlockContent]);

  // Handle button click - select in editor, submit directly in preview
  const handleButtonClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedChildElement('submit-button');
    } else {
      doSubmit();
    }
  };

  // Button styling from ButtonContent
  const { 
    text, 
    variant = 'primary', 
    size = 'md', 
    backgroundColor, 
    backgroundGradient, 
    color, 
    textGradient, 
    borderColor, 
    borderWidth, 
    fontSize 
  } = submitButton;
  
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

  const formElement = (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
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
          type="button"
          variant={hasCustomBg ? 'ghost' : (variant === 'primary' ? 'default' : variant)}
          onClick={handleButtonClick}
          className={cn(
            "shrink-0 whitespace-nowrap",
            isMobile ? "h-9 px-3" : "h-12 px-6",
            hasCustomBg && "hover:opacity-90",
            isButtonSelected && "ring-2 ring-primary ring-offset-2"
          )}
          style={{ ...customStyle, touchAction: 'manipulation' as const }}
        >
          <span 
            className={cn(
              hasTextGradient && "text-gradient-clip",
              buttonTextSize
            )}
            style={hasTextGradient ? { '--text-gradient': textGradient } as React.CSSProperties : undefined}
          >
            {text || 'Subscribe'}
          </span>
        </Button>
      </div>

      {/* Privacy Consent Checkbox */}
      {consent.enabled && (
        <div className="flex items-start gap-3 py-2">
          <Checkbox
            id="privacy-consent-email"
            checked={hasConsented}
            onCheckedChange={(checked) => setHasConsented(checked === true)}
            className="mt-0.5"
          />
          <label 
            htmlFor="privacy-consent-email" 
            className={cn(
              "leading-relaxed cursor-pointer select-none",
              !consent.textColor && "text-muted-foreground",
              isMobile ? "text-[10px]" : "text-sm"
            )}
            style={consent.textColor ? { color: consent.textColor } : undefined}
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

      {(subtitle || canEdit) && (
        <div 
          className={cn(
            "text-center leading-tight",
            isMobile ? "text-[10px] px-1" : "text-xs"
          )}
          style={{ color: effectiveSubtitleColor }}
        >
          {canEdit ? (
            <EditableText
              value={subtitle || ''}
              onChange={handleSubtitleChange}
              as="p"
              isPreview={isPreview}
              showToolbar={true}
              richText={true}
              styles={{ color: effectiveSubtitleColor }}
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

  return wrapWithOverlay(formElement);
}
