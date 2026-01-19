/**
 * RuntimeButton - Interactive button for published funnels
 * 
 * Wraps the visual CtaButton with runtime behavior from FunnelRuntimeContext
 */

import React from 'react';
import { useFunnelRuntimeOptional } from './FunnelRuntimeContext';
import { UnifiedButton } from '@/components/builder/UnifiedButton';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface RuntimeButtonProps {
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  action?: 'next' | 'submit' | 'link' | 'prev';
  linkUrl?: string;
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  backgroundColor?: string;
  color?: string;
  borderRadius?: number;
  shadow?: string;
  className?: string;
  nodeId?: string;
}

// Map variant names to UnifiedButton variants
function presetToVariant(variant: string): 'primary' | 'outline' | 'secondary' {
  switch (variant) {
    case 'outline': return 'outline';
    case 'secondary': return 'secondary';
    default: return 'primary';
  }
}

function sizeToVariant(size: string): 'sm' | 'md' | 'lg' {
  switch (size) {
    case 'sm': return 'sm';
    case 'lg': return 'lg';
    default: return 'md';
  }
}

export function RuntimeButton({
  label = 'Continue',
  variant = 'primary',
  action = 'next',
  linkUrl,
  size = 'default',
  fullWidth = true,
  backgroundColor,
  color,
  borderRadius,
  shadow,
  className,
  nodeId,
}: RuntimeButtonProps) {
  const runtime = useFunnelRuntimeOptional();
  
  // If no runtime context, render static button (editor mode)
  if (!runtime) {
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
      >
        {label}
      </UnifiedButton>
    );
  }

  const { state, actions } = runtime;
  const isLoading = state.isSubmitting && (action === 'submit' || (action === 'next' && state.currentStep === state.totalSteps - 1));

  const handleClick = () => {
    if (state.isSubmitting) return;
    actions.handleButtonClick(action, linkUrl);
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
      onClick={handleClick}
      isDisabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Submitting...
        </>
      ) : (
        label
      )}
    </UnifiedButton>
  );
}
