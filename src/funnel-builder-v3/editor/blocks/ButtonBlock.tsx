import React from 'react';
import { ButtonContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface ButtonBlockProps {
  content: ButtonContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function ButtonBlock({ content, blockId, stepId, isPreview }: ButtonBlockProps) {
  const runtime = useFunnelRuntimeOptional();
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const selectedChildElement = funnelContext?.selectedChildElement ?? null;
  const { text, variant, size, fullWidth, backgroundColor, backgroundGradient, color, textGradient, action, actionValue, borderColor, borderWidth, fontSize } = content;

  const sizeClasses: Record<string, string> = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  };

  // Only apply custom styles if they exist
  // NOTE: borderRadius is now controlled by styles.borderRadius on the wrapper (Style tab)
  const customStyle: React.CSSProperties = {};
  
  // Apply custom font size if set
  if (fontSize) {
    customStyle.fontSize = `${fontSize}px`;
  }
  
  // For outline and ghost variants, don't apply custom background colors
  // as they have their own styling logic
  const shouldApplyCustomBg = variant !== 'outline' && variant !== 'ghost';
  
  if (shouldApplyCustomBg) {
    if (backgroundGradient) {
      customStyle.background = backgroundGradient;
    } else if (backgroundColor) {
      customStyle.backgroundColor = backgroundColor;
    }
  }
  
  // For outline variant, apply custom border styles
  if (variant === 'outline') {
    if (borderColor) {
      customStyle.borderColor = borderColor;
    }
    if (borderWidth) {
      customStyle.borderWidth = `${borderWidth}px`;
    }
  }
  
  if (!textGradient && color) customStyle.color = color;

  // When custom backgroundColor or gradient is set AND we're using a filled variant
  const hasCustomBg = shouldApplyCustomBg && (!!backgroundColor || !!backgroundGradient);
  const hasTextGradient = !!textGradient;

  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!runtime) {
      // In editor mode, don't do anything
      return;
    }

    // Performance tracking: measure button click to navigation time
    const clickStartTime = performance.now();
    if (import.meta.env.DEV) {
      console.log('[ButtonBlock] Click started', { action, actionValue });
    }

    try {
      // ALL buttons submit data first (fire-and-forget for speed)
      runtime.submitForm().catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[ButtonBlock] submitForm error:', error);
        }
        // Don't block navigation on submission error
      });

      // Then perform the action immediately (don't wait for submit)
      switch (action) {
        case 'next-step':
        default:
          try {
            runtime.goToNextStep();
            const navTime = performance.now() - clickStartTime;
            if (import.meta.env.DEV) {
              console.log(`[ButtonBlock] Navigation triggered in ${navTime.toFixed(2)}ms`);
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[ButtonBlock] goToNextStep error:', error);
            }
          }
          break;
        case 'url':
          if (actionValue) {
            try {
              window.open(actionValue, '_blank');
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error('[ButtonBlock] window.open error:', error);
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
                console.error('[ButtonBlock] scrollIntoView error:', error);
              }
            }
          }
          break;
        case 'submit':
          // Just submit, no navigation (already done above)
          break;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[ButtonBlock] handleClick unexpected error:', error);
      }
    }
  };

  const handleTextChange = (newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { text: newText });
    }
  };

  const canEdit = blockId && stepId && !isPreview;
  const hasChildSelected = !!selectedChildElement;

  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'button',
    hintText: 'Click to edit button',
    isEditing: hasChildSelected // Disable overlay when child is selected
  });

  // Inline toolbar should be unified with the inspector: it must write back to
  // ButtonContent.color / ButtonContent.textGradient so the inspector swatch and
  // the toolbar swatch stay in sync.
  const toolbarTextStyles: TextStyles = {
    // Provide a sensible default so the toolbar swatch isn't misleading when
    // the user hasn't explicitly set a custom text color yet.
    color:
      color || (variant === 'outline' || variant === 'ghost' ? '#000000' : '#ffffff'),
    textGradient: textGradient || '',
  };

  const handleTextStyleChange = (updates: Partial<TextStyles>) => {
    if (!blockId || !stepId) return;

    const next: Partial<ButtonContent> = {};
    if (typeof updates.color === 'string') next.color = updates.color;
    if (typeof updates.textGradient === 'string') next.textGradient = updates.textGradient;

    if (Object.keys(next).length) {
      updateBlockContent(stepId, blockId, next);
    }
  };


  const buttonElement = (
    <Button
      variant={hasCustomBg ? 'ghost' : (variant === 'primary' ? 'default' : variant)}
      className={cn(
        sizeClasses[size],
        fullWidth && 'w-full',
        hasCustomBg && 'hover:opacity-90',
        runtime && 'cursor-pointer' // Only show pointer in runtime mode
      )}
      style={customStyle}
      onClick={handleClick}
      type="button"
      disabled={false}
    >
      {canEdit ? (
        <EditableText
          value={text}
          onChange={handleTextChange}
          as="span"
          isPreview={isPreview}
          showToolbar={true}
          richText={true}
          styles={toolbarTextStyles}
          onStyleChange={handleTextStyleChange}
          className="inline"
        />
      ) : hasTextGradient ? (
        <span
          className="text-gradient-clip"
          style={{ '--text-gradient': textGradient } as React.CSSProperties}
        >
          {text}
        </span>
      ) : color ? (
        <span style={{ color }}>{text}</span>
      ) : (
        text
      )}
    </Button>
  );

  return wrapWithOverlay(buttonElement);
}
