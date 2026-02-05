import React, { useContext } from 'react';
import { Block, ViewportType, PopupSettings } from '@/funnel-builder-v3/types/funnel';
import { PopupWrapper } from '@/funnel-builder-v3/editor/components/PopupWrapper';
import { HeadingBlock } from './HeadingBlock';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { ButtonBlock } from './ButtonBlock';
import { DividerBlock } from './DividerBlock';
import { SpacerBlock } from './SpacerBlock';
import { EmailCaptureBlock } from './EmailCaptureBlock';
import { SocialProofBlock } from './SocialProofBlock';
import { CountdownBlock } from './CountdownBlock';
import { QuizBlock } from './QuizBlock';
import { FormBlock } from './FormBlock';
import { AccordionBlock } from './AccordionBlock';
import { LogoBarBlock } from './LogoBarBlock';
import { VideoBlock } from './VideoBlock';
import { PhoneCaptureBlock } from './PhoneCaptureBlock';
import { CalendarBlock } from './CalendarBlock';
import { ReviewsBlock } from './ReviewsBlock';
import { TestimonialSliderBlock } from './TestimonialSliderBlock';
import { ColumnsBlock } from './ColumnsBlock';
import { CardBlock } from './CardBlock';
import { ListBlock } from './ListBlock';
import { SliderBlock } from './SliderBlock';
import { GraphicBlock } from './GraphicBlock';
import { WebinarBlock } from './WebinarBlock';
import { LoaderBlock } from './LoaderBlock';
import { EmbedBlock } from './EmbedBlock';
import { ImageQuizBlock } from './ImageQuizBlock';
import { VideoQuestionBlock } from './VideoQuestionBlock';
import { UploadBlock } from './UploadBlock';
import { MessageBlock } from './MessageBlock';
import { DatePickerBlock } from './DatePickerBlock';
import { DropdownBlock } from './DropdownBlock';
import { PaymentBlock } from './PaymentBlock';
import { cn } from '@/lib/utils';
import { FunnelContext } from '@/funnel-builder-v3/context/FunnelContext';
import { AnimationType, AnimationDuration, AnimationEasing } from '@/funnel-builder-v3/types/funnel';

export interface BlockRendererProps {
  block: Block;
  stepId: string;
  isPreview?: boolean;
  isStepActive?: boolean; // Only animate blocks in active steps (for pre-rendered steps)
}

// Shadow definitions with offset/blur/spread values (color applied separately)
const shadowDefinitions: Record<string, { offsets: string; opacities: [number, number] }> = {
  none: { offsets: '', opacities: [0, 0] },
  sm: { offsets: '0 2px 8px 0|0 1px 3px 0', opacities: [0.15, 0.10] },
  md: { offsets: '0 6px 20px -4px|0 4px 8px -2px', opacities: [0.22, 0.15] },
  lg: { offsets: '0 12px 32px -6px|0 6px 16px -4px', opacities: [0.30, 0.20] },
  xl: { offsets: '0 24px 48px -10px|0 12px 24px -6px', opacities: [0.38, 0.25] },
  '2xl': { offsets: '0 32px 64px -12px|0 16px 32px -8px', opacities: [0.45, 0.30] },
};

// Helper to generate shadow with custom color
const getShadowStyle = (shadow: string, customColor?: string): string => {
  if (shadow === 'none' || !shadowDefinitions[shadow]) return 'none';
  
  const def = shadowDefinitions[shadow];
  const [offset1, offset2] = def.offsets.split('|');
  const [opacity1, opacity2] = def.opacities;
  
  // Parse custom color to get RGB values, or use black
  let colorBase = '0,0,0';
  if (customColor && customColor !== 'transparent') {
    // Handle hex colors
    if (customColor.startsWith('#')) {
      const hex = customColor.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        colorBase = `${r},${g},${b}`;
      }
    }
  }
  
  return `${offset1} rgba(${colorBase},${opacity1}), ${offset2} rgba(${colorBase},${opacity2})`;
};

// Animation class mapping for all animation types
const animationClasses: Record<AnimationType, string> = {
  'none': '',
  'fade-in': 'animate-fade-in',
  'fade-down': 'animate-fade-down',
  'fade-left': 'animate-fade-left',
  'fade-right': 'animate-fade-right',
  'scale-in': 'animate-scale-in',
  'slide-up': 'animate-slide-up',
  'slide-down': 'animate-slide-down',
  'slide-left': 'animate-slide-left',
  'slide-right': 'animate-slide-right',
  'bounce': 'animate-bounce-custom',
  'pop': 'animate-pop',
  'blur-in': 'animate-blur-in',
};

