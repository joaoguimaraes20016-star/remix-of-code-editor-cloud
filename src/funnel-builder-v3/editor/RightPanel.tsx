import React from 'react';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { blockDefinitions } from '@/funnel-builder-v3/lib/block-definitions';
import { X } from 'lucide-react';
import { StepSettings } from './StepSettings';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimationType, Block, FormContent } from '@/funnel-builder-v3/types/funnel';
import {
  InspectorSection,
  VisualSlider,
  IconToggleRow,
  LabeledToggleRow,
  ColorSwatchPicker,
  ToggleSwitchRow,
  SpacingControl,
  GradientPicker,
} from './inspector/InspectorUI';
import {
  HeadingInspector,
  TextInspector,
  ButtonInspector,
  ImageInspector,
  VideoInspector,
  CountdownInspector,
  DividerInspector,
  SpacerInspector,
  EmailCaptureInspector,
  PhoneCaptureInspector,
  CalendarInspector,
  QuizInspector,
  AccordionInspector,
  SocialProofInspector,
  LogoBarInspector,
  FormInspector,
  ReviewsInspector,
  TestimonialSliderInspector,
  ColumnsInspector,
  CardInspector,
  ListInspector,
  SliderInspector,
  GraphicInspector,
  WebinarInspector,
  LoaderInspector,
  EmbedInspector,
  ImageQuizInspector,
  VideoQuestionInspector,
  UploadInspector,
  MessageInspector,
  DatePickerInspector,
  DropdownInspector,
  PaymentInspector,
  SubmitButtonInspector,
  CountryCodesInspector,
  FormFieldInspector,
  PhoneInputInspector,
} from './inspector/BlockInspector';
import { Box, Layers, Square, Maximize2, Wind, Timer, Play, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

// Animation base types (simplified picker)
type AnimationBase = 'none' | 'slide' | 'scale' | 'pop' | 'bounce' | 'blur';

const animationBaseOptions: { value: AnimationBase; label: string; icon: React.ReactNode }[] = [
  { value: 'none', label: 'None', icon: <span className="text-[10px]">Off</span> },
  { value: 'slide', label: 'Slide', icon: <Layers className="h-3 w-3" /> },
  { value: 'scale', label: 'Scale', icon: <Maximize2 className="h-3 w-3" /> },
  { value: 'pop', label: 'Pop', icon: <Square className="h-3 w-3" /> },
  { value: 'bounce', label: 'Bounce', icon: <Play className="h-3 w-3" /> },
  { value: 'blur', label: 'Blur', icon: <Wind className="h-3 w-3" /> },
];

// Direction options for fade and slide
const directionOptions = [
  { value: 'up', label: 'Up', icon: <ArrowUp className="h-3 w-3" /> },
  { value: 'down', label: 'Down', icon: <ArrowDown className="h-3 w-3" /> },
  { value: 'left', label: 'Left', icon: <ArrowLeft className="h-3 w-3" /> },
  { value: 'right', label: 'Right', icon: <ArrowRight className="h-3 w-3" /> },
];

// Helper to get animation base from full animation type
const getAnimationBase = (animation: AnimationType | undefined): AnimationBase => {
  if (!animation || animation === 'none') return 'none';
  if (animation.startsWith('slide') || animation.startsWith('fade')) return 'slide'; // Map fade to slide
  if (animation === 'scale-in') return 'scale';
  if (animation === 'pop') return 'pop';
  if (animation === 'bounce') return 'bounce';
  if (animation === 'blur-in') return 'blur';
  return 'none';
};

// Helper to get direction from full animation type
const getAnimationDirection = (animation: AnimationType | undefined): string => {
  if (!animation) return 'up';
  if (animation === 'fade-in' || animation === 'slide-up') return 'up';
  if (animation === 'fade-down' || animation === 'slide-down') return 'down';
  if (animation === 'fade-left' || animation === 'slide-left') return 'left';
  if (animation === 'fade-right' || animation === 'slide-right') return 'right';
  return 'up';
};

// Helper to build full animation type from base + direction
const buildAnimationType = (base: AnimationBase, direction: string): AnimationType => {
  if (base === 'none') return 'none';
  if (base === 'slide') return `slide-${direction}` as AnimationType;
  if (base === 'scale') return 'scale-in';
  if (base === 'pop') return 'pop';
  if (base === 'bounce') return 'bounce';
  if (base === 'blur') return 'blur-in';
  return 'none';
};

export function RightPanel() {
  const { funnel, currentStepId, selectedBlockId, setSelectedBlockId, selectedChildElement, setSelectedChildElement, updateBlock, updateBlockContent, setFunnel } = useFunnel();

  const currentStep = funnel?.steps?.find(s => s.id === currentStepId) ?? null;
  const selectedBlock = currentStep?.blocks?.find(b => b.id === selectedBlockId) ?? null;

  // No block selected - show step settings
  if (!selectedBlock) {
    return (
      <div className="w-72 border-l border-border bg-card flex flex-col shrink-0" data-right-panel>
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-sm">Step Settings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Configure this step</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <StepSettings />
          </div>
        </ScrollArea>
      </div>
    );
  }

  const blockDef = blockDefinitions[selectedBlock.type] ?? { name: 'Block', category: 'unknown' };

  const handleStyleChange = (updates: any) => {
    if (!currentStepId || !selectedBlockId) return;
    updateBlock(currentStepId, selectedBlockId, {
      styles: { ...selectedBlock.styles, ...updates },
    });
  };

  const handleContentChange = (updates: any) => {
    if (!currentStepId || !selectedBlockId) return;
    // Use updateBlockContent for content changes to avoid race conditions
    updateBlockContent(currentStepId, selectedBlockId, updates);
  };

  const handleBlockChange = (updates: Partial<Block>) => {
    if (!currentStepId || !selectedBlockId) return;
    updateBlock(currentStepId, selectedBlockId, updates);
  };

  const styles = selectedBlock.styles ?? {};

  // Render the appropriate inspector based on block type
  const renderContentInspector = () => {
    const props = {
      block: selectedBlock,
      onContentChange: handleContentChange,
      onStyleChange: handleStyleChange,
      onBlockChange: handleBlockChange,
      funnel, // Pass funnel for conditional logic UI
    };

    // Check for child element selection (e.g., submit button within interactive blocks)
    // All interactive blocks with embedded ButtonContent use the same SubmitButtonInspector
    const interactiveBlockTypes = [
      'quiz', 'multiple-choice', 'choice', 
      'form', 'popup-form', 'email-capture', 'phone-capture',
      'image-quiz', 'video-question', 'message'
    ];
    
    if (selectedChildElement === 'submit-button' && interactiveBlockTypes.includes(selectedBlock.type)) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Submit Button</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedChildElement(null)}
            >
              ← Back
            </Button>
          </div>
          <SubmitButtonInspector {...props} />
        </div>
      );
    }

    // Handle form-field-* child element (for all field types in forms)
    if (selectedChildElement?.startsWith('form-field-') && 
        (selectedBlock.type === 'form' || selectedBlock.type === 'popup-form')) {
      const fieldId = selectedChildElement.replace('form-field-', '');
      const content = selectedBlock.content as FormContent;
      const field = content.fields?.find(f => f.id === fieldId);
      
      // Dynamic title based on field type
      const getFieldTitle = () => {
        if (!field) return 'Field';
        switch (field.type) {
          case 'phone': return 'Phone Field';
          case 'email': return 'Email Field';
          case 'select': return 'Select Field';
          case 'textarea': return 'Textarea Field';
          case 'text': return 'Text Field';
          default: return 'Field';
        }
      };
      
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{getFieldTitle()}</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedChildElement(null)}
            >
              ← Back
            </Button>
          </div>
          <FormFieldInspector 
            block={selectedBlock} 
            fieldId={fieldId} 
            onContentChange={handleContentChange}
            setSelectedChildElement={setSelectedChildElement}
          />
        </div>
      );
    }

    // Handle phone-input child element (for PhoneCaptureBlock)
    if (selectedChildElement === 'phone-input' && selectedBlock.type === 'phone-capture') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Phone Input</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedChildElement(null)}
            >
              ← Back
            </Button>
          </div>
          <PhoneInputInspector 
            block={selectedBlock}
            onContentChange={handleContentChange}
            setSelectedChildElement={setSelectedChildElement}
          />
        </div>
      );
    }

    // Handle country-codes child element (for phone fields in forms and phone-capture blocks)
    const isPhoneField = selectedBlock.type === 'phone-capture' || 
      (selectedBlock.type === 'form' || selectedBlock.type === 'popup-form');
    
    if (selectedChildElement === 'country-codes' && isPhoneField) {
      const handleFunnelChange = (updates: any) => {
        setFunnel({ ...funnel, ...updates });
      };
      
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Country Codes</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedChildElement(null)}
            >
              ← Back
            </Button>
          </div>
          <CountryCodesInspector funnel={funnel} onFunnelChange={handleFunnelChange} />
        </div>
      );
    }

    switch (selectedBlock.type) {
      case 'heading':
        return <HeadingInspector {...props} />;
      case 'text':
        return <TextInspector {...props} />;
      case 'button':
        return <ButtonInspector {...props} />;
      case 'image':
        return <ImageInspector {...props} />;
      case 'video':
        return <VideoInspector {...props} />;
      case 'countdown':
        return <CountdownInspector {...props} />;
      case 'divider':
        return <DividerInspector {...props} />;
      case 'spacer':
        return <SpacerInspector {...props} />;
      case 'email-capture':
        return <EmailCaptureInspector {...props} />;
      case 'phone-capture':
        return <PhoneCaptureInspector {...props} />;
      case 'calendar':
        return <CalendarInspector {...props} />;
      case 'quiz':
      case 'multiple-choice':
      case 'choice':
        return <QuizInspector {...props} />;
      case 'accordion':
        return <AccordionInspector {...props} />;
      case 'social-proof':
        return <SocialProofInspector {...props} />;
      case 'logo-bar':
        return <LogoBarInspector {...props} />;
      case 'form':
      case 'popup-form':
        return <FormInspector {...props} />;
      case 'reviews':
        return <ReviewsInspector {...props} />;
      case 'testimonial-slider':
        return <TestimonialSliderInspector {...props} />;
      case 'columns':
        return <ColumnsInspector {...props} />;
      case 'card':
        return <CardInspector {...props} />;
      case 'list':
        return <ListInspector {...props} />;
      case 'slider':
        return <SliderInspector {...props} />;
      case 'graphic':
        return <GraphicInspector {...props} />;
      case 'webinar':
        return <WebinarInspector {...props} />;
      case 'loader':
        return <LoaderInspector {...props} />;
      case 'embed':
        return <EmbedInspector {...props} />;
      case 'image-quiz':
        return <ImageQuizInspector {...props} />;
      case 'video-question':
        return <VideoQuestionInspector {...props} />;
      case 'upload':
        return <UploadInspector {...props} />;
      case 'message':
        return <MessageInspector {...props} />;
      case 'date-picker':
        return <DatePickerInspector {...props} />;
      case 'dropdown':
        return <DropdownInspector {...props} />;
      case 'payment':
        return <PaymentInspector {...props} />;
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No editor available for this block type</p>
          </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-72 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden"
      data-right-panel
    >
      {/* Header - Compact */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-medium text-sm">{blockDef.name}</h3>
          <p className="text-[10px] text-muted-foreground capitalize">{blockDef.category}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setSelectedBlockId(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
        <div className="px-3 py-1.5 border-b border-border shrink-0">
          <TabsList className="w-full h-7 bg-muted p-0.5">
            <TabsTrigger value="content" className="flex-1 text-[11px] h-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Content
            </TabsTrigger>
            <TabsTrigger value="style" className="flex-1 text-[11px] h-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Style
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="content" className="m-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {renderContentInspector()}
              </motion.div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="style" className="m-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Padding Section - hide for button/simple blocks */}
                {selectedBlock?.type !== 'button' && (
                  <InspectorSection title="Padding">
                    <SpacingControl
                      value={styles.padding || { top: 0, right: 0, bottom: 0, left: 0 }}
                      onChange={(v) => handleStyleChange({ padding: v })}
                      max={48}
                      icon={<Box className="h-3.5 w-3.5" />}
                    />
                  </InspectorSection>
                )}

                {/* Margin Section - simplified, lower max to prevent layout issues */}
                <InspectorSection title="Margin">
                  <VisualSlider
                    icon={<Layers className="h-3.5 w-3.5" />}
                    value={typeof styles.margin === 'object' ? (styles.margin.top || 0) : (styles.margin || 0)}
                    onChange={(v) => handleStyleChange({ margin: { top: v, right: 0, bottom: v, left: 0 } })}
                    min={0}
                    max={32}
                    unit="px"
                  />
                </InspectorSection>

                {/* Border & Corners - Combined Section */}
                <InspectorSection title="Border & Corners">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-12 shrink-0">Radius</span>
                      <div className="flex-1">
                        <VisualSlider
                          value={styles.borderRadius || 0}
                          onChange={(v) => handleStyleChange({ borderRadius: v })}
                          min={0}
                          max={100}
                          unit="px"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-12 shrink-0">Width</span>
                      <div className="flex-1">
                        <VisualSlider
                          value={styles.borderWidth || 0}
                          onChange={(v) => handleStyleChange({ borderWidth: v })}
                          min={0}
                          max={24}
                          unit="px"
                        />
                      </div>
                    </div>
                    {(styles.borderWidth || 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-12 shrink-0">Color</span>
                        <div className="flex-1">
                          <ColorSwatchPicker
                            value={styles.borderColor || '#000000'}
                            onChange={(v) => handleStyleChange({ borderColor: v })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </InspectorSection>

                {/* Shadow Section with Visual Previews */}
                <InspectorSection title="Shadow">
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[
                        { value: 'none', shadow: 'none' },
                        { value: 'sm', shadow: '0 2px 6px 0 rgba(0,0,0,0.15)' },
                        { value: 'md', shadow: '0 4px 12px -2px rgba(0,0,0,0.22)' },
                        { value: 'lg', shadow: '0 8px 20px -4px rgba(0,0,0,0.30)' },
                        { value: 'xl', shadow: '0 12px 28px -6px rgba(0,0,0,0.38)' },
                        { value: '2xl', shadow: '0 16px 36px -8px rgba(0,0,0,0.45)' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStyleChange({ shadow: option.value })}
                          className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center transition-all border",
                            styles.shadow === option.value 
                              ? "border-primary bg-background" 
                              : "border-transparent bg-muted/50 hover:bg-muted"
                          )}
                          title={option.value}
                        >
                          <div 
                            className="w-4 h-4 rounded bg-background"
                            style={{ boxShadow: option.shadow }}
                          />
                        </button>
                      ))}
                    </div>
                    {/* Shadow color picker - only show when shadow is not 'none' */}
                    {styles.shadow && styles.shadow !== 'none' && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-12 shrink-0">Color</span>
                        <div className="flex-1">
                          <ColorSwatchPicker
                            value={styles.shadowColor || '#000000'}
                            onChange={(v) => handleStyleChange({ shadowColor: v })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </InspectorSection>

                <InspectorSection title="Animation Type">
                  <div className="grid grid-cols-4 gap-1">
                    {animationBaseOptions.map((option) => {
                      const currentBase = getAnimationBase(styles.animation);
                      const currentDirection = getAnimationDirection(styles.animation);
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleStyleChange({ animation: buildAnimationType(option.value, currentDirection) })}
                          className={cn(
                            "flex flex-col items-center p-1.5 rounded-md transition-all text-[9px]",
                            currentBase === option.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                          title={option.label}
                        >
                          {option.icon}
                        </button>
                      );
                    })}
                  </div>
                </InspectorSection>

                {/* Direction selector for slide */}
                {getAnimationBase(styles.animation) === 'slide' && (
                  <InspectorSection title="Direction">
                    <div className="grid grid-cols-4 gap-1">
                      {directionOptions.map((option) => {
                        const currentBase = getAnimationBase(styles.animation);
                        const currentDirection = getAnimationDirection(styles.animation);
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleStyleChange({ animation: buildAnimationType(currentBase, option.value) })}
                            className={cn(
                              "flex flex-col items-center p-1.5 rounded-md transition-all text-[9px]",
                              currentDirection === option.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            title={option.label}
                          >
                            {option.icon}
                          </button>
                        );
                      })}
                    </div>
                  </InspectorSection>
                )}

                {styles.animation && styles.animation !== 'none' && (
                  <>
                    <InspectorSection title="Speed">
                      <VisualSlider
                        icon={<Timer className="h-3.5 w-3.5" />}
                        value={Math.round((5100 - (styles.animationDurationMs || 400)) / 50)}
                        onChange={(speed) => handleStyleChange({ animationDurationMs: 5100 - (speed * 50) })}
                        min={1}
                        max={100}
                        unit="%"
                      />
                    </InspectorSection>

                    <InspectorSection title="Repeat">
                      <LabeledToggleRow
                        value={String(styles.animationRepeat || 1)}
                        onChange={(v) => handleStyleChange({ 
                          animationRepeat: v === 'infinite' ? 'infinite' : Number(v) as 1 | 2 | 3 
                        })}
                        options={[
                          { value: '1', label: '1x' },
                          { value: '2', label: '2x' },
                          { value: '3', label: '3x' },
                          { value: 'infinite', label: '∞' },
                        ]}
                      />
                    </InspectorSection>

                    <InspectorSection title="Delay">
                      <VisualSlider
                        icon={<Timer className="h-3.5 w-3.5" />}
                        value={styles.animationDelay || 0}
                        onChange={(v) => handleStyleChange({ animationDelay: v })}
                        min={0}
                        max={2000}
                        step={50}
                        unit="ms"
                      />
                    </InspectorSection>

                    <InspectorSection title="Trigger">
                      <LabeledToggleRow
                        value={styles.animationTrigger || 'load'}
                        onChange={(v) => handleStyleChange({ animationTrigger: v as any })}
                        options={[
                          { value: 'load', label: 'On Load', icon: <Play className="h-3 w-3" /> },
                          { value: 'scroll', label: 'On Scroll', icon: <Eye className="h-3 w-3" /> },
                        ]}
                      />
                    </InspectorSection>
                  </>
                )}

                {/* Background Section */}
                <InspectorSection title="Background">
                  <ColorSwatchPicker
                    value={styles.backgroundColor || 'transparent'}
                    onChange={(v) => handleStyleChange({ backgroundColor: v, backgroundGradient: '' })}
                  />
                </InspectorSection>

                {/* Gradient Background Section */}
                <InspectorSection title="Background Gradient">
                  <GradientPicker
                    value={styles.backgroundGradient || ''}
                    onChange={(v) => handleStyleChange({ backgroundGradient: v, backgroundColor: v ? 'transparent' : styles.backgroundColor })}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    For text gradients, double-click the text and use the color picker in the toolbar
                  </p>
                </InspectorSection>

                {/* Visibility Section */}
                <InspectorSection title="Visibility">
                  <div className="space-y-1">
                    <ToggleSwitchRow
                      label="Hide on Mobile"
                      checked={styles.hideOnMobile || false}
                      onChange={(v) => handleStyleChange({ hideOnMobile: v })}
                    />
                    <ToggleSwitchRow
                      label="Hide on Tablet"
                      checked={styles.hideOnTablet || false}
                      onChange={(v) => handleStyleChange({ hideOnTablet: v })}
                    />
                    <ToggleSwitchRow
                      label="Hide on Desktop"
                      checked={styles.hideOnDesktop || false}
                      onChange={(v) => handleStyleChange({ hideOnDesktop: v })}
                    />
                  </div>
                </InspectorSection>
              </motion.div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
