import React, { useState, useEffect } from 'react';
import { FormContent, ButtonContent, ConsentSettings, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { useEditableStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { toast } from 'sonner';
import { defaultCountryCodes } from '@/funnel-builder-v3/lib/block-definitions';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

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
  size: 'lg',
  action: 'next-step',
  fullWidth: true,
  backgroundColor: '#3b82f6',
  color: '#ffffff',
};

interface FormBlockProps {
  content: FormContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function FormBlock({ content, blockId, stepId, isPreview }: FormBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const selectedChildElement = funnelContext?.selectedChildElement ?? null;
  const setSelectedChildElement = funnelContext?.setSelectedChildElement ?? (() => {});
  const countryCodes = funnelContext?.countryCodes ?? defaultCountryCodes;
  const defaultCountryId = funnelContext?.defaultCountryId ?? 'us';
  const { 
    title,
    titleStyles,
    fields = [], 
    submitButton = defaultSubmitButton,
    consent = defaultConsent,
    labelColor,
  } = content;
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [phoneCountryIds, setPhoneCountryIds] = useState<Record<string, string>>({});
  const [hasConsented, setHasConsented] = useState(false);

  const canEdit = blockId && stepId && !isPreview;
  const isButtonSelected = !isPreview && selectedChildElement === 'submit-button';
  const hasChildSelected = !!selectedChildElement;
  
  // Check if any field is selected
  const isFieldSelected = (fieldId: string) => 
    !isPreview && selectedChildElement === `form-field-${fieldId}`;

  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'form',
    hintText: 'Click to edit form',
    isEditing: hasChildSelected // Disable overlay when child is selected
  });

  // Wire title toolbar to block content
  const { styles: titleToolbarStyles, handleStyleChange: handleTitleStyleChange } = useEditableStyleSync(
    blockId,
    stepId,
    titleStyles?.color,
    titleStyles?.textGradient,
    titleStyles,
    updateBlockContent,
    'titleStyles.color',
    'titleStyles.textGradient'
  );

  // Default title styles merged with toolbar styles
  const mergedTitleStyles: TextStyles = {
    fontSize: 20,
    fontWeight: 600,
    textAlign: 'center',
    ...titleToolbarStyles,
  };

  // Initialize form values from runtime if available
  useEffect(() => {
    if (runtime && Array.isArray(fields)) {
      const initialValues: Record<string, string> = {};
      const initialCountryIds: Record<string, string> = {};
      fields.forEach(field => {
        const saved = runtime.formData[field.id];
        if (typeof saved === 'string') {
          initialValues[field.id] = saved;
        }
        // Initialize country ID for phone fields
        if (field.type === 'phone') {
          initialCountryIds[field.id] = defaultCountryId || countryCodes[0]?.id || '1';
        }
      });
      setLocalValues(initialValues);
      setPhoneCountryIds(initialCountryIds);
    }
  }, [runtime, fields, defaultCountryId, countryCodes]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [fieldId]: value }));
    runtime?.setFormField(fieldId, value);
  };

  // Shared submission logic - called by both button click (direct) and Enter key (form submit)
  const doSubmit = () => {
    if (!runtime) {
      return; // In editor mode, don't submit
    }

    // Validate required fields
    const missingFields = (fields || []).filter(
      f => f.required && !localValues[f.id]?.trim()
    );
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    // Validate consent if required
    if (consent.enabled && consent.required && !hasConsented) {
      toast.error('Please accept the privacy policy to continue');
      return;
    }

    try {
      // Handle action based on submitButton configuration
      const action = submitButton.action || 'next-step';
      const actionValue = submitButton.actionValue;

      // ALL buttons submit data first (fire-and-forget for speed)
      runtime.submitForm(
        consent.enabled ? {
          agreed: hasConsented,
          privacyPolicyUrl: consent.linkUrl,
        } : undefined
      ).catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[FormBlock] submitForm error:', error);
        }
        // Don't block navigation on submission error
      });

      // Then perform the action immediately (don't wait for submit)
      switch (action) {
        case 'url':
          if (actionValue) {
            try {
              window.open(actionValue, '_blank');
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error('[FormBlock] window.open error:', error);
              }
            }
          }
          break;
        case 'scroll':
          if (actionValue) {
            try {
              const element = document.getElementById(actionValue);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error('[FormBlock] scrollIntoView error:', error);
              }
            }
          }
          break;
        case 'webhook':
          // Send to custom webhook (fire-and-forget)
          if (actionValue) {
            fetch(actionValue, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: localValues,
                submittedAt: new Date().toISOString(),
              }),
            }).catch(() => {
              // Don't fail if webhook fails, lead is already saved
            });
          }
          // Navigate immediately
          try {
            runtime.goToNextStep();
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[FormBlock] goToNextStep error after webhook:', error);
            }
          }
          break;
        case 'submit':
          // Just submit, no navigation (already done above)
          break;
        case 'next-step':
        default:
          // Navigate immediately
          try {
            if (actionValue && !actionValue.startsWith('http') && !actionValue.startsWith('#')) {
              runtime.goToStep(actionValue);
            } else {
              runtime.goToNextStep();
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[FormBlock] Navigation error:', error);
            }
            toast.error('Failed to navigate. Please try again.');
          }
          break;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[FormBlock] doSubmit unexpected error:', error);
      }
      toast.error('Failed to submit form. Please try again.');
    }
  };

  // Form onSubmit handler - only fires on Enter key since button is type="button"
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  const handleFieldLabelChange = (fieldId: string, newLabel: string) => {
    if (blockId && stepId) {
      const updatedFields = (fields || []).map(field =>
        field.id === fieldId ? { ...field, label: newLabel } : field
      );
      updateBlockContent(stepId, blockId, { fields: updatedFields });
    }
  };

  // Handle button click - select in editor, submit directly in preview
  const handleButtonClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedChildElement('submit-button');
    } else {
      // In runtime/preview mode: call doSubmit() directly
      // This bypasses the form submission event chain entirely,
      // matching the ButtonBlock pattern for instant response
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {/* Optional Title */}
      {title && (
        <div className="mb-4">
          {canEdit ? (
            <EditableText
              value={title}
              onChange={(newTitle) => {
                if (blockId && stepId) {
                  updateBlockContent(stepId, blockId, { title: newTitle });
                }
              }}
              as="h3"
              isPreview={isPreview}
              showToolbar={true}
              richText={true}
              styles={mergedTitleStyles}
              onStyleChange={handleTitleStyleChange}
            />
          ) : (
            <h3 
              className="text-xl font-semibold text-center"
              style={{
                fontSize: mergedTitleStyles.fontSize ? `${mergedTitleStyles.fontSize}px` : undefined,
                fontWeight: mergedTitleStyles.fontWeight,
                textAlign: mergedTitleStyles.textAlign,
                color: mergedTitleStyles.color,
              }}
            >
              {title}
            </h3>
          )}
        </div>
      )}
      
      {(fields || []).map((field) => (
        <div key={field.id} className="space-y-2">
          <div className="text-sm font-medium">
            {canEdit ? (
              <EditableText
                value={field.label}
                onChange={(newLabel) => handleFieldLabelChange(field.id, newLabel)}
                as="label"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={labelColor ? { color: labelColor } : {}}
                onStyleChange={() => {}}
              />
            ) : (
              <Label htmlFor={field.id} style={labelColor ? { color: labelColor } : undefined}>
                {field.label}
              </Label>
            )}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </div>
          
          <div 
            className={cn(
              "relative p-1 -m-1 rounded-lg transition-all",
              canEdit && "cursor-pointer hover:ring-2 hover:ring-primary/50",
              isFieldSelected(field.id) && "ring-2 ring-primary"
            )}
            onClick={(e) => {
              if (canEdit) {
                e.preventDefault();
                e.stopPropagation();
                setSelectedChildElement(`form-field-${field.id}`);
              }
            }}
          >
            {field.type === 'textarea' ? (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                className="min-h-[100px]"
                value={localValues[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
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
                    setSelectedChildElement(`form-field-${field.id}`);
                  }
                }}
                readOnly={canEdit}
              />
            ) : field.type === 'select' ? (
              <div 
                onClick={(e) => {
                  if (canEdit) {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedChildElement(`form-field-${field.id}`);
                  }
                }}
              >
                <Select
                  value={localValues[field.id] || ''}
                  onValueChange={(value) => handleFieldChange(field.id, value)}
                  disabled={canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : field.type === 'phone' ? (
              <div className="flex gap-2">
                <div
                  onClick={(e) => {
                    // Prevent opening country codes inspector when clicking selector
                    e.stopPropagation();
                  }}
                >
                  <Select
                    value={phoneCountryIds[field.id] || defaultCountryId || countryCodes[0]?.id || '1'}
                    onValueChange={(value) => {
                      setPhoneCountryIds(prev => ({ ...prev, [field.id]: value }));
                    }}
                    disabled={canEdit}
                  >
                    <SelectTrigger className="w-[80px] shrink-0 rounded-r-none border-r-0 bg-muted">
                      <span className="text-sm font-medium">
                        {countryCodes.find(c => c.id === (phoneCountryIds[field.id] || defaultCountryId || countryCodes[0]?.id))?.flag} {countryCodes.find(c => c.id === (phoneCountryIds[field.id] || defaultCountryId || countryCodes[0]?.id))?.code}
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
                  id={field.id}
                  type="tel"
                  placeholder={field.placeholder}
                  className="h-12 flex-1 rounded-l-none"
                  value={localValues[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
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
                      setSelectedChildElement(`form-field-${field.id}`);
                    }
                  }}
                  readOnly={canEdit}
                />
              </div>
            ) : (
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                className="h-12"
                value={localValues[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
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
                    setSelectedChildElement(`form-field-${field.id}`);
                  }
                }}
                readOnly={canEdit}
              />
            )}
          </div>
        </div>
      ))}

      {/* Privacy Consent Checkbox */}
      {consent.enabled && (
        <div className="flex items-start gap-3 py-2">
          <Checkbox
            id="privacy-consent"
            checked={hasConsented}
            onCheckedChange={(checked) => setHasConsented(checked === true)}
            className="mt-0.5"
          />
          <label 
            htmlFor="privacy-consent" 
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
            {text || 'Submit'}
          </span>
        ) : (
          text || 'Submit'
        )}
      </Button>
    </form>
  );
}
