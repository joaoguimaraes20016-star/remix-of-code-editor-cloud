import React, { useCallback } from 'react';
import { ListContent, ListItem, ListItemIcon } from '@/funnel-builder-v3/types/funnel';
import { Circle } from 'lucide-react';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { getIconByName } from '@/funnel-builder-v3/editor/IconPicker';

interface ListBlockProps {
  content: ListContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function ListBlock({ content, blockId, stepId, isPreview }: ListBlockProps) {
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const { 
    items, 
    style, 
    iconColor, 
    textColor, 
    fontSize = 16,
    iconSize = 40,
    showIconBackground = true,
    // Default icon settings
    defaultIconMode = 'icon',
    defaultIconName = 'check',
    defaultEmoji = '✅',
    defaultImageSrc = '',
    // Legacy support
    iconType = 'check'
  } = content;

  const canEdit = blockId && stepId && !isPreview;

  // Normalize style: treat legacy 'check' as 'icon'
  const normalizedStyle = (style as string) === 'check' ? 'icon' : style;

  const handleItemTextChange = useCallback((itemId: string, newText: string) => {
    if (blockId && stepId) {
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, text: newText } : item
      );
      updateBlockContent(stepId, blockId, { items: updatedItems });
    }
  }, [blockId, stepId, items, updateBlockContent]);

  const textStyle: React.CSSProperties = { fontSize };
  if (textColor) {
    textStyle.color = textColor;
  }

  // Get icon settings for an item (use item's custom icon or fall back to defaults)
  const getItemIconSettings = (item: ListItem): { mode: string; iconName: string; emoji: string; imageSrc: string; size: number } => {
    if (item.icon) {
      return {
        mode: item.icon.mode || defaultIconMode,
        iconName: item.icon.iconName || defaultIconName,
        emoji: item.icon.emoji || defaultEmoji,
        imageSrc: item.icon.imageSrc || defaultImageSrc,
        size: item.icon.size || iconSize,
      };
    }
    
    // Fall back to defaults (or legacy iconType)
    const legacyMap: Record<string, string> = {
      'check': 'check',
      'star': 'star',
      'heart': 'heart',
      'arrow': 'arrow-right',
    };
    
    return {
      mode: defaultIconMode,
      iconName: defaultIconName || legacyMap[iconType] || 'check',
      emoji: defaultEmoji,
      imageSrc: defaultImageSrc,
      size: iconSize,
    };
  };

  // Render icon content for an item
  const renderItemIcon = (item: ListItem, itemIconSize: number) => {
    const color = iconColor || 'hsl(var(--primary))';
    const settings = getItemIconSettings(item);
    // Different sizing for different modes
    const iconInnerSize = Math.max(Math.round(itemIconSize * 0.5), 14);
    const imageInnerSize = Math.max(Math.round(itemIconSize * 0.85), 20); // Images fill more
    const emojiInnerSize = Math.max(Math.round(itemIconSize * 0.6), 16);
    
    // Emoji mode
    if (settings.mode === 'emoji') {
      return (
        <span 
          className="leading-none flex items-center justify-center"
          style={{ 
            fontSize: emojiInnerSize,
            width: emojiInnerSize,
            height: emojiInnerSize,
          }}
        >
          {settings.emoji}
        </span>
      );
    }
    
    // Image mode - images should fill most of the container
    if (settings.mode === 'image' && settings.imageSrc) {
      return (
        <img 
          src={settings.imageSrc} 
          alt="" 
          className="object-contain rounded"
          style={{ 
            width: imageInnerSize, 
            height: imageInnerSize,
            minWidth: 20,
            minHeight: 20,
          }}
        />
      );
    }
    
    // Icon mode (default)
    const IconComponent = getIconByName(settings.iconName);
    const fillIcons = ['star', 'heart'];
    const shouldFill = fillIcons.includes(settings.iconName);
    
    return (
      <IconComponent 
        style={{ 
          width: iconInnerSize,
          height: iconInnerSize,
          minWidth: 14,
          minHeight: 14,
          color,
          ...(shouldFill && { fill: color })
        }} 
      />
    );
  };

  // Get effective icon size for an item (per-item or default)
  const getEffectiveIconSize = (item: ListItem) => {
    const settings = getItemIconSettings(item);
    return Math.max(settings.size, 16);
  };

  // Default effective size for bullet/numbered
  const defaultEffectiveSize = Math.max(iconSize, 16);

  // Get textAlign from content, defaulting to center
  // Note: content.style is a string ('icon', 'bullet', 'numbered'), not an object
  // We'll default to center alignment for lists
  const textAlign = 'center';
  
  return (
    <ul 
      className={normalizedStyle === 'numbered' ? 'list-decimal list-inside space-y-2' : 'space-y-2'}
      style={{ textAlign, width: '100%', maxWidth: '100%' }}
    >
      {items.map((item, index) => {
        const itemIconSize = getEffectiveIconSize(item);
        
        return (
        <li key={item.id} className="flex items-start gap-2.5 text-foreground" style={textStyle}>
          {normalizedStyle === 'bullet' && (
            <div 
              className="flex items-center justify-center flex-shrink-0"
              style={{ 
                width: defaultEffectiveSize,
                height: defaultEffectiveSize,
                marginTop: Math.max((fontSize - defaultEffectiveSize) / 2, 0),
              }}
            >
              <Circle 
                className="fill-primary text-primary" 
                style={{
                  width: Math.max(defaultEffectiveSize * 0.35, 6),
                  height: Math.max(defaultEffectiveSize * 0.35, 6),
                  ...(iconColor && { fill: iconColor, color: iconColor })
                }}
              />
            </div>
          )}
          {normalizedStyle === 'icon' && (() => {
            const isImage = getItemIconSettings(item).mode === 'image';
            const shouldShowBg = showIconBackground && !isImage;
            return (
              <div 
                className={`flex items-center justify-center flex-shrink-0 ${shouldShowBg ? 'rounded-full' : ''} ${isImage ? 'rounded-lg' : ''}`}
                style={{ 
                  width: itemIconSize,
                  height: itemIconSize,
                  minWidth: 20,
                  minHeight: 20,
                  marginTop: Math.max((fontSize - itemIconSize) / 2, 0),
                  backgroundColor: shouldShowBg 
                    ? (iconColor ? `${iconColor}15` : 'hsl(var(--primary) / 0.08)')
                    : 'transparent'
                }}
              >
                {renderItemIcon(item, itemIconSize)}
              </div>
            );
          })()}
          {normalizedStyle === 'numbered' && (
            <div
              className="flex items-center justify-center flex-shrink-0 font-semibold"
              style={{ 
                width: defaultEffectiveSize,
                minWidth: 20,
                marginTop: Math.max((fontSize - defaultEffectiveSize) / 2, 0),
                color: iconColor || 'hsl(var(--primary))'
              }}
            >
              {index + 1}.
            </div>
          )}
          <span className="flex-1 leading-normal">
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
        );
      })}
    </ul>
  );
}
