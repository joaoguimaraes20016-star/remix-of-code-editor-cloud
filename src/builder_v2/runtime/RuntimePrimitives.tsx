/**
 * Runtime Primitives - Interactive versions of builder primitives
 * These wrap the static primitives with FunnelRuntimeContext bindings
 * for form state, submission handling, and interactivity on published pages.
 */

import { cn } from '@/lib/utils';
import { Mail, Phone, Loader2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useFunnelRuntimeOptional } from '@/flow-canvas/components/runtime/FunnelRuntimeContext';
import { UnifiedButton, presetToVariant, sizeToVariant } from '@/components/builder/UnifiedButton';

// ============================================================================
// RUNTIME TEXT INPUT
// ============================================================================

interface RuntimeTextInputProps {
  placeholder?: string;
  fieldName?: string;
  required?: boolean;
  className?: string;
  borderRadius?: number;
  backgroundColor?: string;
  color?: string;
}

export function RuntimeTextInput({ 
  placeholder = 'Type here...', 
  fieldName = 'text',
  required = false,
  className,
  borderRadius,
  backgroundColor,
  color,
}: RuntimeTextInputProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const style: CSSProperties = {};
  if (borderRadius !== undefined) style.borderRadius = `${borderRadius}px`;
  if (backgroundColor && backgroundColor !== 'transparent') style.backgroundColor = backgroundColor;
  if (color) style.color = color;

  const value = runtime?.state.formData[fieldName] || '';
  const fieldError = runtime?.state.fieldErrors?.[fieldName];
  const hasError = Boolean(fieldError);

  return (
    <div className="builder-input-field">
      <input
        type="text"
        placeholder={placeholder}
        className={cn('builder-input builder-input--text', hasError && 'builder-input--error', className)}
        style={style}
        value={value}
        onChange={(e) => runtime?.actions.updateField(fieldName, e.target.value)}
        onBlur={() => {
          if (required && runtime) {
            const error = runtime.actions.validateField(fieldName, value, { required });
            if (error) {
              // Trigger validation on blur
            }
          }
        }}
        required={required}
        readOnly={!runtime}
      />
      {hasError && <span className="builder-input-error">{fieldError}</span>}
    </div>
  );
}

// ============================================================================
// RUNTIME EMAIL INPUT
// ============================================================================

interface RuntimeEmailInputProps {
  placeholder?: string;
  fieldName?: string;
  required?: boolean;
  className?: string;
  borderRadius?: number;
  backgroundColor?: string;
  color?: string;
}

export function RuntimeEmailInput({ 
  placeholder = 'you@example.com', 
  fieldName = 'email',
  required = true,
  className,
  borderRadius,
  backgroundColor,
  color,
}: RuntimeEmailInputProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const style: CSSProperties = {};
  if (borderRadius !== undefined) style.borderRadius = `${borderRadius}px`;
  if (backgroundColor && backgroundColor !== 'transparent') style.backgroundColor = backgroundColor;
  if (color) style.color = color;

  const value = runtime?.state.formData[fieldName] || '';
  const fieldError = runtime?.state.fieldErrors?.[fieldName];
  const hasError = Boolean(fieldError);

  return (
    <div className="builder-input-field">
      <div className={cn('builder-input-wrapper', hasError && 'builder-input-wrapper--error', className)}>
        <Mail className="builder-input-icon" size={18} />
        <input
          type="email"
          placeholder={placeholder}
          className="builder-input builder-input--email"
          style={style}
          value={value}
          onChange={(e) => runtime?.actions.updateField(fieldName, e.target.value)}
          onBlur={() => {
            if (runtime) {
              const error = runtime.actions.validateField(fieldName, value, { required, type: 'email' });
              // Error will be set in the state
            }
          }}
          required={required}
          readOnly={!runtime}
        />
      </div>
      {hasError && <span className="builder-input-error">{fieldError}</span>}
    </div>
  );
}

// ============================================================================
// RUNTIME PHONE INPUT
// ============================================================================

