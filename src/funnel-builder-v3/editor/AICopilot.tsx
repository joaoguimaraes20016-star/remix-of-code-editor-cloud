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
import { toast } from 'sonner';
import { streamCopyGeneration, streamHelpResponse, streamCloneFromURL, streamGenerateFunnel, V3Context } from '@/funnel-builder-v3/lib/ai-service';
import { parseCopyResponse } from '@/funnel-builder-v3/lib/ai-parser';
import { parseGeneratedFunnel } from '@/funnel-builder-v3/lib/funnel-parser';
import { ClonedStyle } from '@/funnel-builder-v3/lib/clone-converter';
import { applyBrandingToStep, applyBrandingToFunnel } from '@/funnel-builder-v3/lib/branding-applier';
import { Block, FunnelStep } from '@/funnel-builder-v3/types/funnel';
import { blockDefinitions } from '@/funnel-builder-v3/lib/block-definitions';

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
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
    
    setIsProcessing(true);
    setStreamedResponse('');
    setError(null);
    
    const context = buildContext();
    let fullResponse = '';
    
    await streamCloneFromURL(cloneUrl, context, {
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
          
          // Try to parse branding and blocks from response
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              
              if (parsed.branding) {
                setClonedBranding(parsed.branding);
              }
              
              // Handle blocks if present
              if (parsed.blocks && Array.isArray(parsed.blocks)) {
                // Implementation would go here to add blocks
                toast.success('Branding cloned successfully');
              }
            }
          } catch (parseErr) {
            // If JSON parsing fails, just show the response
            console.error('Parse error:', parseErr);
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
      return cloneUrl.trim() && cloneUrl.startsWith('http') && !isProcessing;
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
        
        {/* Options for Clone and Generate - Close to toggles */}
        {(mode === 'clone' || mode === 'generate') && (
          <div className="mb-3">
            <div className="text-xs font-medium text-foreground/70 mb-2">
              {mode === 'clone' ? 'Add to:' : 'Action:'}
            </div>
            <RadioGroup 
              value={mode === 'clone' ? cloneLocation : generateLocation} 
              onValueChange={(v) => {
                if (mode === 'clone') {
                  setCloneLocation(v as 'current' | 'new');
                } else {
                  setGenerateLocation(v as 'replace' | 'add');
                }
              }} 
              className="space-y-1.5"
            >
              {mode === 'clone' ? (
                <>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="current" id="clone-current" className="h-3.5 w-3.5" />
                    <Label htmlFor="clone-current" className="text-xs font-normal cursor-pointer text-foreground/70">
                      Current step
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="clone-new" className="h-3.5 w-3.5" />
                    <Label htmlFor="clone-new" className="text-xs font-normal cursor-pointer text-foreground/70">
                      New step
                    </Label>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
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
