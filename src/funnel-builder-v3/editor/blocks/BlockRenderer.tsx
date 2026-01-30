import React, { useContext } from 'react';
import { Block, ViewportType } from '@/types/funnel';
import { HeadingBlock } from './HeadingBlock';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { ButtonBlock } from './ButtonBlock';
import { DividerBlock } from './DividerBlock';
import { SpacerBlock } from './SpacerBlock';
import { EmailCaptureBlock } from './EmailCaptureBlock';
import { TestimonialBlock } from './TestimonialBlock';
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
import { FunnelContext } from '@/context/FunnelContext';
import { AnimationType, AnimationDuration, AnimationEasing } from '@/types/funnel';

export interface BlockRendererProps {
  block: Block;
  stepId: string;
  isPreview?: boolean;
}

// Inline shadow styles - PROMINENT shadows for clear visual impact
const shadowStyles: Record<string, string> = {
  none: 'none',
  sm: '0 2px 8px 0 rgba(0,0,0,0.15), 0 1px 3px 0 rgba(0,0,0,0.10)',
  md: '0 6px 20px -4px rgba(0,0,0,0.22), 0 4px 8px -2px rgba(0,0,0,0.15)',
  lg: '0 12px 32px -6px rgba(0,0,0,0.30), 0 6px 16px -4px rgba(0,0,0,0.20)',
  xl: '0 24px 48px -10px rgba(0,0,0,0.38), 0 12px 24px -6px rgba(0,0,0,0.25)',
  '2xl': '0 32px 64px -12px rgba(0,0,0,0.45), 0 16px 32px -8px rgba(0,0,0,0.30)',
};

// Animation class mapping for all animation types
const animationClasses: Record<AnimationType, string> = {
  'none': '',
  'fade-in': 'animate-fade-in',
  'fade-up': 'animate-fade-up',
  'fade-down': 'animate-fade-down',
  'fade-left': 'animate-fade-left',
  'fade-right': 'animate-fade-right',
  'scale-in': 'animate-scale-in',
  'scale-up': 'animate-scale-up',
  'slide-up': 'animate-slide-up',
  'slide-down': 'animate-slide-down',
  'slide-left': 'animate-slide-left',
  'slide-right': 'animate-slide-right',
  'bounce': 'animate-bounce',
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
    
    if (styles.animationDuration) {
      result.animationDuration = durationStyles[styles.animationDuration];
    }
    if (styles.animationDelay) {
      result.animationDelay = `${styles.animationDelay}ms`;
    }
    if (styles.animationEasing) {
      result.animationTimingFunction = easingStyles[styles.animationEasing];
    }
    
    return result;
  };

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
    boxShadow: shadowStyles[styles.shadow || 'none'],
    // Apply background gradient if set
    ...(styles.backgroundGradient && { background: styles.backgroundGradient }),
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
        return <ImageBlock content={block.content as any} />;
      case 'button':
        return <ButtonBlock content={block.content as any} {...editableProps} />;
      case 'divider':
        return <DividerBlock content={block.content as any} />;
      case 'spacer':
        return <SpacerBlock content={block.content as any} />;
      case 'email-capture':
        return <EmailCaptureBlock content={block.content as any} {...editableProps} />;
      case 'testimonial':
        return <TestimonialBlock content={block.content as any} {...editableProps} />;
      case 'social-proof':
        return <SocialProofBlock content={block.content as any} {...editableProps} />;
      case 'countdown':
        return <CountdownBlock content={block.content as any} {...editableProps} />;
      case 'quiz':
        return <QuizBlock content={block.content as any} {...editableProps} />;
      case 'form':
        return <FormBlock content={block.content as any} {...editableProps} />;
      case 'accordion':
        return <AccordionBlock content={block.content as any} {...editableProps} />;
      case 'logo-bar':
        return <LogoBarBlock content={block.content as any} {...editableProps} />;
      case 'video':
        return <VideoBlock content={block.content as any} />;
      case 'phone-capture':
        return <PhoneCaptureBlock content={block.content as any} {...editableProps} />;
      case 'calendar':
        return <CalendarBlock content={block.content as any} {...editableProps} />;
      case 'reviews':
        return <ReviewsBlock content={block.content as any} {...editableProps} />;
      case 'columns':
        return <ColumnsBlock content={block.content as any} stepId={stepId} isPreview={isPreview} />;
      case 'card':
        return <CardBlock content={block.content as any} stepId={stepId} isPreview={isPreview} />;
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
        return <PaymentBlock content={block.content as any} />;
      default:
        return (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground text-sm">
            {block.type} block
          </div>
        );
    }
  };

  return (
    <div
      style={wrapperStyle}
      className={cn(animationClasses[styles.animation || 'none'])}
    >
      {renderBlock()}
    </div>
  );
}
