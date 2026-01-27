// ApplicationStepRenderer - Single unified renderer for ALL step types
// Used in builder canvas, flow modal, and public runtime

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  ApplicationStep, 
  ApplicationStepType,
  ApplicationAnswerValue,
  ApplicationEngineAppearance,
} from '../types/applicationEngine';
import { Checkbox } from '@/components/ui/checkbox';

export interface ApplicationStepRendererProps {
  step: ApplicationStep;
  value: ApplicationAnswerValue;
  onChange: (value: ApplicationAnswerValue) => void;
  onSubmit: () => void;
  validationError?: string;
  appearance?: ApplicationEngineAppearance;
  isPreview?: boolean;       // True in builder - disables interactions
  isSelected?: boolean;      // True when selected in builder
  onSelect?: () => void;     // Click handler for builder selection
  // Consent props
  showConsentCheckbox?: boolean;
  consentChecked?: boolean;
  onConsentChange?: (checked: boolean) => void;
  consentMessage?: string;
  privacyPolicyUrl?: string;
  consentError?: string;
}

export const ApplicationStepRenderer: React.FC<ApplicationStepRendererProps> = ({
  step,
  value,
  onChange,
  onSubmit,
  validationError,
  appearance = {},
  isPreview = false,
  isSelected = false,
  onSelect,
  showConsentCheckbox = false,
  consentChecked = false,
  onConsentChange,
  consentMessage = 'I agree to the Privacy Policy',
  privacyPolicyUrl,
  consentError,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when step becomes active (not in preview)
  useEffect(() => {
    if (!isPreview && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step.id, isPreview]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPreview) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Style configuration
  const textColor = appearance.textColor || '#ffffff';
  const inputBg = appearance.inputBackground || 'rgba(255,255,255,0.1)';
  const inputBorder = appearance.inputBorderColor || 'rgba(255,255,255,0.2)';
  const inputText = appearance.inputTextColor || '#ffffff';
  const accentColor = appearance.accentColor || '#6366f1';

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    color: inputText,
    borderRadius: '12px',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: accentColor,
    color: '#ffffff',
    borderRadius: '12px',
  };

  // Render based on step type
  const renderInput = () => {
    switch (step.type) {
      case 'open-ended':
        return (
          <input
            ref={inputRef}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={step.settings.placeholder || 'Type your answer...'}
            className="w-full px-4 py-3 text-base outline-none transition-colors"
            style={inputStyle}
            disabled={isPreview}
          />
        );

      case 'email':
        return (
          <input
            ref={inputRef}
            type="email"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={step.settings.placeholder || 'your@email.com'}
            className="w-full px-4 py-3 text-base outline-none transition-colors"
            style={inputStyle}
            disabled={isPreview}
          />
        );

      case 'phone':
        return (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="tel"
              value={(value as string) || ''}
              onChange={(e) => onChange(formatPhoneInternational(e.target.value))}
              onKeyDown={handleKeyDown}
              placeholder={step.settings.placeholder || '+1 (555) 123-4567'}
              className="flex-1 px-4 py-3 text-base outline-none transition-colors"
              style={inputStyle}
              disabled={isPreview}
            />
          </div>
        );

      case 'name':
        return (
          <input
            ref={inputRef}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={step.settings.placeholder || 'Your name'}
            className="w-full px-4 py-3 text-base outline-none transition-colors"
            style={inputStyle}
            disabled={isPreview}
          />
        );

      case 'full-identity':
        return <FullIdentityInput step={step} value={value} onChange={onChange} inputStyle={inputStyle} isPreview={isPreview} />;

      case 'single-choice':
      case 'yes-no':
        return (
          <div className="space-y-2">
            {(step.settings.choices || []).map((choice) => (
              <button
                key={choice.id}
                onClick={() => !isPreview && onChange(choice.id)}
                className={cn(
                  'w-full px-4 py-3 text-left rounded-xl transition-all border-2',
                  value === choice.id
                    ? 'border-current'
                    : 'border-transparent hover:border-white/20'
                )}
                style={{
                  ...inputStyle,
                  borderColor: value === choice.id ? accentColor : 'transparent',
                }}
                disabled={isPreview}
              >
                <span className="flex items-center gap-3">
                  {choice.emoji && <span className="text-lg">{choice.emoji}</span>}
                  <span>{choice.label}</span>
                </span>
              </button>
            ))}
          </div>
        );

      case 'multi-choice':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {(step.settings.choices || []).map((choice) => {
              const isSelected = selectedValues.includes(choice.id);
              return (
                <button
                  key={choice.id}
                  onClick={() => {
                    if (isPreview) return;
                    const newValues = isSelected
                      ? selectedValues.filter((v) => v !== choice.id)
                      : [...selectedValues, choice.id];
                    onChange(newValues);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left rounded-xl transition-all border-2',
                    isSelected ? 'border-current' : 'border-transparent hover:border-white/20'
                  )}
                  style={{
                    ...inputStyle,
                    borderColor: isSelected ? accentColor : 'transparent',
                  }}
                  disabled={isPreview}
                >
                  <span className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected ? 'bg-current border-current' : 'border-white/30'
                      )}
                      style={{ borderColor: isSelected ? accentColor : undefined, backgroundColor: isSelected ? accentColor : 'transparent' }}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {choice.emoji && <span className="text-lg">{choice.emoji}</span>}
                    <span>{choice.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        );

      case 'scale':
        const min = step.settings.scaleMin || 1;
        const max = step.settings.scaleMax || 10;
        const scaleValues = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        return (
          <div className="space-y-3">
            <div className="flex justify-between gap-1">
              {scaleValues.map((num) => (
                <button
                  key={num}
                  onClick={() => !isPreview && onChange(num)}
                  className={cn(
                    'flex-1 py-3 rounded-lg transition-all font-medium',
                    value === num ? 'ring-2 ring-offset-2' : 'hover:opacity-80'
                  )}
                  style={{
                    ...inputStyle,
                    backgroundColor: value === num ? accentColor : inputBg,
                  }}
                  disabled={isPreview}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm opacity-60" style={{ color: textColor }}>
              <span>{step.settings.scaleMinLabel || 'Not likely'}</span>
              <span>{step.settings.scaleMaxLabel || 'Very likely'}</span>
            </div>
          </div>
        );

      case 'date':
        return (
          <input
            ref={inputRef}
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 text-base outline-none transition-colors"
            style={inputStyle}
            disabled={isPreview}
          />
        );

      case 'welcome':
      case 'ending':
        return null; // No input for welcome/ending screens

      default:
        return (
          <p className="text-sm opacity-60">Unknown step type: {step.type}</p>
        );
    }
  };

  return (
    <div
      className={cn(
        'w-full max-w-md mx-auto space-y-6',
        isSelected && 'ring-2 ring-primary ring-offset-2 rounded-xl',
        isPreview && 'pointer-events-none'
      )}
      onClick={onSelect}
    >
      {/* Title */}
      {step.settings.title && (
        <h2
          className={cn(
            'font-bold',
            step.settings.titleSize === 'sm' && 'text-lg',
            step.settings.titleSize === 'md' && 'text-xl',
            step.settings.titleSize === 'lg' && 'text-2xl',
            step.settings.titleSize === 'xl' && 'text-3xl',
            step.settings.titleSize === '2xl' && 'text-4xl',
            step.settings.titleSize === '3xl' && 'text-5xl',
            !step.settings.titleSize && 'text-2xl',
            step.settings.align === 'left' && 'text-left',
            step.settings.align === 'center' && 'text-center',
            step.settings.align === 'right' && 'text-right',
            !step.settings.align && 'text-center'
          )}
          style={{ color: textColor }}
        >
          {step.settings.title}
        </h2>
      )}

      {/* Description */}
      {step.settings.description && (
        <p
          className={cn(
            'text-base opacity-70',
            step.settings.align === 'left' && 'text-left',
            step.settings.align === 'center' && 'text-center',
            step.settings.align === 'right' && 'text-right',
            !step.settings.align && 'text-center'
          )}
          style={{ color: textColor }}
        >
          {step.settings.description}
        </p>
      )}

      {/* Input */}
      {renderInput()}

      {/* Validation Error */}
      {validationError && (
        <p className="text-red-400 text-sm text-center">{validationError}</p>
      )}

      {/* Consent Checkbox */}
      {showConsentCheckbox && (
        <div
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg border',
            consentError ? 'border-red-400' : 'border-white/20'
          )}
          style={{ backgroundColor: inputBg }}
        >
          <Checkbox
            id="consent-checkbox"
            checked={consentChecked}
            onCheckedChange={(checked) => onConsentChange?.(checked === true)}
            disabled={isPreview}
            className="mt-0.5"
          />
          <label htmlFor="consent-checkbox" className="text-sm" style={{ color: textColor }}>
            {consentMessage}{' '}
            {privacyPolicyUrl && (
              <a
                href={privacyPolicyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                Privacy Policy
              </a>
            )}
          </label>
        </div>
      )}
      {consentError && (
        <p className="text-red-400 text-sm text-center">{consentError}</p>
      )}

      {/* Submit Button (not for welcome screens unless explicitly needed) */}
      {step.type !== 'welcome' && step.type !== 'ending' && (
        <button
          onClick={() => !isPreview && onSubmit()}
          className="w-full px-6 py-4 font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={buttonStyle}
          disabled={isPreview}
        >
          {step.settings.buttonText || 'Continue'}
        </button>
      )}

      {/* Welcome/Ending have a "Get Started" / "Done" button */}
      {(step.type === 'welcome' || step.type === 'ending') && (
        <button
          onClick={() => !isPreview && onSubmit()}
          className="w-full px-6 py-4 font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={buttonStyle}
          disabled={isPreview}
        >
          {step.settings.buttonText || (step.type === 'welcome' ? 'Get Started' : 'Done')}
        </button>
      )}
    </div>
  );
};

// ============ FULL IDENTITY INPUT ============

interface FullIdentityInputProps {
  step: ApplicationStep;
  value: ApplicationAnswerValue;
  onChange: (value: ApplicationAnswerValue) => void;
  inputStyle: React.CSSProperties;
  isPreview: boolean;
}

const FullIdentityInput: React.FC<FullIdentityInputProps> = ({
  step,
  value,
  onChange,
  inputStyle,
  isPreview,
}) => {
  const identityValue = (value as { name?: string; email?: string; phone?: string }) || {};

  const update = (field: 'name' | 'email' | 'phone', val: string) => {
    onChange({ ...identityValue, [field]: val });
  };

  return (
    <div className="space-y-3">
      {step.settings.collectName !== false && (
        <input
          type="text"
          value={identityValue.name || ''}
          onChange={(e) => update('name', e.target.value)}
          placeholder={step.settings.namePlaceholder || 'Your name'}
          className="w-full px-4 py-3 text-base outline-none transition-colors"
          style={inputStyle}
          disabled={isPreview}
        />
      )}
      {step.settings.collectEmail !== false && (
        <input
          type="email"
          value={identityValue.email || ''}
          onChange={(e) => update('email', e.target.value)}
          placeholder={step.settings.emailPlaceholder || 'Your email'}
          className="w-full px-4 py-3 text-base outline-none transition-colors"
          style={inputStyle}
          disabled={isPreview}
        />
      )}
      {step.settings.collectPhone !== false && (
        <div className="flex items-center gap-2">
          <input
            type="tel"
            value={identityValue.phone || ''}
            onChange={(e) => update('phone', formatPhoneInternational(e.target.value))}
            placeholder={step.settings.phonePlaceholder || '+1 (555) 123-4567'}
            className="flex-1 px-4 py-3 text-base outline-none transition-colors"
            style={inputStyle}
            disabled={isPreview}
          />
        </div>
      )}
    </div>
  );
};

// ============ UTILITIES ============

/**
 * FIXED: Phone formatting that supports international numbers.
 * Preserves international format (starting with +) without truncation.
 */
function formatPhoneInternational(input: string): string {
  // Preserve international format - just clean non-digit except leading +
  if (input.startsWith('+')) {
    return '+' + input.slice(1).replace(/[^\d]/g, '');
  }
  
  // US formatting for domestic numbers
  const digits = input.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  
  // Allow more than 10 digits (could be international without +)
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default ApplicationStepRenderer;
