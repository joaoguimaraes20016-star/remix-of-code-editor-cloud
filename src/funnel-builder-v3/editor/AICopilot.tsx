import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { BlockType } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  ChevronUp,
  ChevronRight,
  Loader2,
  X,
  Wand2,
  MessageSquare,
  Copy,
  Zap,
  Check,
  Lightbulb,
  Layout,
  Wrench,
  HelpCircle,
  Link,
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

// Preset prompts for each mode - matching automation builder design
const COPY_PRESETS = [
  { icon: Wand2, label: "Write high-converting headline copy", prompt: "Write a high-converting headline and subheadline for this block" },
  { icon: Lightbulb, label: "Generate testimonial content", prompt: "Generate 3 realistic customer testimonials with names and results" },
  { icon: Layout, label: "Write a compelling CTA section", prompt: "Write compelling call-to-action copy with urgency and benefits" },
];

const GENERATE_PRESETS = [
  { icon: Wand2, label: "Build a VSL funnel for my course", prompt: "Build a VSL funnel for my online course with a hero section, video player, testimonials, pricing, and checkout button" },
  { icon: Lightbulb, label: "Create a lead magnet opt-in page", prompt: "Create a lead magnet opt-in page with attention-grabbing headline, 3-5 bullet points of benefits, email capture form, and privacy note" },
  { icon: Layout, label: "Design a booking page with calendar", prompt: "Design a booking page for high-ticket sales calls with headline, qualification bullets, calendar booking widget, and confirmation message" },
];

const HELP_PRESETS = [
  { icon: HelpCircle, label: "How do I increase conversions?", prompt: "What are the best practices to increase funnel conversion rates?" },
  { icon: Lightbulb, label: "What sections should I add?", prompt: "Based on my current funnel, what sections should I add to improve it?" },
  { icon: Wand2, label: "Optimize my funnel copy", prompt: "Review my funnel and suggest copy improvements for better conversions" },
];

const CLONE_PRESETS = [
  { icon: Link, label: "Clone a competitor's landing page", prompt: "https://" },
  { icon: Lightbulb, label: "Clone a high-converting VSL page", prompt: "https://" },
  { icon: Layout, label: "Clone a webinar registration page", prompt: "https://" },
];

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BlockPreview {
  type: string;
  preview: string;
}

// Branding subset used by AICopilot for color/theme context (separate from full ClonedStyle)
interface CopilotBranding {
  primaryColor: string;
  accentColor?: string;
  backgroundColor: string;
  textColor: string;
  headingColor?: string;
  theme: 'dark' | 'light';
}

interface ClonePlan {
  summary: string;
  action: 'replace-funnel' | 'replace-step' | 'apply-styling';
  detected?: {
    topic: string;
    style: string;
    keyElements?: string[];
  };
  branding: CopilotBranding;
  steps?: Array<{
    name: string;
    type?: string;
    blockCount?: number;
    blockTypes?: string[];
    description?: string;
    blocks?: BlockPreview[];
  }>;
  step?: {
    name: string;
    blockCount?: number;
    blockTypes?: string[];
    description?: string;
    blocks?: BlockPreview[];
  };
}

