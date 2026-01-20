/**
 * CaptureFlowModal - Renders a CaptureFlow in a modal overlay
 * Used when a button triggers the 'open-capture-flow' action
 * 
 * Uses useUnifiedLeadSubmit for proper lead creation/CRM integration.
 */

import React, { useEffect, useCallback } from 'react';
import { X, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CaptureFlow, CaptureFlowAnswers } from '../../types/captureFlow';
import { useCaptureFlowState } from '../hooks/useCaptureFlowState';
import { CaptureNodeRenderer } from './capture-flow/CaptureNodeRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedLeadSubmit, createUnifiedPayload } from '@/flow-canvas/shared/hooks/useUnifiedLeadSubmit';

interface CaptureFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  captureFlow: CaptureFlow;
  onComplete?: (answers: CaptureFlowAnswers) => void;
  /** Required for lead submission */
  funnelId: string;
  teamId: string;
  /** UTM tracking */
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export const CaptureFlowModal: React.FC<CaptureFlowModalProps> = ({
  isOpen,
  onClose,
  captureFlow,
  onComplete,
  funnelId,
  teamId,
  utmSource,
  utmMedium,
  utmCampaign,
}) => {
  // Unified lead submission hook
  const { submit: submitLead, leadId: hookLeadId, isSubmitting: hookIsSubmitting, lastError } = useUnifiedLeadSubmit({
    funnelId,
    teamId,
    utmSource,
    utmMedium,
    utmCampaign,
    onLeadSaved: (id, mode) => {
      console.log(`[CaptureFlowModal] Lead saved: ${id}, mode=${mode}`);
    },
    onError: (error) => {
      console.error('[CaptureFlowModal] Submission error:', error);
    },
  });

  // Handler to submit via unified pipeline - receives currentNodeId for accurate step tracking
  const handleUnifiedSubmit = useCallback(async (
    answers: CaptureFlowAnswers, 
    currentNodeId: string | null
  ): Promise<{ success: boolean; leadId?: string; error?: string }> => {
    // Build payload with current node ID as stepId and all node IDs
    const nodeIds = captureFlow.nodes.map(n => n.id);
    
    const payload = createUnifiedPayload(
      answers as Record<string, any>,
      {
        funnelId,
        teamId,
        stepId: currentNodeId ?? captureFlow.id, // Fallback to captureFlow.id if null
        stepIds: nodeIds,
        stepType: 'capture-flow',
        stepIntent: 'capture',
      },
      {
        metadata: {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        },
      }
    );

    const result = await submitLead(payload);
    
    if (result.error) {
      return { 
        success: false, 
        error: typeof result.error === 'string' ? result.error : result.error?.message || 'Submission failed' 
      };
    }
    
    return { success: true, leadId: result.leadId };
  }, [captureFlow.nodes, funnelId, teamId, utmSource, utmMedium, utmCampaign, submitLead]);

  const {
    state,
    currentNode,
    currentNodeIndex,
    totalNodes,
    progress,
    setAnswer,
    validateCurrentNode,
    advance,
    goBack,
    canGoBack,
    submit,
    reset,
    submitError,
    leadId,
  } = useCaptureFlowState({
    captureFlow,
    onComplete: (answers) => {
      onComplete?.(answers);
    },
    onSubmit: handleUnifiedSubmit,
  });

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleContinue = async () => {
    if (!validateCurrentNode()) return;

    // Check if this is the last node
    if (currentNodeIndex === totalNodes - 1) {
      const success = await submit();
      if (success) {
        // Show completion state briefly, then close
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } else {
      advance();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContinue();
    }
  };

  // Build background style from appearance
  const getBackgroundStyle = (): React.CSSProperties => {
    const bg = captureFlow.appearance.background;
    if (!bg) return {};

    switch (bg.type) {
      case 'solid':
        return { backgroundColor: bg.color || '#ffffff' };
      case 'gradient':
        if (bg.gradient) {
          const stops = bg.gradient.stops
            .map(s => `${s.color} ${s.position}%`)
            .join(', ');
          const angle = bg.gradient.type === 'linear' ? `${bg.gradient.angle}deg` : 'circle';
          const gradientType = bg.gradient.type === 'linear' ? 'linear-gradient' : 'radial-gradient';
          return { background: `${gradientType}(${angle}, ${stops})` };
        }
        return {};
      case 'image':
        return {
          backgroundImage: `url(${bg.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      default:
        return {};
    }
  };

  const isComplete = state.isComplete;
  const isSubmitting = state.isSubmitting;
  const displayError = submitError || lastError;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-2xl w-full h-[90vh] max-h-[700px] p-0 overflow-hidden border-0"
        style={getBackgroundStyle()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          {/* Back Button */}
          <button
            onClick={goBack}
            disabled={!canGoBack || isSubmitting}
            className={cn(
              'p-2 rounded-full transition-all',
              canGoBack && !isSubmitting
                ? 'hover:bg-black/10 text-foreground'
                : 'opacity-0 pointer-events-none'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {captureFlow.appearance.showProgress && (
          <div className="absolute top-16 left-4 right-4 z-10">
            <div className="h-1 bg-black/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {currentNodeIndex + 1} of {totalNodes}
              </span>
              <span className="text-xs text-muted-foreground">
                {progress}%
              </span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div 
          className="flex-1 flex items-center justify-center p-8 pt-24 pb-8 overflow-y-auto"
          style={{ color: captureFlow.appearance.textColor || 'inherit' }}
          onKeyDown={handleKeyDown}
        >
          <AnimatePresence mode="wait">
            {isComplete ? (
              // Completion State
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {captureFlow.submitBehavior.successMessage || 'Thank you!'}
                </h2>
                <p className="text-muted-foreground">
                  Your response has been submitted.
                </p>
              </motion.div>
            ) : currentNode ? (
              // Current Node
              <motion.div
                key={currentNode.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-md"
              >
                <CaptureNodeRenderer
                  node={currentNode}
                  value={state.answers[currentNode.fieldKey] ?? null}
                  onChange={(value) => setAnswer(currentNode.fieldKey, value)}
                  onSubmit={handleContinue}
                  validationError={state.validationErrors[currentNode.fieldKey]}
                />
                
                {/* Display submission error if any */}
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 text-destructive text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{displayError}</span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              // No nodes fallback
              <div className="text-center text-muted-foreground">
                <p>This CaptureFlow has no nodes.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with Continue Button (if not complete) */}
        {!isComplete && currentNode && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
            <button
              onClick={handleContinue}
              disabled={isSubmitting}
              className={cn(
                'w-full py-3 px-6 rounded-lg font-medium transition-all',
                'bg-primary text-primary-foreground hover:brightness-110',
                isSubmitting && 'opacity-50 cursor-wait'
              )}
              style={captureFlow.appearance.accentColor ? {
                backgroundColor: captureFlow.appearance.accentColor,
              } : undefined}
            >
              {isSubmitting 
                ? 'Submitting...' 
                : currentNodeIndex === totalNodes - 1 
                  ? (currentNode.settings.buttonText || 'Submit')
                  : (currentNode.settings.buttonText || 'Continue')
              }
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CaptureFlowModal;
