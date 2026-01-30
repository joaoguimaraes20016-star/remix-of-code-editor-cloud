import React, { useCallback } from 'react';
import { ListContent, TextStyles } from '@/types/funnel';
import { Check, Circle } from 'lucide-react';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';

interface ListBlockProps {
  content: ListContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function ListBlock({ content, blockId, stepId, isPreview }: ListBlockProps) {
  const { updateBlockContent } = useFunnel();
  const { items, style, iconColor, textColor, fontSize = 16 } = content;

  const canEdit = blockId && stepId && !isPreview;

  const handleItemTextChange = useCallback((itemId: string, newText: string) => {
    if (blockId && stepId) {
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, text: newText } : item
      );
      updateBlockContent(stepId, blockId, { items: updatedItems });
    }
  }, [blockId, stepId, items, updateBlockContent]);

  const iconStyle: React.CSSProperties = iconColor ? { color: iconColor } : {};
  const textStyle: React.CSSProperties = { fontSize };
  if (textColor) {
    textStyle.color = textColor;
  }

  return (
    <ul className={style === 'numbered' ? 'list-decimal list-inside space-y-2' : 'space-y-2'}>
      {items.map((item, index) => (
        <li key={item.id} className="flex items-start gap-3 text-foreground" style={textStyle}>
          {style === 'bullet' && (
            <Circle 
              className="w-2 h-2 mt-2 fill-primary text-primary flex-shrink-0" 
              style={iconColor ? { fill: iconColor, color: iconColor } : {}}
            />
          )}
          {style === 'check' && (
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: iconColor ? `${iconColor}20` : 'hsl(var(--primary) / 0.1)' }}
            >
              <Check 
                className="w-3 h-3" 
                style={iconColor ? { color: iconColor } : { color: 'hsl(var(--primary))' }}
              />
            </div>
          )}
          {style === 'numbered' && (
            <span 
              className="font-semibold min-w-[1.5rem]"
              style={iconColor ? { color: iconColor } : { color: 'hsl(var(--primary))' }}
            >
              {index + 1}.
            </span>
          )}
          <span className="flex-1">
            {canEdit ? (
              <EditableText
                value={item.text}
                onChange={(newText) => handleItemTextChange(item.id, newText)}
                as="span"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={{}}
                onStyleChange={() => {}}
              />
            ) : (
              item.text
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
