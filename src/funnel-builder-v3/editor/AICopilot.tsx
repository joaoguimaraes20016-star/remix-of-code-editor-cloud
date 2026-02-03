import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { BlockType } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  ChevronUp,
  Loader2,
  X,
  Wand2,
  MessageSquare,
  Copy,
  Zap,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { streamCopyGeneration, streamHelpResponse, streamCloneFromURL, streamGenerateFunnel, streamClonePlan, V3Context } from '@/funnel-builder-v3/lib/ai-service';
import { parseCopyResponse } from '@/funnel-builder-v3/lib/ai-parser';
import { parseGeneratedFunnel } from '@/funnel-builder-v3/lib/funnel-parser';
import { ClonedStyle } from '@/funnel-builder-v3/lib/clone-converter';
import { applyBrandingToStep, applyBrandingToFunnel } from '@/funnel-builder-v3/lib/branding-applier';
import { Block, FunnelStep } from '@/funnel-builder-v3/types/funnel';
import { blockDefinitions } from '@/funnel-builder-v3/lib/block-definitions';
import { v4 as uuid } from 'uuid';

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClonePlan {
  summary: string;
  action: 'replace-funnel' | 'replace-step';
  branding: {
    primaryColor: string;
    backgroundColor: string;
    theme: string;
  };
  steps?: Array<{
    name: string;
    type: string;
    blockCount: number;
    blockTypes: string[];
  }>;
  step?: {
    name: string;
    blockCount: number;
    blockTypes: string[];
  };
}

