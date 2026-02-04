import React, { useState, useCallback } from 'react';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { FunnelRuntimeProvider, useFunnelRuntime, FunnelFormData, FunnelSelections } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from './blocks/BlockRenderer';
import { X, Smartphone, Tablet, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Step dots component for inside device screens
function StepDotsInsideScreen() {
  const { funnel } = useFunnel();
  const runtime = useFunnelRuntime();
  
  // Respect the showStepIndicator setting
  if (runtime.totalSteps <= 1 || funnel.settings.showStepIndicator === false) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex items-center justify-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50"
    >
      {funnel.steps.map((step, i) => (
        <button
          key={step.id}
          onClick={() => runtime.goToStep(step.id)}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            step.id === runtime.currentStepId 
              ? 'bg-primary w-8' 
              : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50'
          )}
        />
      ))}
    </motion.div>
  );
}

// Inner component that uses runtime context
function PreviewContent({ deviceMode }: { deviceMode: 'mobile' | 'tablet' | 'desktop' }) {
  const runtime = useFunnelRuntime();
  const currentStep = runtime.getCurrentStep();

  // Get step background color
  const stepBgColor = currentStep?.settings?.backgroundColor;

  return (
    <>
      {/* Phone Frame */}
      {deviceMode === 'mobile' && (
        <div className="preview-phone-frame">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />
          
          {/* Screen Content */}
          <div 
            className="preview-phone-screen relative"
            style={{ backgroundColor: stepBgColor || undefined }}
          >
            <ScrollArea className="h-full">
              <div className="min-h-full pb-20" style={{ backgroundColor: stepBgColor || undefined }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={runtime.currentStepId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="py-8"
                    style={{ backgroundColor: stepBgColor || undefined }}
                  >
                    {currentStep?.blocks.map(block => (
                      <div key={block.id} className="px-0">
                        <BlockRenderer block={block} stepId={currentStep.id} isPreview />
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>
            <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-8 z-20">
              <div className="pointer-events-auto">
                <StepDotsInsideScreen />
              </div>
            </div>
          </div>
          
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
        </div>
      )}

      {/* Tablet Frame */}
      {deviceMode === 'tablet' && (
        <div className="preview-tablet-frame">
          <div 
            className="preview-tablet-screen relative"
            style={{ backgroundColor: stepBgColor || undefined }}
          >
            <ScrollArea className="h-full">
              <div className="min-h-full pb-20" style={{ backgroundColor: stepBgColor || undefined }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={runtime.currentStepId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="py-6 px-4"
                    style={{ backgroundColor: stepBgColor || undefined }}
                  >
                    {currentStep?.blocks.map(block => (
                      <div key={block.id}>
                        <BlockRenderer block={block} stepId={currentStep.id} isPreview />
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>
            <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-8 z-20">
              <div className="pointer-events-auto">
                <StepDotsInsideScreen />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Frame */}
      {deviceMode === 'desktop' && (
        <div className="preview-browser-frame">
          {/* Browser Chrome */}
          <div className="preview-browser-chrome">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-black/20 rounded-md px-3 py-1.5 text-xs text-white/60 text-center">
                  preview.yourfunnel.com
                </div>
              </div>
            </div>
          </div>
          
          {/* Browser Content */}
          <div 
            className="preview-browser-screen relative"
            style={{ backgroundColor: stepBgColor || undefined }}
          >
            <ScrollArea className="h-full">
              <div className="min-h-full max-w-md mx-auto pb-20" style={{ backgroundColor: stepBgColor || undefined }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={runtime.currentStepId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="py-6"
                    style={{ backgroundColor: stepBgColor || undefined }}
                  >
                    {currentStep?.blocks.map(block => (
                      <div key={block.id}>
                        <BlockRenderer block={block} stepId={currentStep.id} isPreview />
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>
            <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-8 z-20">
              <div className="pointer-events-auto">
                <StepDotsInsideScreen />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Navigation controls that use runtime
function PreviewNavigation() {
  const runtime = useFunnelRuntime();
  const currentStep = runtime.getCurrentStep();
  const stepIndex = runtime.getStepIndex();
  
  return (
    <>
      {/* Navigation Arrow Left */}
      {runtime.totalSteps > 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => runtime.goToPrevStep()}
            disabled={!runtime.canGoBack}
            className="h-12 w-12 shrink-0 mr-6 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-105 disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </>
  );
}

function PreviewNavigationRight() {
  const runtime = useFunnelRuntime();
  
  return (
    <>
      {runtime.totalSteps > 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => runtime.goToNextStep()}
            disabled={!runtime.canGoForward}
            className="h-12 w-12 shrink-0 ml-6 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-105 disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </>
  );
}


function PreviewHeader({ deviceMode, setDeviceMode }: { 
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  setDeviceMode: (mode: 'mobile' | 'tablet' | 'desktop') => void;
}) {
  const { setPreviewMode } = useFunnel();
  const runtime = useFunnelRuntime();
  const currentStep = runtime.getCurrentStep();
  const stepIndex = runtime.getStepIndex();
  
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="relative h-16 border-b border-border/50 glass flex items-center justify-between px-6 shrink-0 z-10"
    >
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPreviewMode(false)}
          className="gap-2 hover:bg-background/50"
        >
          <X className="h-4 w-4" />
          Exit Preview
        </Button>
        
        <div className="h-6 w-px bg-border/50" />
        
        <span className="text-sm font-medium">
          {currentStep?.name}
          <span className="text-muted-foreground ml-2">
            ({stepIndex + 1} / {runtime.totalSteps})
          </span>
        </span>
      </div>

      {/* Device Toggle */}
      <div className="flex items-center gap-1 bg-background/50 backdrop-blur-sm p-1 rounded-xl border border-border/50">
        <Button
          variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setDeviceMode('mobile')}
          className={cn(
            "h-8 px-4 rounded-lg transition-all duration-300",
            deviceMode === 'mobile' && "shadow-sm"
          )}
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Mobile
        </Button>
        <Button
          variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setDeviceMode('tablet')}
          className={cn(
            "h-8 px-4 rounded-lg transition-all duration-300",
            deviceMode === 'tablet' && "shadow-sm"
          )}
        >
          <Tablet className="h-4 w-4 mr-2" />
          Tablet
        </Button>
        <Button
          variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setDeviceMode('desktop')}
          className={cn(
            "h-8 px-4 rounded-lg transition-all duration-300",
            deviceMode === 'desktop' && "shadow-sm"
          )}
        >
          <Monitor className="h-4 w-4 mr-2" />
          Desktop
        </Button>
      </div>

      <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
        Press ESC to exit
      </span>
    </motion.header>
  );
}

export function PreviewMode() {
  const { funnel, currentStepId, setPreviewMode } = useFunnel();
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  // ESC key handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPreviewMode]);

  const handleFormSubmit = useCallback(async (data: FunnelFormData, selections: FunnelSelections) => {
    console.log('Form submitted:', { data, selections });
    toast.success('Form data collected!', {
      description: `Captured: ${Object.keys(data).join(', ') || 'No data'}`,
    });
  }, []);

  return (
    <FunnelRuntimeProvider 
      funnel={funnel} 
      initialStepId={currentStepId || undefined}
      onFormSubmit={handleFormSubmit}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
      >
        {/* Enhanced gradient backdrop */}
        <div className="absolute inset-0 preview-backdrop" />
        
        {/* Ambient glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <PreviewHeader deviceMode={deviceMode} setDeviceMode={setDeviceMode} />

        {/* Preview Content */}
        <div className="relative flex-1 flex items-center justify-center p-8 overflow-hidden">
          <PreviewNavigation />

          {/* Device Frame */}
          <motion.div
            key={deviceMode}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative"
          >
            <PreviewContent deviceMode={deviceMode} />
          </motion.div>

          <PreviewNavigationRight />
        </div>
      </motion.div>
    </FunnelRuntimeProvider>
  );
}