interface RuntimePhoneInputProps {
  placeholder?: string;
  fieldName?: string;
  className?: string;
  borderRadius?: number;
  backgroundColor?: string;
  color?: string;
}

export function RuntimePhoneInput({ 
  placeholder = '(555) 123-4567', 
  fieldName = 'phone',
  className,
  borderRadius,
  backgroundColor,
  color,
}: RuntimePhoneInputProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const style: CSSProperties = {};
  if (borderRadius !== undefined) style.borderRadius = `${borderRadius}px`;
  if (backgroundColor && backgroundColor !== 'transparent') style.backgroundColor = backgroundColor;
  if (color) style.color = color;

  const value = runtime?.state.formData[fieldName] || '';
  const fieldError = runtime?.state.fieldErrors?.[fieldName];
  const hasError = Boolean(fieldError);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic phone formatting
    let formatted = e.target.value.replace(/\D/g, '');
    if (formatted.length > 0) {
      if (formatted.length <= 3) {
        formatted = `(${formatted}`;
      } else if (formatted.length <= 6) {
        formatted = `(${formatted.slice(0, 3)}) ${formatted.slice(3)}`;
      } else {
        formatted = `(${formatted.slice(0, 3)}) ${formatted.slice(3, 6)}-${formatted.slice(6, 10)}`;
      }
    }
    runtime?.actions.updateField(fieldName, formatted);
  };

  return (
    <div className="builder-input-field">
      <div className={cn('builder-input-wrapper', hasError && 'builder-input-wrapper--error', className)}>
        <Phone className="builder-input-icon" size={18} />
        <input
          type="tel"
          placeholder={placeholder}
          className="builder-input builder-input--phone"
          style={style}
          value={value}
          onChange={handleChange}
          readOnly={!runtime}
        />
      </div>
      {hasError && <span className="builder-input-error">{fieldError}</span>}
    </div>
  );
}

// ============================================================================
// RUNTIME CTA BUTTON
// ============================================================================

import type { ButtonAction, ButtonActionType } from '@/flow-canvas/shared/types/buttonAction';

interface RuntimeCtaButtonProps {
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  /** Legacy action prop (simple string) */
  action?: 'next' | 'submit' | 'link' | 'prev';
  /** New ButtonAction object from ButtonActionSelector */
  buttonAction?: ButtonAction;
  linkUrl?: string;
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  className?: string;
  backgroundColor?: string;
  color?: string;
  borderRadius?: number;
  shadow?: string;
}

/**
 * Resolve action from either legacy `action` string or new `buttonAction` object
 * Maps ButtonActionType (kebab-case) to runtime action strings
 */
function resolveButtonAction(props: RuntimeCtaButtonProps): { 
  action: string; 
  value?: string; 
  openNewTab?: boolean;
} {
  // Prefer buttonAction if present (new format from ButtonActionSelector)
  if (props.buttonAction?.type) {
    const typeMapping: Record<ButtonActionType, string> = {
      'next-step': 'next',
      'prev-step': 'prev',
      'go-to-step': 'goToStep',
      'submit': 'submit',
      'url': 'url',
      'scroll': 'scroll',
      'phone': 'phone',
      'email': 'email',
      'download': 'download',
    };
    return {
      action: typeMapping[props.buttonAction.type] || 'next',
      value: props.buttonAction.value || props.linkUrl,
      openNewTab: props.buttonAction.openNewTab,
    };
  }
  
  // Fallback to legacy action prop
  return { 
    action: props.action || 'next', 
    value: props.linkUrl,
  };
}

export function RuntimeCtaButton(props: RuntimeCtaButtonProps) {
  const { 
    label = 'Continue', 
    variant = 'primary', 
    size = 'default',
    fullWidth = true,
    className,
    backgroundColor,
    color,
    borderRadius,
    shadow,
  } = props;
  
  const runtime = useFunnelRuntimeOptional();
  const resolved = resolveButtonAction(props);
  
  const isLoading = runtime?.state.isSubmitting && 
    (resolved.action === 'submit' || resolved.action === 'next');
  
  const handleClick = () => {
    if (!runtime) return;
    runtime.actions.handleButtonClick(resolved.action, resolved.value, resolved.openNewTab);
  };

  return (
    <UnifiedButton
      variant={presetToVariant(variant)}
      size={sizeToVariant(size)}
      fullWidth={fullWidth}
      backgroundColor={backgroundColor}
      textColor={color}
      borderRadiusPx={borderRadius}
      shadow={shadow as any}
      className={cn('builder-cta-button', className)}
      onClick={runtime ? handleClick : undefined}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{resolved.action === 'submit' ? 'Submitting...' : label}</span>
        </span>
      ) : (
        label
      )}
    </UnifiedButton>
  );
}