export function AICopilot({ isOpen, onClose }: AICopilotProps) {
  const { 
    funnel, 
    currentStepId, 
    selectedBlockId, 
    updateBlockContent,
    setFunnel,
    addStep,
    updateStep,
  } = useFunnel();
  
  const [mode, setMode] = useState<'copy' | 'help' | 'clone' | 'generate'>('copy');
  const [prompt, setPrompt] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [cloneLocation, setCloneLocation] = useState<'current' | 'new'>('current');
  const [generateLocation, setGenerateLocation] = useState<'replace' | 'add'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [clonedBranding, setClonedBranding] = useState<ClonedStyle | null>(null);
  const [showCloneConfirm, setShowCloneConfirm] = useState(false);
  const [cloneAction, setCloneAction] = useState<'replace-funnel' | 'replace-step' | null>(null);
  const [clonePlan, setClonePlan] = useState<ClonePlan | null>(null);
  const [isPlanningClone, setIsPlanningClone] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const currentStep = funnel.steps.find(s => s.id === currentStepId);
  const selectedBlock = currentStep?.blocks.find(b => b.id === selectedBlockId);
  
  // Build context for AI
  const buildContext = useCallback((): V3Context => {
    return {
      currentStepId,
      selectedBlockId,
      selectedBlockType: selectedBlock?.type,
      currentBlockContent: selectedBlock?.content,
      stepName: currentStep?.name,
      funnelName: funnel.name,
      availableBlockTypes: Object.keys(blockDefinitions) as BlockType[],
    };
  }, [currentStepId, selectedBlockId, selectedBlock?.type, selectedBlock?.content, currentStep?.name, funnel.name]);
  
  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Auto-apply copy when streaming completes
  useEffect(() => {
    if (!streamedResponse || isProcessing || mode !== 'copy') return;
    
    try {
      const parsed = parseCopyResponse(streamedResponse, selectedBlock?.type);
      
      if (parsed && currentStepId && selectedBlockId) {
        // Update block content with parsed content
        updateBlockContent(currentStepId, selectedBlockId, parsed.content);
        
        toast.success(`Updated ${selectedBlock?.type || 'block'} content`);
        setStreamedResponse('');
        setPrompt('');
        setIsProcessing(false);
      } else if (streamedResponse.trim() && !parsed) {
        // If we have response but couldn't parse, show error
        setError('Could not parse AI response. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('[AICopilot] Auto-apply error:', err);
      setError('Failed to apply generated content');
      setIsProcessing(false);
    }
  }, [streamedResponse, isProcessing, mode, selectedBlock?.type, currentStepId, selectedBlockId, updateBlockContent]);
  
  const handleGenerateCopy = async () => {
    if (!prompt.trim()) return;
    
    if (!selectedBlockId || !currentStepId) {
      toast.error('Please select a block first');
      return;
    }
    
    setIsProcessing(true);
    setStreamedResponse('');
    setError(null);
    
    const context = buildContext();
    
    await streamCopyGeneration(prompt, context, {
      onDelta: (chunk) => {
        setStreamedResponse(prev => prev + chunk);
      },
      onDone: () => {
        setIsProcessing(false);
      },
      onError: (err) => {
        setIsProcessing(false);
        setError(err.message);
        toast.error(err.message);
      },
    });
  };
  
  const handleAskQuestion = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    setStreamedResponse('');
    setError(null);
    
    const context = buildContext();
    
    await streamHelpResponse(prompt, context, {
      onDelta: (chunk) => {
        setStreamedResponse(prev => prev + chunk);
      },
      onDone: () => {
        setIsProcessing(false);
      },
      onError: (err) => {
        setIsProcessing(false);
        setError(err.message);
        toast.error(err.message);
      },
    });
  };
  
  const handleCloneFromURL = async () => {
    if (!cloneUrl.trim() || !cloneUrl.startsWith('http')) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    // Show confirmation dialog first
    setShowCloneConfirm(true);
  };

  const generateClonePlan = async (action: 'replace-funnel' | 'replace-step') => {
    setShowCloneConfirm(false);
    setIsPlanningClone(true);
    setClonePlan(null);
    setError(null);
    setStreamedResponse('');
    
    const context = buildContext();
    let fullResponse = '';
    
    await streamClonePlan(cloneUrl, { ...context, cloneAction: action }, {
      onDelta: (chunk) => {
        fullResponse += chunk;
        setStreamedResponse(fullResponse);
      },
      onDone: () => {
        setIsPlanningClone(false);
        
        try {
          const responseText = fullResponse || streamedResponse;
          if (!responseText.trim()) {
            setError('No response received from AI');
            return;
          }
          
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setClonePlan({
              summary: parsed.summary || 'Plan generated',
              action: parsed.action || action,
              branding: parsed.branding || {
                primaryColor: '#3b82f6',
                backgroundColor: '#ffffff',
                theme: 'light',
              },
              steps: parsed.steps,
              step: parsed.step,
            });
            setStreamedResponse('');
          } else {
            setError('Could not parse plan from response');
          }
        } catch (parseErr) {
          console.error('Parse plan error:', parseErr);
          setError(`Failed to parse plan: ${parseErr instanceof Error ? parseErr.message : 'Unknown error'}`);
        }
      },
      onError: (err) => {
        setIsPlanningClone(false);
        setError(err.message);
        toast.error(err.message);
      },
    });
  };

  const executeApprovedPlan = async (plan: ClonePlan) => {
    setClonePlan(null);
    setIsProcessing(true);
    setStreamedResponse('');
    setError(null);
    
    const context = buildContext();
    let fullResponse = '';
    
    await streamCloneFromURL(cloneUrl, { ...context, cloneAction: plan.action, approvedPlan: plan }, {
      onDelta: (chunk) => {
        fullResponse += chunk;
        setStreamedResponse(fullResponse);
      },
      onDone: async () => {
        setIsProcessing(false);
        
        try {
          const responseText = fullResponse || streamedResponse;
          if (!responseText.trim()) {
            setError('No response received from AI');
            return;
          }
          
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            toast.error('Could not parse JSON from clone response');
            return;
          }
          
          const parsed = JSON.parse(jsonMatch[0]);
          
          if (parsed.branding) {
            setClonedBranding(parsed.branding);
          }
          
          const createBlock = (b: any): Block | null => {
            const blockType = b.type as BlockType;
            const definition = blockDefinitions[blockType];
            
            if (!definition) {
              console.warn(`[AICopilot] Unknown block type: ${blockType}, skipping`);
              return null;
            }
            
            const mergedContent = {
              ...definition.defaultContent,
              ...b.content,
            };
            
            const mergedStyles = {
              ...definition.defaultStyles,
              ...b.styles,
              ...(blockType === 'button' && !b.styles?.textAlign && { textAlign: 'center' }),
            };
            
            if (blockType === 'button' && parsed.branding?.primaryColor && !b.content?.backgroundColor) {
              (mergedContent as any).backgroundColor = parsed.branding.primaryColor;
            }
            
            return {
              id: uuid(),
              type: blockType,
              content: mergedContent,
              styles: mergedStyles,
              trackingId: `block-${uuid()}`,
            };
          };
          
          if (plan.action === 'replace-funnel' && parsed.funnel && parsed.funnel.steps) {
            const newSteps: FunnelStep[] = parsed.funnel.steps.map((stepData: any) => {
              const blocks = (stepData.blocks || [])
                .map(createBlock)
                .filter((b: Block | null): b is Block => b !== null);
              
              return {
                id: uuid(),
                name: stepData.name || 'Step',
                type: stepData.type || 'capture',
                slug: stepData.slug || stepData.name?.toLowerCase().replace(/\s+/g, '-') || 'step',
                blocks,
                settings: {
                  backgroundColor: stepData.settings?.backgroundColor || parsed.branding?.backgroundColor || '#ffffff',
                },
              };
            });
            
            setFunnel({
              ...funnel,
              name: parsed.funnel.name || funnel.name,
              steps: newSteps,
            });
            
            toast.success(`Built funnel with ${newSteps.length} steps successfully!`);
            setCloneUrl('');
            setStreamedResponse('');
            return;
          }
          
          if (plan.action === 'replace-step' && parsed.step) {
            const blocks = (parsed.step.blocks || [])
              .map(createBlock)
              .filter((b: Block | null): b is Block => b !== null);
            
            if (blocks.length === 0) {
              toast.error('No valid blocks found in clone response');
              return;
            }
            
            if (!currentStepId) {
              toast.error('No current step selected');
              return;
            }
            
            updateStep(currentStepId, {
              name: parsed.step.name || currentStep?.name || 'Step',
              blocks,
              settings: {
                backgroundColor: parsed.step.settings?.backgroundColor || parsed.branding?.backgroundColor || currentStep?.settings?.backgroundColor || '#ffffff',
              },
            });
            
            toast.success(`Built step with ${blocks.length} blocks successfully!`);
            setCloneUrl('');
            setStreamedResponse('');
            return;
          }
          
          toast.error('Unexpected response format');
        } catch (err) {
          console.error('[AICopilot] Execute plan error:', err);
          setError(err instanceof Error ? err.message : 'Failed to execute plan');
        }
      },
      onError: (err) => {
        setIsProcessing(false);
        setError(err.message);
        toast.error(err.message);
      },
    });
  };

  const executeClone = async (action: 'replace-funnel' | 'replace-step') => {
    setShowCloneConfirm(false);
    setCloneAction(action);
    setIsProcessing(true);
    setStreamedResponse('');
    setError(null);
    
    const context = buildContext();
    let fullResponse = '';
    
    await streamCloneFromURL(cloneUrl, { ...context, cloneAction: action }, {
      onDelta: (chunk) => {
        fullResponse += chunk;
        setStreamedResponse(fullResponse);
      },
      onDone: async () => {
        setIsProcessing(false);
        
        // Parse the response
        try {
          const responseText = fullResponse || streamedResponse;
          if (!responseText.trim()) {
            setError('No response received from AI');
            return;
          }
          
          // Try to parse response
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              toast.error('Could not parse JSON from clone response');
              return;
            }
            
            const parsed = JSON.parse(jsonMatch[0]);
            
            if (parsed.branding) {
              setClonedBranding(parsed.branding);
            }
            
            // Helper function to create a block from parsed data
            const createBlock = (b: any): Block | null => {
              const blockType = b.type as BlockType;
              const definition = blockDefinitions[blockType];
              
              if (!definition) {
                console.warn(`[AICopilot] Unknown block type: ${blockType}, skipping`);
                return null;
              }
              
              const mergedContent = {
                ...definition.defaultContent,
                ...b.content,
              };
              
              const mergedStyles = {
                ...definition.defaultStyles,
                ...b.styles,
                ...(blockType === 'button' && !b.styles?.textAlign && { textAlign: 'center' }),
              };
              
              // Apply branding colors to buttons
              if (blockType === 'button' && parsed.branding?.primaryColor && !b.content?.backgroundColor) {
                (mergedContent as any).backgroundColor = parsed.branding.primaryColor;
              }
              
              return {
                id: uuid(),
                type: blockType,
                content: mergedContent,
                styles: mergedStyles,
                trackingId: `block-${uuid()}`,
              };
            };
            
            // Handle replace-funnel action
            if (cloneAction === 'replace-funnel' && parsed.funnel && parsed.funnel.steps) {
              const newSteps: FunnelStep[] = parsed.funnel.steps.map((stepData: any) => {
                const blocks = (stepData.blocks || [])
                  .map(createBlock)
                  .filter((b: Block | null): b is Block => b !== null);
                
                return {
                  id: uuid(),
                  name: stepData.name || 'Step',
                  type: stepData.type || 'capture',
                  slug: stepData.slug || stepData.name?.toLowerCase().replace(/\s+/g, '-') || 'step',
                  blocks,
                  settings: {
                    backgroundColor: stepData.settings?.backgroundColor || parsed.branding?.backgroundColor || '#ffffff',
                  },
                };
              });
              
              setFunnel({
                ...funnel,
                name: parsed.funnel.name || funnel.name,
                steps: newSteps,
              });
              
              toast.success(`Rebuilt funnel with ${newSteps.length} steps`);
              setCloneUrl('');
              setStreamedResponse('');
              return;
            }
            
            // Handle replace-step action
            if (cloneAction === 'replace-step' && parsed.step) {
              const blocks = (parsed.step.blocks || [])
                .map(createBlock)
                .filter((b: Block | null): b is Block => b !== null);
              
              if (blocks.length === 0) {
                toast.error('No valid blocks found in clone response');
                return;
              }
              
              if (!currentStepId) {
                toast.error('No current step selected');
                return;
              }
              
              updateStep(currentStepId, {
                name: parsed.step.name || currentStep?.name || 'Step',
                blocks,
                settings: {
                  backgroundColor: parsed.step.settings?.backgroundColor || parsed.branding?.backgroundColor || currentStep?.settings?.backgroundColor || '#ffffff',
                },
              });
              
              toast.success(`Rebuilt current step with ${blocks.length} blocks`);
              setCloneUrl('');
              setStreamedResponse('');
              return;
            }
            
            // Fallback: Handle old format (blocks array)
            if (parsed.blocks && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
              const newBlocks = parsed.blocks
                .map(createBlock)
                .filter((b: Block | null): b is Block => b !== null);
              
              if (newBlocks.length === 0) {
                toast.error('No valid blocks found in clone response');
                return;
              }
              
              if (cloneLocation === 'current' && currentStep) {
                updateStep(currentStep.id, {
                  blocks: [...currentStep.blocks, ...newBlocks],
                });
                toast.success(`Added ${newBlocks.length} blocks to current step`);
              } else {
                const newStep: FunnelStep = {
                  id: uuid(),
                  name: 'Cloned Page',
                  type: 'capture',
                  slug: 'cloned-page',
                  blocks: newBlocks,
                  settings: {
                    backgroundColor: parsed.branding?.backgroundColor || '#ffffff',
                  },
                };
                addStep(newStep);
                toast.success(`Created new step with ${newBlocks.length} blocks`);
              }
              
              setCloneUrl('');
              setStreamedResponse('');
            } else if (parsed.branding) {
              toast.success('Branding cloned successfully');
            } else {
              toast.error('No blocks or branding found in clone response');
            }
          } catch (parseErr) {
            console.error('Parse error:', parseErr);
            setError(`Failed to parse response: ${parseErr instanceof Error ? parseErr.message : 'Unknown error'}`);
            toast.error('Failed to parse clone response. Check the response tab for details.');
          }
        } catch (err) {
          console.error('[AICopilot] Clone error:', err);
          setError(err instanceof Error ? err.message : 'Failed to clone from URL');
        }
      },
      onError: (err) => {
        setIsProcessing(false);
        setError(err.message);
        toast.error(err.message);
      },
    });
  };
  
  const handleGenerateFunnel = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    setStreamedResponse('');
    setError(null);
    
    const context = buildContext();
    
    let fullResponse = '';
    
    await streamGenerateFunnel(prompt, context, {
      onDelta: (chunk) => {
        fullResponse += chunk;
        setStreamedResponse(fullResponse);
      },
      onDone: async () => {
        setIsProcessing(false);
        
        // Parse the generated funnel
        try {
          const responseText = fullResponse || streamedResponse;
          if (!responseText.trim()) {
            setError('No response received from AI');
            return;
          }
          
          const parsed = parseGeneratedFunnel(responseText);
          
          if (!parsed.steps || parsed.steps.length === 0) {
            setError('No steps generated');
            return;
          }
          
          try {
            if (generateLocation === 'replace') {
              // Replace entire funnel
              const newFunnel = clonedBranding 
                ? applyBrandingToFunnel({
                    ...funnel,
                    steps: parsed.steps,
                  }, clonedBranding)
                : {
                    ...funnel,
                    steps: parsed.steps,
                  };
              
              setFunnel(newFunnel);
              toast.success(`Generated funnel with ${parsed.steps.length} steps`);
            } else {
              // Add steps to existing funnel
              const newSteps = clonedBranding
                ? parsed.steps.map(step => applyBrandingToStep(step, clonedBranding))
                : parsed.steps;
              
              setFunnel({
                ...funnel,
                steps: [...funnel.steps, ...newSteps],
              });
              toast.success(`Added ${newSteps.length} steps to funnel`);
            }
            
            setStreamedResponse('');
            setPrompt('');
          } catch (updateErr) {
            console.error('[AICopilot] Update funnel error:', updateErr);
            setError('Failed to update funnel');
          }
        } catch (err) {
          console.error('[AICopilot] Parse generate error:', err);
          setError(err instanceof Error ? err.message : 'Failed to parse generated funnel');
        }
      },
      onError: (err) => {
        setIsProcessing(false);
        setError(err.message);
        toast.error(err.message);
      },
    });
  };
  
  const handleSubmit = () => {
    if (mode === 'copy') {
      handleGenerateCopy();
    } else if (mode === 'help') {
      handleAskQuestion();
    } else if (mode === 'clone') {
      handleCloneFromURL();
    } else if (mode === 'generate') {
      handleGenerateFunnel();
    }
  };
  
  const getPlaceholder = () => {
    if (mode === 'copy') {
      return selectedBlock 
        ? `Generate copy for this ${selectedBlock.type}...`
        : 'Select a block to generate copy...';
    } else if (mode === 'help') {
      return "Ask questions about Funnel Builder V3...";
    } else if (mode === 'clone') {
      return "Enter a website URL to clone branding and content...";
    } else {
      return "Describe the funnel you want to generate...";
    }
  };

  const getInputValue = () => {
    if (mode === 'clone') {
      return cloneUrl;
    }
    return prompt;
  };

  const setInputValue = (value: string) => {
    if (mode === 'clone') {
      setCloneUrl(value);
    } else {
      setPrompt(value);
    }
  };

  const canSubmit = () => {
    if (mode === 'copy') {
      return selectedBlockId && prompt.trim() && !isProcessing;
    } else if (mode === 'clone') {
      return cloneUrl.trim() && cloneUrl.startsWith('http') && !isProcessing && !showCloneConfirm;
    } else {
      return prompt.trim() && !isProcessing;
    }
  };

  if (!isOpen) return null;
  
  return (
    <motion.div 
      ref={panelRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'w-[480px] border-r border-border bg-background flex flex-col shrink-0 h-full overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <span className="text-base font-semibold text-foreground">Assistant</span>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-muted/50 rounded transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-6 space-y-6">
          {/* Context-Aware Headers */}
          {mode === 'copy' && selectedBlock && (
            <div className="text-xs text-muted-foreground pb-2 border-b border-border/50">
              Editing <span className="font-medium text-foreground capitalize">{selectedBlock.type}</span> block
            </div>
          )}
          
          {mode === 'clone' && cloneUrl && !showCloneConfirm && !clonePlan && (
            <div className="text-xs text-muted-foreground pb-2 border-b border-border/50">
              Cloning from <span className="font-medium text-foreground truncate">{(() => {
                try {
                  return new URL(cloneUrl).hostname;
                } catch {
                  return cloneUrl;
                }
              })()}</span>
            </div>
          )}
          
          {mode === 'generate' && (
            <div className="text-xs text-muted-foreground pb-2 border-b border-border/50">
              Will {generateLocation === 'replace' ? 'replace funnel' : 'add steps'}
            </div>
          )}
          
          {mode === 'copy' && !selectedBlockId && (
            <div className="text-sm text-muted-foreground py-2">
              Select a block to generate copy for it
            </div>
          )}

          {clonedBranding && mode === 'generate' && (
            <div className="p-4 rounded-md bg-muted/30 border border-border/50 text-sm">
              <div className="font-medium mb-2">Using branding:</div>
              <div className="text-muted-foreground break-words">
                {clonedBranding.primaryColor} • {clonedBranding.theme} theme
              </div>
            </div>
          )}

          {/* Clone Confirmation Dialog */}
          {showCloneConfirm && mode === 'clone' && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
              <div className="text-sm font-medium text-foreground">What would you like to do?</div>
              <div className="space-y-2">
                <button
                  onClick={() => generateClonePlan('replace-funnel')}
                  className="w-full px-4 py-2.5 text-left text-sm rounded-md bg-background border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium">Replace entire funnel</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Rebuild the whole funnel using this page as inspiration
                  </div>
                </button>
                <button
                  onClick={() => generateClonePlan('replace-step')}
                  className="w-full px-4 py-2.5 text-left text-sm rounded-md bg-background border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium">Replace current step only</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Rebuild just this step using the page as reference
                  </div>
                </button>
                <button
                  onClick={() => setShowCloneConfirm(false)}
                  className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Planning Indicator */}
          {isPlanningClone && mode === 'clone' && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Analyzing page and creating plan...</div>
              </div>
            </div>
          )}

          {/* Plan Preview */}
          {clonePlan && mode === 'clone' && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
              {/* Summary */}
              <div>
                <div className="text-sm font-medium mb-1">Here's what I'll build:</div>
                <div className="text-sm text-muted-foreground">{clonePlan.summary}</div>
              </div>
              
              {/* Branding Preview */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: clonePlan.branding.primaryColor }} />
                <span className="text-xs text-muted-foreground capitalize">{clonePlan.branding.theme} theme</span>
              </div>
              
              {/* Expandable Details */}
              {(clonePlan.steps || clonePlan.step) && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details" className="border-none">
                    <AccordionTrigger className="text-xs py-2 hover:no-underline">
                      View details
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      {clonePlan.steps?.map((step, i) => (
                        <div key={i} className="py-2 border-b border-border/50 last:border-0">
                          <div className="font-medium text-sm">{step.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {step.blockCount} blocks: {step.blockTypes.slice(0, 5).join(', ')}
                            {step.blockTypes.length > 5 && ` +${step.blockTypes.length - 5} more`}
                          </div>
                        </div>
                      ))}
                      {clonePlan.step && (
                        <div className="py-2">
                          <div className="font-medium text-sm">{clonePlan.step.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {clonePlan.step.blockCount} blocks: {clonePlan.step.blockTypes.slice(0, 5).join(', ')}
                            {clonePlan.step.blockTypes.length > 5 && ` +${clonePlan.step.blockTypes.length - 5} more`}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => executeApprovedPlan(clonePlan)} 
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Building...
                    </>
                  ) : (
                    'Build This'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setClonePlan(null);
                    setStreamedResponse('');
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Response Display */}
          {streamedResponse && !isProcessing && (
            <div className="p-4 rounded-md bg-muted/30 border border-border/50">
              <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Response:</div>
              <ScrollArea className="max-h-[200px]">
                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed pr-4">{streamedResponse}</div>
              </ScrollArea>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive break-words">
              {error}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Bottom Input Area */}
      <div className="border-t border-border/50 bg-background p-4">
        {/* Editing Context - Close to toggles */}
        {mode === 'copy' && selectedBlock && (
          <div className="mb-3">
            <div className="text-xs font-medium text-foreground/70">
              Editing: <span className="font-medium text-foreground capitalize">{selectedBlock.type}</span>
            </div>
          </div>
        )}
        
        {/* Options for Generate - Close to toggles (Clone mode uses plan flow instead) */}
        {mode === 'generate' && (
          <div className="mb-3">
            <div className="text-xs font-medium text-foreground/70 mb-2">
              Action:
            </div>
            <RadioGroup 
              value={generateLocation} 
              onValueChange={(v) => {
                setGenerateLocation(v as 'replace' | 'add');
              }} 
              className="space-y-1.5"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="gen-replace" className="h-3.5 w-3.5" />
                <Label htmlFor="gen-replace" className="text-xs font-normal cursor-pointer text-foreground/70">
                  Replace funnel
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="gen-add" className="h-3.5 w-3.5" />
                <Label htmlFor="gen-add" className="text-xs font-normal cursor-pointer text-foreground/70">
                  Add steps
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
        
        {/* Mode Selector Pills */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setMode('copy')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              mode === 'copy' 
                ? "bg-foreground text-background" 
                : "bg-muted/50 text-foreground/60 hover:bg-muted hover:text-foreground/80"
            )}
          >
            <Wand2 className="w-3 h-3" />
            Copy
          </button>
          <button
            onClick={() => setMode('help')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              mode === 'help' 
                ? "bg-foreground text-background" 
                : "bg-muted/50 text-foreground/60 hover:bg-muted hover:text-foreground/80"
            )}
          >
            <MessageSquare className="w-3 h-3" />
            Help
          </button>
          <button
            onClick={() => setMode('clone')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              mode === 'clone' 
                ? "bg-foreground text-background" 
                : "bg-muted/50 text-foreground/60 hover:bg-muted hover:text-foreground/80"
            )}
          >
            <Copy className="w-3 h-3" />
            Clone
          </button>
          <button
            onClick={() => setMode('generate')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              mode === 'generate' 
                ? "bg-foreground text-background" 
                : "bg-muted/50 text-foreground/60 hover:bg-muted hover:text-foreground/80"
            )}
          >
            <Zap className="w-3 h-3" />
            Generate
          </button>
        </div>
        
        {/* Single Chat Input */}
        <div className="flex items-end gap-2">
          <Textarea
            value={getInputValue()}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={getPlaceholder()}
            className="resize-none flex-1 text-sm min-h-[44px] max-h-[120px] py-2.5"
            disabled={isProcessing || (mode === 'copy' && !selectedBlockId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && canSubmit()) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={2}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="shrink-0 h-10 w-10"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