// Duration mapping
const durationStyles: Record<AnimationDuration, string> = {
  fast: '0.2s',
  normal: '0.4s',
  slow: '0.8s',
};

// Easing mapping
const easingStyles: Record<AnimationEasing, string> = {
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

export function BlockRenderer({ block, stepId, isPreview }: BlockRendererProps) {
  // Use context directly to gracefully handle cases where provider might not be available
  const context = useContext(FunnelContext);
  const currentViewport: ViewportType = context?.currentViewport ?? 'mobile';
  const { styles } = block;

  // Common props passed to all blocks that support inline editing
  const editableProps = {
    blockId: block.id,
    stepId,
    isPreview,
  };

  // Handle viewport-based visibility
  if (styles.hideOnMobile && currentViewport === 'mobile') {
    return null;
  }
  if (styles.hideOnTablet && currentViewport === 'tablet') {
    return null;
  }
  if (styles.hideOnDesktop && currentViewport === 'desktop') {
    return null;
  }

  // Get animation styles
  const getAnimationStyles = (): React.CSSProperties => {
    if (!styles.animation || styles.animation === 'none') return {};
    
    const result: React.CSSProperties = {};
    
    // Use new animationDurationMs if set, otherwise fall back to legacy animationDuration
    if (styles.animationDurationMs) {
      result.animationDuration = `${styles.animationDurationMs}ms`;
    } else if (styles.animationDuration) {
      result.animationDuration = durationStyles[styles.animationDuration];
    }
    if (styles.animationDelay) {
      result.animationDelay = `${styles.animationDelay}ms`;
    }
    if (styles.animationEasing) {
      result.animationTimingFunction = easingStyles[styles.animationEasing];
    }
    // Set iteration count based on repeat setting (with legacy animationLoop fallback)
    if (styles.animationRepeat) {
      result.animationIterationCount = styles.animationRepeat === 'infinite' ? 'infinite' : String(styles.animationRepeat);
    } else {
      // Legacy fallback
      result.animationIterationCount = styles.animationLoop ? 'infinite' : '1';
    }
    
    return result;
  };

  // Check if this is a button block and if it should be centered
  const isButton = block.type === 'button';
  const buttonContent = block.content as any;
  const shouldCenterButton = isButton && !buttonContent?.fullWidth;

  // Get textAlign from block.styles or content.styles, defaulting to center for text-based blocks
  const content = block.content as any;
  const contentTextAlign = content?.styles?.textAlign as 'left' | 'center' | 'right' | undefined;
  // Always default to center for text-based blocks to ensure consistent centering
  const textAlign: 'left' | 'center' | 'right' = 
    styles.textAlign || 
    contentTextAlign || 
    'center'; // Always default to center for all blocks

  const wrapperStyle: React.CSSProperties = {
    paddingTop: styles.padding?.top,
    paddingRight: styles.padding?.right,
    paddingBottom: styles.padding?.bottom,
    paddingLeft: styles.padding?.left,
    marginTop: styles.margin?.top,
    marginRight: styles.margin?.right,
    marginBottom: styles.margin?.bottom,
    marginLeft: styles.margin?.left,
    backgroundColor: styles.backgroundColor,
    borderRadius: styles.borderRadius,
    borderWidth: styles.borderWidth,
    borderColor: styles.borderColor,
    borderStyle: (styles.borderWidth || styles.borderColor) ? 'solid' : 'none',
    boxShadow: getShadowStyle(styles.shadow || 'none', styles.shadowColor),
    // Apply background gradient if set
    ...(styles.backgroundGradient && { background: styles.backgroundGradient }),
    // Ensure textAlign is always set to center by default
    textAlign: textAlign || 'center',
    // Ensure full width and prevent overflow
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    // Always use flexbox - stretch to fill parent width
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    // Center non-fullWidth buttons
    ...(shouldCenterButton && {
      justifyContent: 'center',
    }),
    // Center image blocks only - video needs full width for aspect ratio
    ...(block.type === 'image' && {
      justifyContent: 'center',
      alignItems: 'center',
    }),
    // Apply animation timing styles
    ...getAnimationStyles(),
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'heading':
        return <HeadingBlock content={block.content as any} {...editableProps} />;
      case 'text':
        return <TextBlock content={block.content as any} {...editableProps} />;
      case 'image':
        return <ImageBlock content={block.content as any} {...editableProps} />;
      case 'button':
        return <ButtonBlock content={block.content as any} {...editableProps} />;
      case 'divider':
        return <DividerBlock content={block.content as any} {...editableProps} />;
      case 'spacer':
        return <SpacerBlock content={block.content as any} {...editableProps} />;
      case 'email-capture':
        return <EmailCaptureBlock content={block.content as any} {...editableProps} />;
      case 'social-proof':
        return <SocialProofBlock content={block.content as any} {...editableProps} />;
      case 'countdown':
        return <CountdownBlock content={block.content as any} {...editableProps} />;
      case 'quiz':
        return <QuizBlock content={block.content as any} {...editableProps} />;
      case 'form':
      case 'popup-form':
        return <FormBlock content={block.content as any} {...editableProps} />;
      case 'accordion':
        return <AccordionBlock content={block.content as any} {...editableProps} />;
      case 'logo-bar':
        return <LogoBarBlock content={block.content as any} {...editableProps} />;
      case 'video':
        return <VideoBlock content={block.content as any} blockId={block.id} stepId={stepId} isPreview={isPreview} />;
      case 'phone-capture':
        return <PhoneCaptureBlock content={block.content as any} {...editableProps} />;
      case 'calendar':
        return <CalendarBlock content={block.content as any} {...editableProps} />;
      case 'reviews':
        return <ReviewsBlock content={block.content as any} {...editableProps} />;
      case 'testimonial-slider':
        return <TestimonialSliderBlock content={block.content as any} {...editableProps} />;
      case 'columns':
        return <ColumnsBlock content={block.content as any} blockId={block.id} stepId={stepId} isPreview={isPreview} />;
      case 'card':
        return <CardBlock content={block.content as any} blockId={block.id} stepId={stepId} isPreview={isPreview} />;
      case 'list':
        return <ListBlock content={block.content as any} {...editableProps} />;
      case 'slider':
        return <SliderBlock content={block.content as any} />;
      case 'graphic':
        return <GraphicBlock content={block.content as any} />;
      case 'webinar':
        return <WebinarBlock content={block.content as any} {...editableProps} />;
      case 'loader':
        return <LoaderBlock content={block.content as any} />;
      case 'embed':
        return <EmbedBlock content={block.content as any} />;
      case 'multiple-choice':
      case 'choice':
        return <QuizBlock content={block.content as any} {...editableProps} />;
      case 'image-quiz':
        return <ImageQuizBlock content={block.content as any} {...editableProps} />;
      case 'video-question':
        return <VideoQuestionBlock content={block.content as any} {...editableProps} />;
      case 'upload':
        return <UploadBlock content={block.content as any} {...editableProps} />;
      case 'message':
        return <MessageBlock content={block.content as any} {...editableProps} />;
      case 'date-picker':
        return <DatePickerBlock content={block.content as any} {...editableProps} />;
      case 'dropdown':
        return <DropdownBlock content={block.content as any} {...editableProps} />;
      case 'payment':
        return <PaymentBlock content={block.content as any} {...editableProps} />;
      default:
        return (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground text-sm">
            {block.type} block
          </div>
        );
    }
  };

  // Check if this block has popup settings enabled
  const popupSettings: PopupSettings | undefined = content?.popupSettings;
  const hasPopupEnabled = popupSettings?.enabled;

  // Interactive blocks that support popup
  const popupSupportedTypes = ['form', 'popup-form', 'quiz', 'multiple-choice', 'choice', 'email-capture', 'phone-capture', 'message', 'image-quiz', 'video-question'];
  const supportsPopup = popupSupportedTypes.includes(block.type);

  // Only apply animations if step is active (prevents all pre-rendered steps from animating at once)
  const animationClass = isStepActive && styles.animation && styles.animation !== 'none'
    ? animationClasses[styles.animation]
    : '';

  // Wrap with PopupWrapper if popup is enabled
  if (hasPopupEnabled && supportsPopup) {
    return (
      <div
        style={wrapperStyle}
        className={cn(animationClass)}
      >
        <PopupWrapper
          settings={popupSettings}
          blockId={block.id}
          isPreview={isPreview}
        >
          {renderBlock()}
        </PopupWrapper>
      </div>
    );
  }

  return (
    <div
      style={wrapperStyle}
      className={cn(animationClass)}
    >
      {renderBlock()}
    </div>
  );
}
