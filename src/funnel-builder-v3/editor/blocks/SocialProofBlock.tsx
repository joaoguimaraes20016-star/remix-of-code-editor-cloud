import React, { useCallback } from 'react';
import { SocialProofContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { motion } from 'framer-motion';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { cn } from '@/lib/utils';
import { useSimpleStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';

interface SocialProofBlockProps {
  content: SocialProofContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function SocialProofBlock({ content, blockId, stepId, isPreview }: SocialProofBlockProps) {
  const { updateBlockContent } = useFunnel();
  const { 
    items, 
    valueColor, 
    valueGradient, 
    valueFontSize = 30, 
    labelColor,
    labelGradient,
    labelFontSize = 12,
    layout = 'horizontal',
    gap = 32
  } = content;

  const canEdit = blockId && stepId && !isPreview;

  // Wire label text toolbar to block content
  const { styles: labelToolbarStyles, handleStyleChange: handleLabelStyleChange } = useSimpleStyleSync(
    blockId,
    stepId,
    labelColor,
    labelGradient,
    updateBlockContent,
    'labelColor',
    'labelGradient'
  );

  const handleLabelChange = useCallback((itemId: string, newLabel: string) => {
    if (blockId && stepId) {
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, label: newLabel } : item
      );
      updateBlockContent(stepId, blockId, { items: updatedItems });
    }
  }, [blockId, stepId, items, updateBlockContent]);

  // Build value styles - use CSS variable for gradient clipping
  const hasValueGradient = !!valueGradient;
  const valueStyle: React.CSSProperties = {
    fontSize: valueFontSize,
    ...(hasValueGradient 
      ? { '--text-gradient': valueGradient } as React.CSSProperties
      : valueColor ? { color: valueColor } : {}
    ),
  };

  // Build label styles
  const hasLabelGradient = !!labelGradient;
  const labelStyle: React.CSSProperties = {
    fontSize: labelFontSize,
    ...(hasLabelGradient
      ? { '--text-gradient': labelGradient } as React.CSSProperties
      : labelColor ? { color: labelColor } : {}
    ),
  };

  return (
    <div 
      className={cn(
        "flex py-4",
        layout === 'horizontal' ? 'flex-row justify-center' : 'flex-col items-center'
      )}
      style={{ gap }}
    >
      {items.map((item) => (
        <div key={item.id} className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "font-bold",
              !valueColor && !hasValueGradient && "text-foreground",
              hasValueGradient && "text-gradient-clip"
            )}
            style={valueStyle}
          >
            {item.value.toLocaleString()}{item.suffix}
          </motion.p>
          <div 
            className={cn(
              "mt-1",
              !labelColor && !hasLabelGradient && "text-muted-foreground",
              hasLabelGradient && "text-gradient-clip"
            )} 
            style={labelStyle}
          >
            {canEdit ? (
              <EditableText
                value={item.label}
                onChange={(newLabel) => handleLabelChange(item.id, newLabel)}
                as="p"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={labelToolbarStyles}
                onStyleChange={handleLabelStyleChange}
              />
            ) : (
              item.label
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