// ============================================================================
// RUNTIME OPTION GRID
// ============================================================================

interface RuntimeOptionGridProps {
  options?: Array<{ id: string; label: string; emoji?: string; value?: string }>;
  autoAdvance?: boolean;
  layout?: 'stack' | 'grid-2' | 'grid-3';
  fieldName?: string;
  className?: string;
  borderRadius?: number;
  backgroundColor?: string;
}

export function RuntimeOptionGrid({ 
  options = [], 
  autoAdvance = true,
  layout = 'stack',
  fieldName = 'choice',
  className,
  borderRadius,
  backgroundColor,
}: RuntimeOptionGridProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const selectedValue = runtime?.state.formData[fieldName] || '';

  const handleSelect = (option: { id: string; label: string; value?: string }) => {
    if (!runtime) return;
    
    const value = option.value || option.label;
    runtime.actions.updateField(fieldName, value);
    
    if (autoAdvance) {
      // Small delay to show selection before advancing
      setTimeout(() => {
        runtime.actions.handleButtonClick('next');
      }, 200);
    }
  };

  if (options.length === 0) {
    return (
      <div className={cn('builder-option-placeholder', className)}>
        <span className="builder-placeholder-text">Add options in the inspector</span>
      </div>
    );
  }

  const layoutClasses = {
    'stack': 'flex-col',
    'grid-2': 'grid grid-cols-2',
    'grid-3': 'grid grid-cols-3',
  };

  const style: CSSProperties = {};
  if (borderRadius !== undefined) style.borderRadius = `${borderRadius}px`;
  if (backgroundColor && backgroundColor !== 'transparent') style.backgroundColor = backgroundColor;

  return (
    <div className={cn('builder-option-grid', layoutClasses[layout], className)}>
      {options.map((opt) => {
        const optValue = opt.value || opt.label;
        const isSelected = selectedValue === optValue;
        
        return (
          <button 
            key={opt.id} 
            type="button" 
            className={cn(
              'builder-option-item',
              isSelected && 'builder-option-item--selected'
            )}
            style={style}
            onClick={() => handleSelect(opt)}
          >
            {opt.emoji && <span className="builder-option-emoji">{opt.emoji}</span>}
            <span className="builder-option-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// RUNTIME CONSENT CHECKBOX
// ============================================================================

interface RuntimeConsentCheckboxProps {
  label?: string;
  linkText?: string;
  linkUrl?: string;
  required?: boolean;
  fieldName?: string;
  className?: string;
}

export function RuntimeConsentCheckbox({ 
  label = 'I agree to receive communications', 
  linkText = 'Privacy Policy',
  linkUrl = '/privacy',
  fieldName = 'consent',
  className 
}: RuntimeConsentCheckboxProps) {
  const runtime = useFunnelRuntimeOptional();
  
  const isChecked = runtime?.state.hasConsent || runtime?.state.formData[fieldName] === 'true';

  const handleChange = () => {
    if (!runtime) return;
    runtime.actions.toggleConsent();
    runtime.actions.updateField(fieldName, (!isChecked).toString());
  };

  return (
    <label className={cn('builder-consent', className)}>
      <input 
        type="checkbox" 
        className="builder-consent-checkbox" 
        checked={isChecked}
        onChange={handleChange}
        readOnly={!runtime}
      />
      <span className="builder-consent-text">
        {label}{' '}
        <a 
          href={linkUrl} 
          className="builder-consent-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {linkText}
        </a>
      </span>
    </label>
  );
}