// Helper: Calculate contrast color for text on a background
const getContrastColor = (hexColor: string): string => {
  if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

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
  const [clonedBranding, setClonedBranding] = useState<CopilotBranding | null>(null);
  const [showCloneConfirm, setShowCloneConfirm] = useState(false);
  const [cloneAction, setCloneAction] = useState<'replace-funnel' | 'replace-step' | 'apply-styling' | null>(null);
  const [clonePlan, setClonePlan] = useState<ClonePlan | null>(null);
  const [isPlanningClone, setIsPlanningClone] = useState(false);
  const [cloneInstructions, setCloneInstructions] = useState('');
  const [isGeneratingFromReference, setIsGeneratingFromReference] = useState(false);
  const [referenceContext, setReferenceContext] = useState<{
    sourceUrl: string;
    instructions: string;
    action: 'replace-funnel' | 'replace-step';
  } | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<{
    stepCount: number;
    blockCount: number;
  } | null>(null);
  const [pendingSteps, setPendingSteps] = useState<FunnelStep[] | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const currentStep = funnel.steps.find(s => s.id === currentStepId);
  const selectedBlock = currentStep?.blocks.find(b => b.id === selectedBlockId);
  
  // Build context for AI - includes branding when available
  const buildContext = useCallback((): V3Context & { branding?: typeof clonedBranding } => {
    return {
      currentStepId,
      selectedBlockId,
      selectedBlockType: selectedBlock?.type,
      currentBlockContent: selectedBlock?.content,
      stepName: currentStep?.name,
      funnelName: funnel.name,
      availableBlockTypes: Object.keys(blockDefinitions) as BlockType[],
      // Include branding from clone if available - this ensures generate uses the extracted colors
      branding: clonedBranding ? {
        primaryColor: clonedBranding.primaryColor,
        accentColor: clonedBranding.accentColor,
        backgroundColor: clonedBranding.backgroundColor,
        textColor: clonedBranding.textColor,
        headingColor: clonedBranding.headingColor,
        theme: clonedBranding.theme,
      } : undefined,
    };
  }, [currentStepId, selectedBlockId, selectedBlock?.type, selectedBlock?.content, currentStep?.name, funnel.name, clonedBranding]);
  
  // Helper to build a generate prompt from clone plan content
  const buildPromptFromPlan = (plan: ClonePlan, userInstructions?: string): string => {
    const steps = plan.steps || (plan.step ? [plan.step] : []);
    const stepDescriptions = steps.map((s, i) => {
      const blocks = s.blocks?.map(b => `  - ${b.type}: "${b.preview}"`).join('\n') || '';
      const blockTypes = s.blockTypes?.join(', ') || '';
      const description = s.description || '';
      
      let stepContent = `Step ${i + 1} - ${s.name}`;
      if (description) {
        stepContent += `\n  Description: ${description}`;
      }
      if (blocks) {
        stepContent += `\n  Blocks to create:\n${blocks}`;
      } else if (blockTypes) {
        stepContent += `\n  Block types: ${blockTypes}`;
      }
      return stepContent;
    }).join('\n\n');
    
    const topic = plan.detected?.topic || 'Landing page';
    const style = plan.detected?.style || 'Professional';
    const keyElements = plan.detected?.keyElements?.join(', ') || '';
    
    let prompt = `Create a ${plan.action === 'replace-funnel' ? 'multi-step funnel' : 'single step'} based on this reference:

REFERENCE DETAILS:
Topic: ${topic}
Style: ${style}
${keyElements ? `Key Elements: ${keyElements}` : ''}

BRANDING TO APPLY:
- Background: ${plan.branding.backgroundColor}
- Primary Color: ${plan.branding.primaryColor}
- Text Color: ${plan.branding.textColor}
- Heading Color: ${plan.branding.headingColor || plan.branding.textColor}
- Theme: ${plan.branding.theme}

CONTENT STRUCTURE:
${stepDescriptions}`;

    if (userInstructions && userInstructions.trim()) {
      prompt += `\n\nUSER INSTRUCTIONS (IMPORTANT - Follow these preferences):
${userInstructions}`;
    }

    prompt += `\n\nIMPORTANT: Use the branding colors provided above. Make sure all text is readable against the background (${plan.branding.textColor} text on ${plan.branding.backgroundColor} background).`;

    return prompt;
  };
  
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

  const generateClonePlan = async (action: 'replace-funnel' | 'replace-step' | 'apply-styling') => {
    setShowCloneConfirm(false);
    setIsPlanningClone(true);
    setClonePlan(null);
    setError(null);
    setStreamedResponse('');
    
    const context = buildContext();
    let fullResponse = '';
    let hasError = false;
    
    await streamClonePlan(cloneUrl, { ...context, cloneAction: action }, {
      onDelta: (chunk) => {
        fullResponse += chunk;
        setStreamedResponse(fullResponse);
      },
      onDone: () => {
        // Don't process if an error already occurred
        if (hasError) {
          return;
        }
        
        try {
          const responseText = fullResponse || streamedResponse;
          if (!responseText.trim()) {
            setError('No response received from AI. Please check your connection and try again.');
            setStreamedResponse(''); // Clear before setting flag
            setIsPlanningClone(false);
            toast.error('No response received from AI');
            return;
          }
          
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate and enhance summary if it's too short or generic
            let summary = parsed.summary || '';
            const isSummaryTooShort = !summary || summary.length < 50 || 
              summary.toLowerCase().includes('plan generated') ||
              (summary.toLowerCase().includes('theme') && summary.split(' ').length < 10);
            
            if (isSummaryTooShort) {
              // Construct a detailed summary from the parsed data
              const detected = parsed.detected;
              const branding = parsed.branding;
              const steps = parsed.steps || (parsed.step ? [parsed.step] : []);
              
              const topic = detected?.topic || 'this landing page';
              const style = detected?.style || branding?.theme || 'professional';
              const bgColor = branding?.backgroundColor || '#ffffff';
              const primaryColor = branding?.primaryColor || '#3b82f6';
              const theme = branding?.theme || 'light';
              const textColor = branding?.textColor || getContrastColor(bgColor);
              
              if (action === 'replace-funnel' && steps.length > 0) {
                const stepDescriptions = steps.map((s: any, i: number) => 
                  `(${i + 1}) ${s.name} with ${s.blockCount} blocks including ${s.blockTypes?.slice(0, 3).join(', ')}${s.blockTypes?.length > 3 ? ' and more' : ''}`
                ).join(', ');
                
                summary = `Based on this ${topic} landing page, I'll create a ${steps.length}-step ${theme}-themed funnel: ${stepDescriptions}. Using ${bgColor} backgrounds with ${primaryColor} accents for buttons and highlights, creating a ${style} feel. Text will be ${textColor} for proper readability against the ${theme} background. Each step will include the necessary blocks to achieve its purpose.`;
              } else if (parsed.step) {
                const step = parsed.step;
                summary = `Based on this ${topic} landing page, I'll create a single step: ${step.name} with ${step.blockCount} blocks including ${step.blockTypes?.slice(0, 4).join(', ')}${step.blockTypes?.length > 4 ? ' and more' : ''}. Using ${bgColor} backgrounds with ${primaryColor} accents, creating a ${style} feel. Text will be ${textColor} for proper readability.`;
              } else {
                summary = `Based on this ${topic} landing page, I'll create a ${theme}-themed funnel with ${style} styling. Using ${bgColor} backgrounds with ${primaryColor} accents. Text will be ${textColor} for proper contrast.`;
              }
            }
            
            setClonePlan({
              summary: summary,
              action: parsed.action || action,
              detected: parsed.detected,
              branding: {
                primaryColor: parsed.branding?.primaryColor || '#3b82f6',
                accentColor: parsed.branding?.accentColor,
                backgroundColor: parsed.branding?.backgroundColor || '#ffffff',
                textColor: parsed.branding?.textColor || getContrastColor(parsed.branding?.backgroundColor || '#ffffff'),
                headingColor: parsed.branding?.headingColor,
                theme: parsed.branding?.theme || 'light',
              },
              steps: parsed.steps,
              step: parsed.step,
            });
            // Clear raw response BEFORE setting flag to prevent HTML leakage
            setStreamedResponse('');
            setIsPlanningClone(false);
          } else {
            setError('Could not parse plan from response');
            setStreamedResponse(''); // Clear before setting flag
            setIsPlanningClone(false);
          }
        } catch (parseErr) {
          console.error('Parse plan error:', parseErr);
          setError(`Failed to parse plan: ${parseErr instanceof Error ? parseErr.message : 'Unknown error'}`);
          setStreamedResponse(''); // Clear before setting flag
          setIsPlanningClone(false);
        }
      },
      onError: (err) => {
        hasError = true; // Mark that an error occurred
        setStreamedResponse(''); // Clear on error to prevent HTML leakage
        setIsPlanningClone(false);
        const errorMessage = err.message || 'Failed to connect to AI service. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('[AICopilot] Clone plan error:', err);
      },
    });
  };

  // UNIFIED: Execute approved clone plan by using Generate flow
  // This stores the branding and content, then calls Generate to build the funnel
  const executeApprovedPlan = async (plan: ClonePlan) => {
    // Handle styling-only mode - apply branding without generating new content
    if (plan.action === 'apply-styling') {
      setIsProcessing(true);
      
      try {
        // Apply branding to existing funnel without changing content
        const applyBrandingToExistingSteps = (steps: FunnelStep[]): FunnelStep[] => {
          return steps.map(step => ({
            ...step,
            settings: {
              ...step.settings,
              backgroundColor: plan.branding.backgroundColor,
            },
            blocks: step.blocks.map(block => {
              const newBlock = { ...block };
              const content = { ...block.content } as any;
              
              // Apply text colors to heading/text blocks
              if (block.type === 'heading' || block.type === 'text' || block.type === 'list') {
                const colorToUse = block.type === 'heading' 
                  ? (plan.branding.headingColor || plan.branding.textColor)
                  : plan.branding.textColor;
                
                if (!content.styles) {
                  content.styles = {};
                }
                content.styles.color = colorToUse;
              }
              
              // Apply button colors
              if (block.type === 'button') {
                content.backgroundColor = plan.branding.primaryColor;
                content.color = getContrastColor(plan.branding.primaryColor);
              }
              
              // Apply text colors to forms and email captures
              if (block.type === 'email-capture' || block.type === 'form') {
                content.textColor = plan.branding.textColor;
              }
              
              // Apply colors to social proof
              if (block.type === 'social-proof') {
                content.valueColor = plan.branding.headingColor || plan.branding.textColor;
                content.labelColor = plan.branding.textColor;
              }
              
              // Apply colors to accordion blocks (FAQ)
              if (block.type === 'accordion') {
                content.titleColor = plan.branding.headingColor || plan.branding.textColor;
                content.contentColor = plan.branding.textColor;
              }
              
              // Apply colors to reviews
              if (block.type === 'reviews') {
                content.textColor = plan.branding.textColor;
              }
              
              // Apply colors to countdown
              if (block.type === 'countdown') {
                content.textColor = plan.branding.headingColor || plan.branding.textColor;
              }
              
              // Apply colors to webinar
              if (block.type === 'webinar') {
                content.titleColor = plan.branding.headingColor || plan.branding.textColor;
              }
              
              // Apply colors to list blocks (ensure textColor is set)
              if (block.type === 'list') {
                content.textColor = plan.branding.textColor;
              }
              
              newBlock.content = content;
              return newBlock;
            }),
          }));
        };
        
        const styledSteps = applyBrandingToExistingSteps(funnel.steps);
        
        setFunnel({ ...funnel, steps: styledSteps });
        toast.success('Branding applied to existing funnel!');
        
        // Clear all clone state
        setClonePlan(null);
        setCloneUrl('');
        setCloneInstructions('');
        setStreamedResponse('');
        setIsProcessing(false);
        setIsGeneratingFromReference(false);
        setReferenceContext(null);
        
        return;
      } catch (err) {
        console.error('[AICopilot] Apply styling error:', err);
        toast.error('Failed to apply styling');
        setIsProcessing(false);
        return;
      }
    }
    
    // Store the plan's branding - this will be used by Generate via buildContext
    setClonedBranding(plan.branding);
    
    // Build a detailed prompt from the plan's content + user instructions
    const generatePrompt = buildPromptFromPlan(plan, cloneInstructions);
    
    // Set the generate location based on plan action
    setGenerateLocation(plan.action === 'replace-funnel' ? 'replace' : 'add');
    
    // Store reference context for UI display during generation
    setReferenceContext({
      sourceUrl: cloneUrl,
      instructions: cloneInstructions,
      action: plan.action,
    });
    setIsGeneratingFromReference(true);
    
    // Clear error but KEEP the plan visible during generation
    setError(null);
    setStreamedResponse('');
    
    // Switch to Generate tab to show generation progress
    setMode('generate');
    
    // Now trigger the generate flow with the extracted content
    setIsProcessing(true);
    
    // Build context with the newly set branding
    const context = {
      ...buildContext(),
      branding: plan.branding, // Explicitly include plan branding
    };
    
    let fullResponse = '';
    
    await streamGenerateFunnel(generatePrompt, context, {
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
            toast.error('No response received from AI');
            return;
          }
          
          // Log response for debugging
          console.log('[AICopilot] Generate response length:', responseText.length);
          console.log('[AICopilot] Generate response preview:', responseText.slice(0, 200));
          
          let parsed;
          try {
            parsed = parseGeneratedFunnel(responseText);
          } catch (parseErr) {
            console.error('[AICopilot] Parse error:', parseErr);
            console.error('[AICopilot] Response preview:', responseText.slice(0, 500));
            setError(`Failed to parse response: ${parseErr instanceof Error ? parseErr.message : 'Unknown error'}`);
            toast.error('Failed to parse AI response');
            return;
          }
          
          if (!parsed.steps || parsed.steps.length === 0) {
            setError('No steps generated - AI response may be incomplete');
            toast.error('No steps were generated');
            return;
          }
          
          console.log('[AICopilot] Parsed', parsed.steps.length, 'steps');
          
          // Apply the plan branding to all generated steps
          const applyBrandingToGeneratedSteps = (steps: FunnelStep[]): FunnelStep[] => {
            return steps.map(step => ({
              ...step,
              settings: {
                ...step.settings,
                backgroundColor: plan.branding.backgroundColor,
              },
              blocks: step.blocks.map(block => {
                const newBlock = { ...block };
                const content = { ...block.content } as any;
                
                // Apply text colors to heading/text blocks - ALWAYS apply branding color to ensure consistency
                if (block.type === 'heading' || block.type === 'text' || block.type === 'list') {
                  const colorToUse = block.type === 'heading' 
                    ? (plan.branding.headingColor || plan.branding.textColor)
                    : plan.branding.textColor;
                  
                  // ALWAYS apply branding color to ensure consistency
                  content.styles = {
                    ...content.styles,
                    color: colorToUse,
                  };
                }
                
                // Apply button colors - ALWAYS apply branding
                if (block.type === 'button') {
                  content.backgroundColor = plan.branding.primaryColor;
                  content.color = getContrastColor(plan.branding.primaryColor);
                }
                
                // Apply text colors to forms and email captures - ALWAYS apply branding
                if (block.type === 'email-capture' || block.type === 'form') {
                  content.textColor = plan.branding.textColor;
                }
                
                // Apply colors to social proof - ALWAYS apply branding
                if (block.type === 'social-proof') {
                  content.valueColor = plan.branding.headingColor || plan.branding.textColor;
                  content.labelColor = plan.branding.textColor;
                }
                
                // Apply colors to accordion blocks (FAQ) - ALWAYS apply branding
                if (block.type === 'accordion') {
                  content.titleColor = plan.branding.headingColor || plan.branding.textColor;
                  content.contentColor = plan.branding.textColor;
                }
                
                // Apply colors to reviews - ALWAYS apply branding
                if (block.type === 'reviews') {
                  content.textColor = plan.branding.textColor;
                }
                
                // Apply colors to countdown - ALWAYS apply branding
                if (block.type === 'countdown') {
                  content.textColor = plan.branding.headingColor || plan.branding.textColor;
                }
                
                // Apply colors to webinar - ALWAYS apply branding
                if (block.type === 'webinar') {
                  content.titleColor = plan.branding.headingColor || plan.branding.textColor;
                }
                
                // Apply colors to list blocks - ALWAYS apply branding
                if (block.type === 'list') {
                  content.textColor = plan.branding.textColor;
                }
                
                newBlock.content = content;
                return newBlock;
              }),
            }));
          };
          
          const brandedSteps = applyBrandingToGeneratedSteps(parsed.steps);
          
          // Calculate totals for preview
          const totalBlocks = brandedSteps.reduce((sum, step) => sum + step.blocks.length, 0);
          
          // Store pending steps and show confirmation UI instead of immediately applying
          setPendingSteps(brandedSteps);
          setGeneratedPreview({
            stepCount: brandedSteps.length,
            blockCount: totalBlocks,
          });
          setGenerationComplete(true);
          setIsGeneratingFromReference(false);
          
          // Clear clone UI but keep plan visible until accepted
          setStreamedResponse('');
        } catch (err) {
          console.error('[AICopilot] Generate from plan error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to generate from reference';
          setError(errorMessage);
          toast.error('Generation failed');
          setIsGeneratingFromReference(false);
          setReferenceContext(null);
          setGenerationComplete(false);
          setGeneratedPreview(null);
          setPendingSteps(null);
        }
      },
      onError: (err) => {
        setIsProcessing(false);
        setError(err.message);
        toast.error(err.message);
        setIsGeneratingFromReference(false);
        setReferenceContext(null);
        setGenerationComplete(false);
        setGeneratedPreview(null);
        setPendingSteps(null);
      },
    });
  };

  // Accept generation and apply changes
  const acceptGeneration = async () => {
    if (!pendingSteps || !generatedPreview) return;
    
    try {
      if (referenceContext?.action === 'replace-funnel') {
        // Replace entire funnel
        console.log('[AICopilot] Accepting: Replacing funnel with', pendingSteps.length, 'steps');
        
        setFunnel({
          ...funnel,
          steps: pendingSteps,
        });
        
        toast.success(`Funnel saved with ${generatedPreview.stepCount} steps and ${generatedPreview.blockCount} blocks!`);
      } else {
        // Replace current step only (use first generated step)
        if (pendingSteps.length > 0 && currentStepId) {
          console.log('[AICopilot] Accepting: Replacing step', currentStepId, 'with', pendingSteps[0].blocks.length, 'blocks');
          
          updateStep(currentStepId, {
            ...pendingSteps[0],
            id: currentStepId, // Keep the original step ID
          });
          
          toast.success(`Step saved with ${pendingSteps[0].blocks.length} blocks!`);
        } else {
          toast.error('No step selected');
          return;
        }
      }
      
      // Clear all state after successful acceptance
      setClonePlan(null);
      setCloneUrl('');
      setCloneInstructions('');
      setStreamedResponse('');
      setPrompt('');
      setIsGeneratingFromReference(false);
      setReferenceContext(null);
      setGenerationComplete(false);
      setGeneratedPreview(null);
      setPendingSteps(null);
    } catch (err) {
      console.error('[AICopilot] Accept generation error:', err);
      toast.error('Failed to apply changes');
    }
  };

  // Discard generation
  const discardGeneration = () => {
    setGenerationComplete(false);
    setGeneratedPreview(null);
    setPendingSteps(null);
    setClonePlan(null);
    setCloneUrl('');
    setCloneInstructions('');
    setStreamedResponse('');
    setIsGeneratingFromReference(false);
    setReferenceContext(null);
    toast.info('Generation discarded');
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
              
              // Merge content, preserving styles.textAlign from defaultContent if b.content.styles doesn't have it
              const defaultContent = definition.defaultContent as any;
              const bContent = b.content || {};
              const mergedContent = {
                ...defaultContent,
                ...bContent,
                // Merge styles objects properly to preserve textAlign from defaults
                styles: {
                  ...(defaultContent.styles || {}),
                  ...(bContent.styles || {}),
                },
              };
              
              const mergedStyles = {
                ...definition.defaultStyles,
                ...b.styles,
                // Ensure ALL blocks default to center alignment if not explicitly set
                ...((!b.styles?.textAlign && 
                    !mergedContent.styles?.textAlign) 
                      ? { textAlign: 'center' as const }
                      : {}),
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
    // Disable submit while planning (analyzing page)
    if (isPlanningClone) return false;
    
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
      <ScrollArea className="flex-1" style={{ minWidth: 0, overflowX: 'hidden' }}>
        <div className="px-6 py-6 space-y-6" style={{ minWidth: 0, maxWidth: '100%' }}>
          {/* Context-Aware Headers */}
          {mode === 'copy' && selectedBlock && (
            <div className="text-xs text-muted-foreground pb-2 border-b border-border/50">
              Editing <span className="font-medium text-foreground capitalize">{selectedBlock.type}</span> block
            </div>
          )}
          
          {mode === 'clone' && cloneUrl && !showCloneConfirm && !clonePlan && (
            <div className="text-xs text-muted-foreground pb-2 border-b border-border/50">
              Cloning from <span className="font-medium text-foreground break-all" style={{ wordBreak: 'break-all' }}>{(() => {
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
          
          {mode === 'generate' && isGeneratingFromReference && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div>
                  <div className="font-medium text-sm">Generating from reference...</div>
                  {referenceContext && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Source: {referenceContext.sourceUrl}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Welcome Presets - show when no content generated yet */}
          {!streamedResponse && !isProcessing && !error && !generationComplete && !isPlanningClone && !clonePlan && !isGeneratingFromReference && (
            <div className="space-y-4">
              {/* Welcome Header */}
              <div className="text-center py-4">
                <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                  {mode === 'copy' ? (
                    <Wand2 className="h-8 w-8 text-primary" />
                  ) : mode === 'help' ? (
                    <MessageSquare className="h-8 w-8 text-primary" />
                  ) : mode === 'clone' ? (
                    <Copy className="h-8 w-8 text-primary" />
                  ) : (
                    <Wrench className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  {mode === 'copy' 
                    ? "What copy do you need?" 
                    : mode === 'help'
                    ? "How can I help?"
                    : mode === 'clone'
                    ? "Clone any website"
                    : "What would you like to build?"
                  }
                </h2>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                  {mode === 'copy'
                    ? "Select a block and describe the copy you want, or try a preset below."
                    : mode === 'help'
                    ? "Ask me anything about building high-converting funnels."
                    : mode === 'clone'
                    ? "Paste a URL and I'll clone the design, branding, and content."
                    : "Describe your funnel in plain language and I'll build it for you."
                  }
                </p>
              </div>

              {/* TRY ASKING section */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider px-1">
                  Try asking
                </p>
                {(mode === 'copy' ? COPY_PRESETS : mode === 'help' ? HELP_PRESETS : mode === 'clone' ? CLONE_PRESETS : GENERATE_PRESETS).map((preset, idx) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (mode === 'clone') {
                          setCloneUrl(preset.prompt);
                        } else {
                          setPrompt(preset.prompt);
                          // Auto-submit for non-clone modes if not in copy mode without a block
                          if (mode !== 'copy' || selectedBlockId) {
                            setTimeout(() => {
                              if (mode === 'copy') handleGenerateCopy();
                              else if (mode === 'help') handleAskQuestion();
                              else if (mode === 'generate') handleGenerateFunnel();
                            }, 100);
                          }
                        }
                      }}
                      disabled={isProcessing || (mode === 'copy' && !selectedBlockId)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/30 transition-all text-left group",
                        (isProcessing || (mode === 'copy' && !selectedBlockId)) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors flex-1">
                        {preset.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                  );
                })}
              </div>

              {/* Copy mode hint */}
              {mode === 'copy' && !selectedBlockId && (
                <p className="text-xs text-muted-foreground/60 text-center pt-2">
                  Select a block on the canvas to get started
                </p>
              )}
            </div>
          )}

          {clonedBranding && mode === 'generate' && !isGeneratingFromReference && (
            <div className="p-4 rounded-md bg-muted/30 border border-border/50 text-sm">
              <div className="font-medium mb-2">Using branding:</div>
              <div className="text-muted-foreground break-words">
                {clonedBranding.primaryColor} • {clonedBranding.theme} theme
              </div>
            </div>
          )}

          {/* Generation Complete - Accept Confirmation (in Generate tab) */}
          {mode === 'generate' && generationComplete && generatedPreview && (
            <div className="space-y-4">
              {/* Show clone plan summary if available */}
              {clonePlan && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Reference Summary:</div>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {clonePlan.summary}
                  </div>
                </div>
              )}
              
              {/* Generation Complete Card */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Generation Complete!</span>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Created <span className="font-medium text-foreground">{generatedPreview.stepCount}</span> {generatedPreview.stepCount === 1 ? 'step' : 'steps'} with <span className="font-medium text-foreground">{generatedPreview.blockCount}</span> {generatedPreview.blockCount === 1 ? 'block' : 'blocks'}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={acceptGeneration}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept & Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={discardGeneration}
                  >
                    Discard
                  </Button>
                </div>
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
                  onClick={() => generateClonePlan('apply-styling')}
                  className="w-full px-4 py-2.5 text-left text-sm rounded-md bg-background border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium">Apply styling only</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Keep your content, just apply the branding colors and theme
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
            <div className="relative p-5 rounded-lg bg-muted/30 border border-border/50 space-y-5" style={{ minWidth: 0, maxWidth: '100%' }}>
              {/* Generation Progress Overlay */}
              {isProcessing && isGeneratingFromReference && (
                <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10 p-6">
                  <div className="flex flex-col items-center gap-4 max-w-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <div className="text-center space-y-2">
                      <div className="font-medium text-sm">Generating from reference...</div>
                      {referenceContext && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="truncate max-w-full">
                            <span className="font-medium">Source:</span> {referenceContext.sourceUrl}
                          </div>
                          {referenceContext.instructions && (
                            <div className="text-muted-foreground/80">
                              <span className="font-medium">Instructions:</span> {referenceContext.instructions}
                            </div>
                          )}
                          <div className="text-muted-foreground/80">
                            <span className="font-medium">Action:</span> {
                              referenceContext.action === 'replace-funnel' 
                                ? 'Replace entire funnel' 
                                : referenceContext.action === 'replace-step'
                                ? 'Replace current step'
                                : 'Apply styling only'
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* What was detected */}
              {clonePlan.detected && (
                <div className="pb-3 border-b border-border/50">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Detected:</div>
                  <div className="text-sm font-medium">{clonePlan.detected.topic}</div>
                  <div className="text-xs text-muted-foreground">{clonePlan.detected.style}</div>
                  {clonePlan.detected.keyElements && clonePlan.detected.keyElements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {clonePlan.detected.keyElements.slice(0, 4).map((el, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                          {el}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Summary */}
              <div className="space-y-3">
                <div className="text-base font-medium">Here's what I'll build:</div>
                <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word' }}>
                  {clonePlan.summary}
                </div>
              </div>
              
              {/* Branding Preview - Visual with all colors */}
              <div className="p-3 rounded-lg border border-border/50" style={{ backgroundColor: clonePlan.branding.backgroundColor }}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div 
                      className="w-6 h-6 rounded-full border border-white/20 shadow-sm" 
                      style={{ backgroundColor: clonePlan.branding.backgroundColor }}
                      title="Background"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border border-white/20 shadow-sm" 
                      style={{ backgroundColor: clonePlan.branding.primaryColor }}
                      title="Primary/Accent"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border border-white/20 shadow-sm" 
                      style={{ backgroundColor: clonePlan.branding.textColor }}
                      title="Text Color"
                    />
                  </div>
                  <div className="flex-1">
                    <span 
                      className="text-xs font-medium capitalize"
                      style={{ color: clonePlan.branding.textColor }}
                    >
                      {clonePlan.branding.theme} theme
                    </span>
                    <div 
                      className="text-xs opacity-70"
                      style={{ color: clonePlan.branding.textColor }}
                    >
                      Text will be readable
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expandable Details - Shows actual block content - OPEN BY DEFAULT */}
              {(clonePlan.steps || clonePlan.step) && (
                <Accordion type="single" collapsible defaultValue="details" className="w-full">
                  <AccordionItem value="details" className="border-none">
                    <AccordionTrigger className="text-xs py-2 hover:no-underline font-medium">
                      Detailed Content Breakdown
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-4">
                      {clonePlan.steps?.map((step, i) => (
                        <div key={i} className="p-4 rounded-lg bg-background/50 border border-border/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <div className="font-medium text-sm">{step.name}</div>
                          </div>
                          {step.description && (
                            <div className="text-sm text-muted-foreground mb-3">
                              {step.description}
                            </div>
                          )}
                          {/* Block previews with actual content - FULL descriptions */}
                          {step.blocks && step.blocks.length > 0 ? (
                            <div className="space-y-3">
                              {step.blocks.map((block, j) => (
                                <div key={j} className="flex items-start gap-3 text-sm bg-muted/30 p-3 rounded border border-border/20">
                                  <span className="text-muted-foreground font-mono bg-muted/70 px-2 py-1 rounded text-xs shrink-0">
                                    {block.type}
                                  </span>
                                  <span className="text-foreground/90 break-words leading-relaxed">
                                    "{block.preview}"
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : step.blockTypes && step.blockTypes.length > 0 ? (
                            <div className="text-sm text-muted-foreground">
                              {step.blockCount || step.blockTypes.length} blocks: {step.blockTypes.join(', ')}
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {clonePlan.step && (
                        <div className="p-4 rounded-lg bg-background/50 border border-border/30" style={{ minWidth: 0, maxWidth: '100%' }}>
                          <div className="font-medium text-sm mb-2">{clonePlan.step.name}</div>
                          {clonePlan.step.description && (
                            <div className="text-sm text-muted-foreground mb-3">
                              {clonePlan.step.description}
                            </div>
                          )}
                          {/* Block previews with actual content - FULL descriptions */}
                          {clonePlan.step.blocks && clonePlan.step.blocks.length > 0 ? (
                            <div className="space-y-3">
                              {clonePlan.step.blocks.map((block, j) => (
                                <div key={j} className="flex items-start gap-3 text-sm bg-muted/30 p-3 rounded border border-border/20" style={{ minWidth: 0, maxWidth: '100%' }}>
                                  <span className="text-muted-foreground font-mono bg-muted/70 px-2 py-1 rounded text-xs shrink-0">
                                    {block.type}
                                  </span>
                                  <span className="text-foreground/90 break-words leading-relaxed flex-1" style={{ wordBreak: 'break-word', minWidth: 0 }}>
                                    "{block.preview}"
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : clonePlan.step.blockTypes && clonePlan.step.blockTypes.length > 0 ? (
                            <div className="text-sm text-muted-foreground break-words" style={{ wordBreak: 'break-word' }}>
                              {clonePlan.step.blockCount || clonePlan.step.blockTypes.length} blocks: {clonePlan.step.blockTypes.join(', ')}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              
              {/* User Instructions Input */}
              {!generationComplete && (
                <div className="pt-3 border-t border-border/50">
                  <div className="text-xs font-medium text-foreground/70 mb-2">
                    Add instructions (optional):
                  </div>
                  <Textarea
                    value={cloneInstructions}
                    onChange={(e) => setCloneInstructions(e.target.value)}
                    placeholder="E.g., 'Focus on the benefits section', 'Remove testimonials', 'Add more CTAs', 'Make it more concise'..."
                    className="min-h-[80px] text-sm resize-none min-w-0"
                    style={{ maxWidth: '100%', boxSizing: 'border-box' }}
                    disabled={isProcessing}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Tell the AI what to include, exclude, or modify from the reference
                  </div>
                </div>
              )}
              
              {/* Action Buttons - Hide when generation complete */}
              {!generationComplete && (
                <div className="flex gap-2 pt-3">
                  <Button 
                    onClick={() => executeApprovedPlan(clonePlan)} 
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate from Reference'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setClonePlan(null);
                      setCloneUrl('');
                      setCloneInstructions('');
                      setStreamedResponse('');
                      setIsGeneratingFromReference(false);
                      setReferenceContext(null);
                      setGenerationComplete(false);
                      setGeneratedPreview(null);
                      setPendingSteps(null);
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Response Display - Hide during planning and when we have a clone plan (plan UI is cleaner) */}
          {streamedResponse && !isProcessing && !isPlanningClone && !clonePlan && (
            <div className="p-4 rounded-md bg-muted/30 border border-border/50">
              <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Response:</div>
              <ScrollArea className="max-h-[200px]">
                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed pr-4">
                  {streamedResponse.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                </div>
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
        <div className="flex items-end gap-2" style={{ minWidth: 0, maxWidth: '100%' }}>
          <Textarea
            value={getInputValue()}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={getPlaceholder()}
            className="resize-none flex-1 text-sm min-h-[44px] max-h-[120px] py-2.5 min-w-0"
            style={{ maxWidth: '100%', boxSizing: 'border-box' }}
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
