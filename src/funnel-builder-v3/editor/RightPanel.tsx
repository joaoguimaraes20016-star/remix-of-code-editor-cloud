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
import { AnimationType } from '@/funnel-builder-v3/types/funnel';
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
  TestimonialInspector,
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
} from './inspector/BlockInspector';
import { Box, Layers, Sparkles, Square, MoveUp, MoveDown, MoveLeft, MoveRight, Maximize2, ZoomIn, Wind, Timer, Play, Eye } from 'lucide-react';

// Animation type options with visual representation
const animationOptions: { value: AnimationType; label: string; icon: React.ReactNode }[] = [
  { value: 'none', label: 'None', icon: <span className="text-[10px]">Off</span> },
  { value: 'fade-in', label: 'Fade In', icon: <Sparkles className="h-3 w-3" /> },
  { value: 'fade-up', label: 'Fade Up', icon: <MoveUp className="h-3 w-3" /> },
  { value: 'fade-down', label: 'Fade Down', icon: <MoveDown className="h-3 w-3" /> },
  { value: 'fade-left', label: 'Fade Left', icon: <MoveLeft className="h-3 w-3" /> },
  { value: 'fade-right', label: 'Fade Right', icon: <MoveRight className="h-3 w-3" /> },
  { value: 'scale-in', label: 'Scale In', icon: <Maximize2 className="h-3 w-3" /> },
  { value: 'scale-up', label: 'Scale Up', icon: <ZoomIn className="h-3 w-3" /> },
  { value: 'slide-up', label: 'Slide Up', icon: <Layers className="h-3 w-3" /> },
  { value: 'slide-down', label: 'Slide Down', icon: <Layers className="h-3 w-3 rotate-180" /> },
  { value: 'slide-left', label: 'Slide Left', icon: <Layers className="h-3 w-3 -rotate-90" /> },
  { value: 'slide-right', label: 'Slide Right', icon: <Layers className="h-3 w-3 rotate-90" /> },
  { value: 'pop', label: 'Pop', icon: <Square className="h-3 w-3" /> },
  { value: 'bounce', label: 'Bounce', icon: <Play className="h-3 w-3" /> },
  { value: 'blur-in', label: 'Blur In', icon: <Wind className="h-3 w-3" /> },
];

export function RightPanel() {
  const { funnel, currentStepId, selectedBlockId, setSelectedBlockId, updateBlock, updateBlockContent } = useFunnel();

  const currentStep = funnel?.steps?.find(s => s.id === currentStepId) ?? null;
  const selectedBlock = currentStep?.blocks?.find(b => b.id === selectedBlockId) ?? null;

  // No block selected - show step settings
  if (!selectedBlock) {
    return (
      <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
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

  const styles = selectedBlock.styles ?? {};

  // Render the appropriate inspector based on block type
  const renderContentInspector = () => {
    const props = {
      block: selectedBlock,
      onContentChange: handleContentChange,
      onStyleChange: handleStyleChange,
      funnel, // Pass funnel for conditional logic UI
    };

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
      case 'testimonial':
        return <TestimonialInspector {...props} />;
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
        return <FormInspector {...props} />;
      case 'reviews':
        return <ReviewsInspector {...props} />;
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
                {/* Padding Section */}
                <InspectorSection title="Padding">
                  <SpacingControl
                    value={styles.padding || { top: 0, right: 0, bottom: 0, left: 0 }}
                    onChange={(v) => handleStyleChange({ padding: v })}
                    max={96}
                    icon={<Box className="h-3.5 w-3.5" />}
                  />
                </InspectorSection>

                {/* Margin Section */}
                <InspectorSection title="Margin">
                  <SpacingControl
                    value={styles.margin || { top: 0, right: 0, bottom: 0, left: 0 }}
                    onChange={(v) => handleStyleChange({ margin: v })}
                    max={96}
                    icon={<Layers className="h-3.5 w-3.5" />}
                  />
                </InspectorSection>

                {/* Border Radius Section */}
                <InspectorSection title="Corners">
                  <VisualSlider
                    icon={<Square className="h-3.5 w-3.5" />}
                    value={styles.borderRadius || 0}
                    onChange={(v) => handleStyleChange({ borderRadius: v })}
                    min={0}
                    max={48}
                    unit="px"
                  />
                </InspectorSection>

                {/* Border Section */}
                <InspectorSection title="Border">
                  <VisualSlider
                    icon={<Square className="h-3.5 w-3.5" />}
                    value={styles.borderWidth || 0}
                    onChange={(v) => handleStyleChange({ borderWidth: v })}
                    min={0}
                    max={8}
                    unit="px"
                  />
                  <ColorSwatchPicker
                    value={styles.borderColor || 'transparent'}
                    onChange={(v) => handleStyleChange({ 
                      borderColor: v,
                      // Auto-set borderWidth to 1 if currently 0 so the border is visible
                      borderWidth: styles.borderWidth || 1 
                    })}
                  />
                </InspectorSection>

                {/* Shadow Section with Visual Previews */}
                <InspectorSection title="Shadow">
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
                </InspectorSection>

                <InspectorSection title="Animation Type">
                  <div className="grid grid-cols-5 gap-1">
                    {animationOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStyleChange({ animation: option.value })}
                        className={cn(
                          "flex flex-col items-center p-1.5 rounded-md transition-all text-[9px]",
                          styles.animation === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                        title={option.label}
                      >
                        {option.icon}
                      </button>
                    ))}
                  </div>
                </InspectorSection>

                {styles.animation && styles.animation !== 'none' && (
                  <>
                    <InspectorSection title="Duration">
                      <LabeledToggleRow
                        value={styles.animationDuration || 'normal'}
                        onChange={(v) => handleStyleChange({ animationDuration: v as any })}
                        options={[
                          { value: 'fast', label: 'Fast' },
                          { value: 'normal', label: 'Normal' },
                          { value: 'slow', label: 'Slow' },
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

                    <InspectorSection title="Easing">
                      <LabeledToggleRow
                        value={styles.animationEasing || 'ease-out'}
                        onChange={(v) => handleStyleChange({ animationEasing: v as any })}
                        options={[
                          { value: 'ease', label: 'Ease' },
                          { value: 'ease-in', label: 'In' },
                          { value: 'ease-out', label: 'Out' },
                          { value: 'spring', label: 'Spring' },
                        ]}
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
