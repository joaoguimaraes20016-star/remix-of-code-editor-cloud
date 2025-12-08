import { FunnelStep, FunnelSettings } from '@/pages/FunnelEditor';
import { cn } from '@/lib/utils';
import { ElementActionMenu } from './ElementActionMenu';
import { useState, useMemo } from 'react';

interface StepDesign {
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: string;
  borderRadius?: number;
  padding?: number;
  imageUrl?: string;
  imageSize?: 'S' | 'M' | 'L' | 'XL';
  imagePosition?: 'top' | 'bottom' | 'background';
}

interface ElementConfig {
  id: string;
  type: 'headline' | 'subtext' | 'image' | 'button' | 'input' | 'options' | 'video' | 'hint';
  visible: boolean;
}

interface StepPreviewProps {
  step: FunnelStep;
  settings: FunnelSettings;
  selectedElement: string | null;
  onSelectElement: (element: string | null) => void;
  design?: StepDesign;
  onUpdateContent?: (field: string, value: any) => void;
  elementOrder?: string[];
  onReorderElements?: (newOrder: string[]) => void;
}

const IMAGE_ASPECT_RATIOS = {
  S: '16/9',
  M: '4/3',
  L: '5/4',
  XL: '1/1',
};

const FONT_SIZE_MAP = {
  small: { headline: 'text-lg', subtext: 'text-xs' },
  medium: { headline: 'text-xl', subtext: 'text-sm' },
  large: { headline: 'text-2xl', subtext: 'text-base' },
};

// Default element orders by step type
const DEFAULT_ELEMENT_ORDERS: Record<string, string[]> = {
  welcome: ['image_top', 'headline', 'subtext', 'button', 'hint'],
  text_question: ['image_top', 'headline', 'input', 'hint'],
  multi_choice: ['image_top', 'headline', 'options'],
  email_capture: ['image_top', 'headline', 'subtext', 'input', 'hint'],
  phone_capture: ['image_top', 'headline', 'subtext', 'input', 'hint'],
  video: ['headline', 'video', 'button'],
  thank_you: ['image_top', 'headline', 'subtext'],
};

