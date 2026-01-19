/**
 * RuntimeInput - Interactive form inputs for published funnels
 * 
 * These components bind to FunnelRuntimeContext for live form state
 */

import React from 'react';
import { useFunnelRuntimeOptional } from './FunnelRuntimeContext';
import { cn } from '@/lib/utils';
import { Mail, Phone, User, AlignLeft } from 'lucide-react';

interface BaseInputProps {
  fieldKey?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  nodeId?: string;
}

// ============================================================================
// TEXT INPUT
// ============================================================================

interface RuntimeTextInputProps extends BaseInputProps {
  label?: string;
}

export function RuntimeTextInput({
  fieldKey = 'text',
  placeholder = 'Enter text...',
  required = false,
  label,
  className,
}: RuntimeTextInputProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const value = runtime?.state.formData[fieldKey] || '';
  const onChange = runtime?.actions.updateField;
  const isReadOnly = !runtime;

  return (
    <div className={cn('builder-input-wrapper', className)}>
      {label && (
        <label className="builder-input-label text-sm text-white/70 mb-2 block">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(fieldKey, e.target.value)}
          placeholder={placeholder}
          required={required}
          readOnly={isReadOnly}
          className={cn(
            'builder-input builder-input--text w-full pl-10 pr-4 py-3',
            'bg-white/10 border border-white/20 rounded-lg',
            'text-white placeholder:text-white/40',
            'focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20',
            'transition-all duration-200',
            isReadOnly && 'cursor-default'
          )}
        />
      </div>
    </div>
  );
}

// ============================================================================
// EMAIL INPUT
// ============================================================================

interface RuntimeEmailInputProps extends BaseInputProps {}

export function RuntimeEmailInput({
  fieldKey = 'email',
  placeholder = 'you@example.com',
  required = true,
  className,
}: RuntimeEmailInputProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const value = runtime?.state.formData[fieldKey] || '';
  const onChange = runtime?.actions.updateField;
  const isReadOnly = !runtime;

  return (
    <div className={cn('builder-input-wrapper', className)}>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="email"
          value={value}
          onChange={(e) => onChange?.(fieldKey, e.target.value)}
          placeholder={placeholder}
          required={required}
          readOnly={isReadOnly}
          className={cn(
            'builder-input builder-input--email w-full pl-10 pr-4 py-3',
            'bg-white/10 border border-white/20 rounded-lg',
            'text-white placeholder:text-white/40',
            'focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20',
            'transition-all duration-200',
            isReadOnly && 'cursor-default'
          )}
        />
      </div>
    </div>
  );
}

// ============================================================================
// PHONE INPUT
// ============================================================================

interface RuntimePhoneInputProps extends BaseInputProps {}

export function RuntimePhoneInput({
  fieldKey = 'phone',
  placeholder = '+1 (555) 123-4567',
  required = false,
  className,
}: RuntimePhoneInputProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const value = runtime?.state.formData[fieldKey] || '';
  const onChange = runtime?.actions.updateField;
  const isReadOnly = !runtime;

  // Simple phone formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 10) input = input.slice(0, 11);
    
    let formatted = '';
    if (input.length > 0) {
      if (input.length <= 3) {
        formatted = `(${input}`;
      } else if (input.length <= 6) {
        formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
      } else {
        formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6)}`;
      }
    }
    
    onChange?.(fieldKey, formatted || input);
  };

  return (
    <div className={cn('builder-input-wrapper', className)}>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          readOnly={isReadOnly}
          className={cn(
            'builder-input builder-input--phone w-full pl-10 pr-4 py-3',
            'bg-white/10 border border-white/20 rounded-lg',
            'text-white placeholder:text-white/40',
            'focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20',
            'transition-all duration-200',
            isReadOnly && 'cursor-default'
          )}
        />
      </div>
    </div>
  );
}

// ============================================================================
// NAME INPUT
// ============================================================================

interface RuntimeNameInputProps extends BaseInputProps {}

export function RuntimeNameInput({
  fieldKey = 'name',
  placeholder = 'Your name',
  required = true,
  className,
}: RuntimeNameInputProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const value = runtime?.state.formData[fieldKey] || '';
  const onChange = runtime?.actions.updateField;
  const isReadOnly = !runtime;

  return (
    <div className={cn('builder-input-wrapper', className)}>
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(fieldKey, e.target.value)}
          placeholder={placeholder}
          required={required}
          readOnly={isReadOnly}
          className={cn(
            'builder-input builder-input--name w-full pl-10 pr-4 py-3',
            'bg-white/10 border border-white/20 rounded-lg',
            'text-white placeholder:text-white/40',
            'focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20',
            'transition-all duration-200',
            isReadOnly && 'cursor-default'
          )}
        />
      </div>
    </div>
  );
}

// ============================================================================
// CONSENT CHECKBOX
// ============================================================================

interface RuntimeConsentCheckboxProps {
  label?: string;
  required?: boolean;
  className?: string;
  privacyPolicyUrl?: string;
}

export function RuntimeConsentCheckbox({
  label = 'I agree to the terms and conditions',
  required = false,
  className,
  privacyPolicyUrl,
}: RuntimeConsentCheckboxProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const checked = runtime?.state.hasConsent || false;
  const onChange = runtime?.actions.toggleConsent;
  const isReadOnly = !runtime;

  return (
    <label className={cn(
      'builder-consent-checkbox flex items-start gap-3 cursor-pointer',
      isReadOnly && 'cursor-default',
      className
    )}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange?.()}
        required={required}
        disabled={isReadOnly}
        className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-primary focus:ring-primary/50"
      />
      <span className="text-sm text-white/70">
        {label}
        {privacyPolicyUrl && (
          <>
            {' '}
            <a 
              href={privacyPolicyUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
          </>
        )}
      </span>
    </label>
  );
}
