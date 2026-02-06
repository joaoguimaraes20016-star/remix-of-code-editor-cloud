import React, { useState, useEffect } from 'react';
import { PhoneCaptureContent, ButtonContent, ConsentSettings, CountryCode } from '@/funnel-builder-v3/types/funnel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';
import { validatePhone } from '@/lib/validation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Default consent settings
const defaultConsent: ConsentSettings = {
  enabled: false,
  text: 'I have read and accept the',
  linkText: 'privacy policy',
  linkUrl: '#',
  required: true,
};

// Default country codes fallback
const defaultCountryCodes: CountryCode[] = [
  { id: '1', code: '+1', name: 'United States', flag: '🇺🇸' },
];

// Default submit button configuration
const defaultSubmitButton: ButtonContent = {
  text: 'Call Me',
  variant: 'primary',
  size: 'lg',
  action: 'next-step',
  fullWidth: true,
  backgroundColor: '#3b82f6',
  color: '#ffffff',
};

interface PhoneCaptureBlockProps {
  content: PhoneCaptureContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function PhoneCaptureBlock({ content, blockId, stepId, isPreview }: PhoneCaptureBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const funnelContext = useFunnelOptional();
  const selectedChildElement = funnelContext?.selectedChildElement ?? null;
  const setSelectedChildElement = funnelContext?.setSelectedChildElement ?? (() => {});
  const globalCountryCodes = funnelContext?.countryCodes ?? defaultCountryCodes;
  const globalDefaultCountryId = funnelContext?.defaultCountryId ?? 'us';
  const { 
    placeholder, 
    submitButton = defaultSubmitButton,
    consent = defaultConsent,
  } = content;
  
  // Use global country codes from funnel context
  const countryCodes = globalCountryCodes && globalCountryCodes.length > 0 
    ? globalCountryCodes 
    : defaultCountryCodes;
  
  const [phone, setPhone] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState(
    globalDefaultCountryId || countryCodes[0]?.id || '1'
  );

  const selectedCountry = countryCodes.find(c => c.id === selectedCountryId) || countryCodes[0];
  const isButtonSelected = !isPreview && selectedChildElement === 'submit-button';
  const isPhoneInputSelected = !isPreview && selectedChildElement === 'phone-input';
  const hasChildSelected = !!selectedChildElement;

  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'phone-capture',
    hintText: 'Click to edit phone capture',
    isEditing: hasChildSelected // Disable overlay when child is selected
  });

  // Load saved phone from runtime
  useEffect(() => {
    if (runtime) {
      const savedPhone = runtime.formData['phone'];
      if (typeof savedPhone === 'string') {
        setPhone(savedPhone);
      }
    }
  }, [runtime]);

  // Shared submission logic - called by both button click (direct) and Enter key (form submit)
  const doSubmit = () => {
    if (!runtime) return; // Editor mode

    // Validate phone number format
    // Map country ID to ISO country code (e.g., 'us' -> 'US', '1' -> 'US')
    // If selectedCountryId is numeric, try to map it to ISO code
    let countryCodeForValidation = selectedCountryId;
    if (selectedCountryId === '1' || selectedCountry?.code === '+1') {
      countryCodeForValidation = 'US';
    } else if (selectedCountryId.length === 2) {
      // Assume it's already an ISO code like 'us', 'uk', etc.
      countryCodeForValidation = selectedCountryId.toUpperCase();
    } else {
      // Fallback to US if we can't determine
      countryCodeForValidation = 'US';
    }
    
    const validation = validatePhone(phone, countryCodeForValidation);
    if (!validation.valid) {
      toast.error(validation.error || 'Please enter a valid phone number');
      return;
    }

    // Use formatted number if available, otherwise construct from country code
    const fullPhoneNumber = validation.formatted || (selectedCountry ? `${selectedCountry.code}${phone}` : phone);
    runtime.setFormField('phone', fullPhoneNumber);
    runtime.setFormField('phoneCountryCode', selectedCountry?.code || '');
    
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
            console.error('[PhoneCaptureBlock] submitForm error:', error);
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
            console.error('[PhoneCaptureBlock] submitForm error:', error);
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
      console.error('[PhoneCaptureBlock] doSubmit unexpected error:', error);
    }
  };

  // Form onSubmit handler - only fires on Enter key since button is type="button"
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

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
    size = 'lg', 
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

  const canEdit = blockId && stepId && !isPreview;

  const formElement = (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div 
        className={cn(
          "flex gap-2 relative p-1 -m-1 rounded-lg transition-all",
          canEdit && "cursor-pointer hover:ring-2 hover:ring-primary/50",
          isPhoneInputSelected && "ring-2 ring-primary"
        )}
        onClick={(e) => {
          if (canEdit) {
            e.preventDefault();
            e.stopPropagation();
            setSelectedChildElement('phone-input');
          }
        }}
      >
        <div
          onClick={(e) => {
            // Prevent opening country codes inspector when clicking selector
            e.stopPropagation();
          }}
        >
          <Select
            value={selectedCountryId}
            onValueChange={setSelectedCountryId}
            disabled={canEdit}
          >
            <SelectTrigger className="w-[80px] shrink-0 rounded-r-none border-r-0 bg-muted">
              <span className="text-sm font-medium">
                {selectedCountry?.flag} {selectedCountry?.code}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-popover max-h-[300px]">
              {countryCodes.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span className="font-medium">{country.code}</span>
                    <span className="text-muted-foreground text-xs">{country.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          type="tel"
          placeholder={placeholder || 'Enter your phone number'}
          className="flex-1 rounded-l-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onFocus={(e) => {
            if (canEdit) {
              e.preventDefault();
              e.target.blur();
            }
          }}
          onClick={(e) => {
            if (canEdit) {
              e.preventDefault();
              e.stopPropagation();
              setSelectedChildElement('phone-input');
            }
          }}
          readOnly={canEdit}
        />
      </div>

      {/* Privacy Consent Checkbox */}
      {consent.enabled && (
        <div className="flex items-start gap-3 py-2">
          <Checkbox
            id="privacy-consent-phone"
            checked={hasConsented}
            onCheckedChange={(checked) => setHasConsented(checked === true)}
            className="mt-0.5"
          />
          <label 
            htmlFor="privacy-consent-phone" 
            className={cn("text-sm leading-relaxed cursor-pointer select-none", !consent.textColor && "text-muted-foreground")}
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

      <Button 
        type="button"
        variant={hasCustomBg ? 'ghost' : (variant === 'primary' ? 'default' : variant)}
        onClick={handleButtonClick}
        className={cn(
          sizeClasses[size],
          fullWidth && 'w-full',
          hasCustomBg && 'hover:opacity-90',
          'font-medium rounded-xl',
          isButtonSelected && 'ring-2 ring-primary ring-offset-2'
        )}
        style={{ ...customStyle, touchAction: 'manipulation' as const }}
      >
        {hasTextGradient ? (
          <span
            className="text-gradient-clip"
            style={{ '--text-gradient': textGradient } as React.CSSProperties}
          >
            {text || 'Call Me'}
          </span>
        ) : (
          text || 'Call Me'
        )}
      </Button>
    </form>
  );

  return wrapWithOverlay(formElement);
}