export function StepPreview({ 
  step, 
  settings, 
  selectedElement, 
  onSelectElement, 
  design,
  onUpdateContent,
  elementOrder,
  onReorderElements
}: StepPreviewProps) {
  const content = step.content;

  const textColor = design?.textColor || '#ffffff';
  const buttonColor = design?.buttonColor || settings.primary_color;
  const buttonTextColor = design?.buttonTextColor || '#ffffff';
  const fontFamily = design?.fontFamily || 'system-ui';
  const fontSize = design?.fontSize || 'medium';
  const borderRadius = design?.borderRadius ?? 12;

  // Get the element order for this step
  const currentOrder = useMemo(() => {
    if (elementOrder && elementOrder.length > 0) {
      return elementOrder;
    }
    return DEFAULT_ELEMENT_ORDERS[step.step_type] || ['headline', 'subtext', 'button'];
  }, [elementOrder, step.step_type]);

  const handleMoveUp = (elementId: string) => {
    const index = currentOrder.indexOf(elementId);
    if (index > 0 && onReorderElements) {
      const newOrder = [...currentOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      onReorderElements(newOrder);
    }
  };

  const handleMoveDown = (elementId: string) => {
    const index = currentOrder.indexOf(elementId);
    if (index < currentOrder.length - 1 && onReorderElements) {
      const newOrder = [...currentOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      onReorderElements(newOrder);
    }
  };

  const handleDuplicate = (elementId: string) => {
    // For now, just log - could be extended to actually duplicate elements
    console.log('Duplicate element:', elementId);
  };

  const handleDelete = (elementId: string) => {
    if (onReorderElements) {
      const newOrder = currentOrder.filter(id => id !== elementId);
      onReorderElements(newOrder);
    }
  };

  const getEditableClass = (elementId: string) => cn(
    "cursor-pointer transition-all relative group",
    selectedElement === elementId 
      ? "ring-2 ring-primary ring-offset-2 ring-offset-transparent rounded" 
      : "hover:ring-2 hover:ring-primary/40 hover:ring-offset-2 hover:ring-offset-transparent rounded"
  );

  const renderElementWrapper = (elementId: string, children: React.ReactNode) => {
    const index = currentOrder.indexOf(elementId);
    const isSelected = selectedElement === elementId;
    
    return (
      <div 
        key={elementId}
        className={cn("relative", getEditableClass(elementId))}
        onClick={(e) => { e.stopPropagation(); onSelectElement(elementId); }}
      >
        {children}
        
        {isSelected && (
          <ElementActionMenu
            elementId={elementId}
            onMoveUp={() => handleMoveUp(elementId)}
            onMoveDown={() => handleMoveDown(elementId)}
            onDuplicate={() => handleDuplicate(elementId)}
            onDelete={() => handleDelete(elementId)}
            canMoveUp={index > 0}
            canMoveDown={index < currentOrder.length - 1}
            position="right"
          />
        )}
      </div>
    );
  };

  const renderImage = () => {
    if (!design?.imageUrl || design?.imagePosition === 'background') return null;
    
    const aspectRatio = IMAGE_ASPECT_RATIOS[design.imageSize || 'M'];
    
    return (
      <div 
        className="w-full max-w-[200px] mx-auto rounded-lg overflow-hidden"
        style={{ aspectRatio }}
      >
        <img 
          src={design.imageUrl} 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  // Element renderers
  const renderElement = (elementId: string) => {
    switch (elementId) {
      case 'image_top':
        if (!design?.imageUrl || design?.imagePosition !== 'top') return null;
        return renderElementWrapper('image_top', renderImage());
        
      case 'image_bottom':
        if (!design?.imageUrl || design?.imagePosition !== 'bottom') return null;
        return renderElementWrapper('image_bottom', renderImage());
        
      case 'headline':
        if (!content.headline) return null;
        return renderElementWrapper('headline', (
          <h1 
            className={cn(FONT_SIZE_MAP[fontSize].headline, "font-bold leading-tight text-center")}
            style={{ color: textColor }}
          >
            {content.headline}
          </h1>
        ));
        
      case 'subtext':
        if (!content.subtext) return null;
        return renderElementWrapper('subtext', (
          <p 
            className={cn(FONT_SIZE_MAP[fontSize].subtext, "opacity-70 text-center")}
            style={{ color: textColor }}
          >
            {content.subtext}
          </p>
        ));
        
      case 'button':
        return renderElementWrapper('button', (
          <button
            className="px-6 py-3 text-sm font-semibold transition-all w-full max-w-xs"
            style={{ 
              backgroundColor: buttonColor, 
              color: buttonTextColor,
              borderRadius: `${borderRadius}px`
            }}
          >
            {content.button_text || settings.button_text || 'Get Started'}
          </button>
        ));
        
      case 'input':
        const inputType = step.step_type === 'email_capture' ? 'email' : 
                         step.step_type === 'phone_capture' ? 'tel' : 'text';
        const placeholder = content.placeholder || 
                           (step.step_type === 'email_capture' ? 'email@example.com' : 
                            step.step_type === 'phone_capture' ? '(555) 123-4567' : 'Type here...');
        return renderElementWrapper('input', (
          <div className="w-full max-w-xs">
            <input
              type={inputType}
              placeholder={placeholder}
              className="w-full bg-white/10 border border-white/20 px-4 py-3 text-center"
              style={{ 
                color: textColor, 
                borderRadius: `${borderRadius}px`
              }}
              readOnly
            />
          </div>
        ));
        
      case 'options':
        if (!content.options?.length) return null;
        return renderElementWrapper('options', (
          <div className="w-full max-w-xs space-y-2">
            {content.options.map((option: string, index: number) => (
              <button
                key={index}
                className="w-full px-4 py-3 hover:opacity-80 transition-colors text-sm font-medium"
                style={{ 
                  backgroundColor: buttonColor,
                  color: buttonTextColor,
                  borderRadius: `${borderRadius}px`
                }}
              >
                {option}
              </button>
            ))}
          </div>
        ));
        
      case 'video':
        return renderElementWrapper('video', (
          <div 
            className="w-full aspect-video bg-white/10 flex items-center justify-center"
            style={{ borderRadius: `${borderRadius}px` }}
          >
            {content.video_url ? (
              <span className="text-xs" style={{ color: textColor, opacity: 0.5 }}>Video Preview</span>
            ) : (
              <span className="text-xs" style={{ color: textColor, opacity: 0.5 }}>No video URL</span>
            )}
          </div>
        ));
        
      case 'hint':
        return (
          <p key="hint" className="text-xs text-center" style={{ color: textColor, opacity: 0.4 }}>
            Press Enter ↵
          </p>
        );
        
      default:
        return null;
    }
  };

  return (
    <div 
      className="w-full h-full relative" 
      onClick={() => onSelectElement(null)}
      style={{ fontFamily }}
    >
      {/* Background image overlay */}
      {design?.imagePosition === 'background' && design?.imageUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${design.imageUrl})` }}
        />
      )}

      {/* Logo */}
      {settings.logo_url && (
        <div className="absolute top-14 left-4 z-10">
          <img
            src={settings.logo_url}
            alt="Logo"
            className="h-5 w-auto object-contain"
          />
        </div>
      )}

      {/* Column-based layout - elements render in order */}
      <div className="flex flex-col items-center justify-center h-full p-6 gap-4 relative z-10">
        {currentOrder.map(elementId => renderElement(elementId))}
      </div>
    </div>
  );
}
