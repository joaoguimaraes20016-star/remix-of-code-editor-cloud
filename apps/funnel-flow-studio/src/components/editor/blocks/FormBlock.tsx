import React, { useState, useEffect } from 'react';
import { FormContent } from '@/types/funnel';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFunnelRuntimeOptional } from '@/context/FunnelRuntimeContext';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';
import { toast } from 'sonner';
import { useSimpleStyleSync } from '@/hooks/useEditableStyleSync';

interface FormBlockProps {
  content: FormContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function FormBlock({ content, blockId, stepId, isPreview }: FormBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent } = useFunnel();
  const { 
    fields, 
    submitText, 
    submitAction, 
    webhookUrl, 
    submitButtonColor, 
    submitButtonGradient,
    submitButtonTextColor,
    submitButtonTextGradient
  } = content;
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = blockId && stepId && !isPreview;

  // Wire submit button text toolbar to block content
  const { styles: buttonTextStyles, handleStyleChange: handleButtonTextStyleChange } = useSimpleStyleSync(
    blockId,
    stepId,
    submitButtonTextColor,
    submitButtonTextGradient,
    updateBlockContent,
    'submitButtonTextColor',
    'submitButtonTextGradient'
  );

  // Initialize form values from runtime if available
  useEffect(() => {
    if (runtime) {
      const initialValues: Record<string, string> = {};
      fields.forEach(field => {
        const saved = runtime.formData[field.id];
        if (typeof saved === 'string') {
          initialValues[field.id] = saved;
        }
      });
      setLocalValues(initialValues);
    }
  }, [runtime, fields]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [fieldId]: value }));
    runtime?.setFormField(fieldId, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!runtime) return; // In editor mode, don't submit

    // Validate required fields
    const missingFields = fields.filter(
      f => f.required && !localValues[f.id]?.trim()
    );
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (submitAction === 'webhook' && webhookUrl) {
        // Send data to webhook
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: localValues,
            submittedAt: new Date().toISOString(),
          }),
        });
        toast.success('Form submitted successfully!');
      }
      
      // Navigate to next step
      runtime.goToNextStep();
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldLabelChange = (fieldId: string, newLabel: string) => {
    if (blockId && stepId) {
      const updatedFields = fields.map(field =>
        field.id === fieldId ? { ...field, label: newLabel } : field
      );
      updateBlockContent(stepId, blockId, { fields: updatedFields });
    }
  };

  const handleSubmitTextChange = (newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { submitText: newText });
    }
  };

  // Button background styling
  const buttonStyle: React.CSSProperties = {};
  if (submitButtonGradient) {
    buttonStyle.background = submitButtonGradient;
  } else if (submitButtonColor) {
    buttonStyle.backgroundColor = submitButtonColor;
  }
  
  const hasCustomBg = !!submitButtonColor || !!submitButtonGradient;

  // Button text gradient styling
  const hasTextGradient = !!submitButtonTextGradient;
  const buttonTextWrapperStyle: React.CSSProperties = hasTextGradient
    ? { '--text-gradient': submitButtonTextGradient } as React.CSSProperties
    : submitButtonTextColor
      ? { color: submitButtonTextColor }
      : {};

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {fields.map((field) => (
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
                styles={{}}
                onStyleChange={() => {}}
              />
            ) : (
              <Label htmlFor={field.id}>
                {field.label}
              </Label>
            )}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </div>
          
          {field.type === 'textarea' ? (
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              className="min-h-[100px]"
              value={localValues[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          ) : field.type === 'select' ? (
            <Select
              value={localValues[field.id] || ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
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
          ) : (
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              className="h-12"
              value={localValues[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          )}
        </div>
      ))}
      
      <Button 
        type="submit" 
        className={cn("w-full h-12", hasCustomBg && "hover:opacity-90")}
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
              value={submitText}
              onChange={handleSubmitTextChange}
              as="span"
              isPreview={isPreview}
              showToolbar={true}
              richText={true}
              styles={buttonTextStyles}
              onStyleChange={handleButtonTextStyleChange}
            />
          ) : (
            isSubmitting ? 'Submitting...' : submitText
          )}
        </span>
      </Button>
    </form>
  );
}
