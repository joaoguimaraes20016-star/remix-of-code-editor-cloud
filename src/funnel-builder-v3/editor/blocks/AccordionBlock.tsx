import React, { useCallback } from 'react';
import { AccordionContent as AccordionContentType, TextStyles } from '@/funnel-builder-v3/types/funnel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useEditableStyleSync } from '@/funnel-builder-v3/hooks/useEditableStyleSync';

interface AccordionBlockProps {
  content: AccordionContentType;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function AccordionBlock({ content, blockId, stepId, isPreview }: AccordionBlockProps) {
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const { 
    items, 
    itemStyle = 'outline',
    titleColor,
    contentColor,
    titleStyles,
  } = content;

  const canEdit = blockId && stepId && !isPreview;
  
  const defaultOpen = items
    .filter(item => item.defaultOpen)
    .map(item => item.id);

  // Wire title text toolbar to block content
  const { styles: titleToolbarStyles, handleStyleChange: handleTitleStyleChange } = useEditableStyleSync(
    blockId,
    stepId,
    titleColor,
    titleStyles?.textGradient,
    titleStyles,
    updateBlockContent,
    'titleColor',
    'titleStyles.textGradient'
  );

  const handleTitleChange = useCallback((itemId: string, newTitle: string) => {
    if (blockId && stepId) {
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, title: newTitle } : item
      );
      updateBlockContent(stepId, blockId, { items: updatedItems });
    }
  }, [blockId, stepId, items, updateBlockContent]);

  const handleContentChange = useCallback((itemId: string, newContent: string) => {
    if (blockId && stepId) {
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, content: newContent } : item
      );
      updateBlockContent(stepId, blockId, { items: updatedItems });
    }
  }, [blockId, stepId, items, updateBlockContent]);

  // Build item classes based on style
  const getItemClasses = () => {
    if (itemStyle === 'filled') {
      return 'bg-muted/50 rounded-lg mb-2 border-0';
    }
    return 'border-b border-border';
  };

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="w-full max-w-full" style={{ boxSizing: 'border-box' }}>
      {items.map((item) => (
        <AccordionItem 
          key={item.id} 
          value={item.id} 
          className={getItemClasses()}
        >
          <AccordionTrigger 
            className={cn(
              "text-left font-medium hover:no-underline py-4",
              itemStyle === 'filled' && "px-4"
            )}
            style={{ color: titleColor || undefined }}
          >
            {canEdit ? (
              <EditableText
                value={item.title}
                onChange={(newTitle) => handleTitleChange(item.id, newTitle)}
                as="span"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={titleToolbarStyles}
                onStyleChange={handleTitleStyleChange}
                className="flex-1"
              />
            ) : (
              (() => {
                // For preview mode: apply gradient or solid color styling
                const hasTitleGradient = !!titleStyles?.textGradient;
                const previewStyle: React.CSSProperties = hasTitleGradient
                  ? { '--text-gradient': titleStyles!.textGradient } as React.CSSProperties
                  : { color: titleColor || undefined };
                return (
                  <span 
                    className={cn(hasTitleGradient && 'text-gradient-clip')}
                    style={previewStyle}
                  >
                    {item.title}
                  </span>
                );
              })()
            )}
          </AccordionTrigger>
          <AccordionContent 
            className={cn(
              "pb-4",
              itemStyle === 'filled' && "px-4"
            )}
            style={{ color: contentColor || undefined }}
          >
            {canEdit ? (
              <EditableText
                value={item.content}
                onChange={(newContent) => handleContentChange(item.id, newContent)}
                as="p"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={{}}
                onStyleChange={() => {}}
                singleLine={false}
              />
            ) : (
              item.content
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
