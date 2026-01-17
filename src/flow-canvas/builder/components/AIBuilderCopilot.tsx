import React, { useState, useEffect, useRef } from 'react';
import { Page, SelectionState, AIsuggestion, AICopilotProps, Block } from '../../types/infostack';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Wand2, 
  MessageSquare, 
  ArrowRight, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  FileText,
  Layout,
  AlertCircle,
  RefreshCw,
  Link2,
  X,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getSuggestions, streamAICopilot, PageContext } from '@/lib/ai/aiCopilotService';
import { parseAIBlockResponse, looksLikeJSON, StylingContext } from '@/lib/ai/parseAIBlockResponse';
import { detectFunnelType, extractExistingBlockTypes, analyzePageContent } from '@/lib/ai/funnelTypeDetector';
import { extractContentSnapshot, analyzeContrastContext } from '@/lib/ai/contentSnapshotExtractor';
import { Button } from '@/components/ui/button';
import { GenerationMode } from '@/lib/ai/copilotTypes';
import { parseFunnelResponse } from '@/lib/ai/parseFunnelResponse';
import { supabase } from '@/integrations/supabase/client';

interface AIBuilderCopilotPanelProps extends AICopilotProps {
  isExpanded: boolean;
  onToggle: () => void;
  /** Callback to add a block to the canvas */
  onAddBlock?: (block: Block, position?: { stackId: string; index: number }, options?: { type?: 'block' | 'section'; createSectionIfNeeded?: boolean }) => void;
  /** Callback to remove a block (for undo) */
  onRemoveBlock?: (blockId: string) => void;
  /** Callback to update the entire page (for full funnel generation) */
  onUpdatePage?: (page: Page) => void;
}

const suggestionIcons: Record<string, React.ReactNode> = {
  step: <Layout className="w-4 h-4" />,
  copy: <FileText className="w-4 h-4" />,
  layout: <Zap className="w-4 h-4" />,
  'next-action': <ArrowRight className="w-4 h-4" />,
};

/**
 * Detect generation mode from user prompt
 */
function detectGenerationMode(prompt: string): GenerationMode {
  const lowerPrompt = prompt.toLowerCase();
  
  // Funnel keywords - user wants full funnel/page generation
  const funnelKeywords = [
    'funnel', 'vsl', 'webinar', 'opt-in', 'optin', 'opt in',
    'sales page', 'landing page', 'quiz funnel', 'booking page',
    'build me a', 'create a', 'make me a', 'generate a',
    'full page', 'entire page', 'whole page', 'complete funnel',
    'build a', 'design a', 'new page', 'new funnel',
  ];
  
  // Settings keywords - user wants to change page styling
  const settingsKeywords = [
    'background', 'theme', 'dark mode', 'light mode', 
    'colors', 'color scheme', 'brand', 'gradient', 'page styling',
    'make the page', 'change the background'
  ];
  
  if (funnelKeywords.some(kw => lowerPrompt.includes(kw))) return 'funnel';
  if (settingsKeywords.some(kw => lowerPrompt.includes(kw))) return 'settings';
  return 'block';
}

/**
 * Get friendly text for the thinking state based on mode
 */
function getThinkingText(mode: GenerationMode): { title: string; subtitle: string } {
  switch (mode) {
    case 'funnel':
      return { 
        title: 'Building your funnel...', 
        subtitle: 'Generating pages, sections, and content' 
      };
    case 'settings':
      return { 
        title: 'Updating styling...', 
        subtitle: 'Applying theme and colors' 
      };
    default:
      return { 
        title: 'Creating content...', 
        subtitle: 'Generating block for your page' 
      };
  }
}

/**
 * Build rich context from current page state for intelligent AI responses
 * 
 * Phase 14: Now includes actual content snapshot and contrast analysis
 * for true context awareness.
 */
function buildPageContext(page: Page, selection: SelectionState): PageContext {
  const funnelTypeResult = detectFunnelType(page);
  const contentAnalysis = analyzePageContent(page);
  const existingBlockTypes = extractExistingBlockTypes(page);
  
  // Phase 14: Extract actual content for true context
  const contentSnapshot = extractContentSnapshot(page);
  const contrastContext = analyzeContrastContext(page);
  
  const stylingContext = {
    theme: page.settings.theme || 'light',
    primaryColor: page.settings.primary_color,
    backgroundColor: page.settings.page_background?.color,
    backgroundType: page.settings.page_background?.type,
    fontFamily: page.settings.font_family,
  };
  
  return {
    pageName: page.name,
    stepIntents: page.steps.map(s => s.step_intent),
    currentStep: page.steps.find(s => 
      s.frames.some(f => 
        f.stacks.some(st => 
          st.blocks.some(b => b.id === selection.id)
        )
      )
    )?.step_intent,
    elementType: selection.type || undefined,
    funnelType: funnelTypeResult.type,
    funnelTypeConfidence: funnelTypeResult.confidence,
    styling: stylingContext,
    existingBlockTypes,
    ...contentAnalysis,
    // Phase 14: New content awareness fields
    contentSnapshot: {
      headlines: contentSnapshot.headlines,
      colorsUsed: contentSnapshot.colorsUsed,
      premiumElementsUsed: contentSnapshot.premiumElementsUsed,
      sectionCount: contentSnapshot.sectionCount,
      contentSummary: contentSnapshot.contentSummary,
    },
    contrast: {
      isDarkBackground: contrastContext.isDarkBackground,
      backgroundLuminance: contrastContext.backgroundLuminance,
      recommendedTextColor: contrastContext.recommendedTextColor,
    },
  };
}

/**
 * Extract styling context for the block parser
 */
function extractStylingContext(page: Page): StylingContext {
  return {
    theme: page.settings.theme || 'light',
    primaryColor: page.settings.primary_color,
    backgroundColor: page.settings.page_background?.color,
  };
}

/**
 * Check if page has at least one valid section to add blocks to
 */
function pageHasValidStack(page: Page, activeStepId?: string): boolean {
  const activeStep = page.steps.find(s => s.id === activeStepId) || page.steps[0];
  if (!activeStep) return false;
  
  return activeStep.frames?.some(f => f.stacks?.some(s => s.id)) || false;
}

export const AIBuilderCopilot: React.FC<AIBuilderCopilotPanelProps> = ({
  currentPage,
  selection,
  onApplySuggestion,
  onAddBlock,
  onRemoveBlock,
  onUpdatePage,
  isExpanded,
  onToggle,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [detectedMode, setDetectedMode] = useState<GenerationMode>('block');
  const [suggestions, setSuggestions] = useState<AIsuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Phase 14: URL style cloning state
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [cloneUrl, setCloneUrl] = useState('');
  const [isCloningStyle, setIsCloningStyle] = useState(false);
  
  // Track last added block for undo
  const lastAddedBlockRef = useRef<{ id: string; label: string } | null>(null);
  
  // Track detected mode for response handling
  const detectedModeRef = useRef<GenerationMode>('block');

  // Fetch suggestions when panel expands
  useEffect(() => {
    if (isExpanded && !isLoadingSuggestions && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [isExpanded]);

  // AUTO-APPLY: Parse and apply response when streaming completes
  useEffect(() => {
    if (!streamedResponse || isProcessing) return;
    
    const mode = detectedModeRef.current;
    
    // Check if it looks like a funnel response
    if (mode === 'funnel' && (streamedResponse.includes('"funnel"') || streamedResponse.includes('"steps"'))) {
      const result = parseFunnelResponse(streamedResponse, currentPage);
      
      if (result.success && result.page && onUpdatePage) {
        onUpdatePage(result.page);
        const stepCount = result.page.steps.length;
        toast.success(`Generated "${result.page.name}" with ${stepCount} page${stepCount > 1 ? 's' : ''}`);
        setStreamedResponse('');
        setPrompt('');
        setIsThinking(false);
        setParseError(null);
        return;
      } else if (result.error) {
        console.error('[AIBuilderCopilot] Funnel parse error:', result.error);
        setParseError(result.error);
        setIsThinking(false);
        return;
      }
    }
    
    // Check if it looks like a settings response
    if (mode === 'settings' && streamedResponse.includes('"pageSettings"')) {
      const result = parseFunnelResponse(streamedResponse, currentPage);
      
      if (result.success && result.page && onUpdatePage) {
        onUpdatePage(result.page);
        toast.success('Page styling updated');
        setStreamedResponse('');
        setPrompt('');
        setIsThinking(false);
        setParseError(null);
        return;
      }
    }
    
    // Fallback: try to parse as single block
    if (looksLikeJSON(streamedResponse)) {
      const stylingContext = extractStylingContext(currentPage);
      const block = parseAIBlockResponse(streamedResponse, stylingContext);
      
      if (block && onAddBlock) {
        // Auto-create section if needed
        onAddBlock(block, undefined, { createSectionIfNeeded: true });
        lastAddedBlockRef.current = { id: block.id, label: block.label };
        
        toast.success(`Added "${block.label}" to canvas`, {
          action: onRemoveBlock ? {
            label: 'Undo',
            onClick: () => {
              if (lastAddedBlockRef.current) {
                onRemoveBlock(lastAddedBlockRef.current.id);
                toast.info('Block removed');
              }
            },
          } : undefined,
          duration: 4000,
        });
        
        setStreamedResponse('');
        setParseError(null);
        setPrompt('');
        setIsThinking(false);
      } else if (streamedResponse && !block) {
        setParseError('Could not parse AI response');
        setIsThinking(false);
      }
    }
  }, [streamedResponse, isProcessing, currentPage, onAddBlock, onRemoveBlock, onUpdatePage]);

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setError(null);
    
    try {
      const context = buildPageContext(currentPage, selection);
      const newSuggestions = await getSuggestions(context);
      
      const mappedSuggestions: AIsuggestion[] = newSuggestions.map((s, i) => ({
        id: s.id || `suggestion-${i}`,
        type: s.type,
        title: s.title,
        description: s.description,
        confidence: s.confidence,
      }));
      
      setSuggestions(mappedSuggestions);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) return;
    
    // Detect generation mode from prompt
    const mode = detectGenerationMode(prompt);
    setDetectedMode(mode);
    detectedModeRef.current = mode;
    
    console.log('[AIBuilderCopilot] Detected mode:', mode, 'for prompt:', prompt);
    
    setIsProcessing(true);
    setIsThinking(true);
    setStreamedResponse('');
    setError(null);
    setParseError(null);
    
    // Build rich context
    const context = buildPageContext(currentPage, selection);
    
    console.log('[AIBuilderCopilot] Generating with context:', {
      mode,
      funnelType: context.funnelType,
      styling: context.styling,
      existingBlockTypes: context.existingBlockTypes,
    });
    
    await streamAICopilot(
      'generate',
      prompt,
      context,
      {
        onDelta: (chunk) => {
          setStreamedResponse(prev => prev + chunk);
        },
        onDone: () => {
          setIsProcessing(false);
          // Auto-apply happens in useEffect above
        },
        onError: (err) => {
          setIsProcessing(false);
          setIsThinking(false);
          setError(err.message);
          toast.error(err.message);
        },
      },
      mode  // Pass detected mode to service
    );
  };

  const handleDiscardResponse = () => {
    setStreamedResponse('');
    setParseError(null);
    setIsThinking(false);
  };

  const handleApplySuggestion = async (suggestion: AIsuggestion) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      onApplySuggestion(suggestion);
      toast.success(`Applied: ${suggestion.title}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply suggestion';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get funnel type for display
  const funnelType = detectFunnelType(currentPage);
  
  // Get thinking text
  const thinkingText = getThinkingText(detectedMode);

  // Phase 14 Enhanced: Handle full style + layout cloning from URL
  const handleCloneStyle = async () => {
    if (!cloneUrl.trim() || !cloneUrl.startsWith('http')) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsCloningStyle(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('clone-style', {
        body: { url: cloneUrl },
      });

      if (error) throw error;

      if (data?.success && data?.style && onUpdatePage) {
        const style = data.style;
        const sections = data.sections || [];
        
        // Import and use the section generator
        const { generateStacksFromSections } = await import('../utils/sectionGenerator');
        
        // Generate stacks (sections) from scraped sections
        const generatedStacks = sections.length > 0 
          ? generateStacksFromSections(sections, style)
          : [];
        
        // Create a new step with the generated stacks if we have sections
        let updatedSteps = currentPage.steps;
        
        if (generatedStacks.length > 0) {
          const newFrame = {
            id: `frame-${Date.now()}`,
            label: 'Cloned Page',
            stacks: generatedStacks,
            props: {},
          };
          
          updatedSteps = [{
            ...currentPage.steps[0],
            frames: [newFrame],
          }];
        } else {
          // Just apply colors to existing elements if no sections scraped
          updatedSteps = currentPage.steps.map(step => ({
            ...step,
            frames: step.frames?.map(frame => ({
              ...frame,
              stacks: frame.stacks?.map(stack => ({
                ...stack,
                blocks: stack.blocks?.map(block => ({
                  ...block,
                  elements: block.elements?.map(element => {
                    if (element.type === 'button') {
                      return {
                        ...element,
                        props: { ...element.props, backgroundColor: style.primaryColor },
                      };
                    }
                    if (element.type === 'heading') {
                      const textColor = style.theme === 'dark' ? '#ffffff' : '#111827';
                      return {
                        ...element,
                        props: { ...element.props, color: textColor },
                      };
                    }
                    if (element.type === 'gradient-text') {
                      return {
                        ...element,
                        props: { ...element.props, gradientFrom: style.primaryColor, gradientTo: style.accentColor },
                      };
                    }
                    if (element.type === 'text') {
                      const textColor = style.theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
                      return {
                        ...element,
                        props: { ...element.props, color: textColor },
                      };
                    }
                    return element;
                  }),
                })),
              })),
            })),
          }));
        }
        
        // Apply the cloned style to the page
        const updatedPage: Page = {
          ...currentPage,
          steps: updatedSteps,
          settings: {
            ...currentPage.settings,
            theme: style.theme,
            primary_color: style.primaryColor,
            font_family: style.bodyFont,
            page_background: {
              ...currentPage.settings.page_background,
              type: 'solid',
              color: style.backgroundColor,
            },
          },
        };

        onUpdatePage(updatedPage);
        
        const sectionCount = generatedBlocks.length;
        toast.success(`Cloned from ${new URL(cloneUrl).hostname}`, {
          description: sectionCount > 0 
            ? `Created ${sectionCount} sections with ${style.style} style`
            : `Applied ${style.style} design with ${style.theme} theme`,
        });
        setCloneUrl('');
        setShowUrlInput(false);
      }
    } catch (err) {
      console.error('[AIBuilderCopilot] Clone style error:', err);
      toast.error('Failed to clone from URL');
    } finally {
      setIsCloningStyle(false);
    }
  };

  return (
    <div className={cn(
      'fixed bottom-6 left-6 w-80 bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 z-40',
      isExpanded ? 'max-h-[500px]' : 'h-12'
    )}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-builder-surface hover:bg-builder-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg btn-gradient">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-builder-text">AI Copilot</span>
          {isProcessing && (
            <Loader2 className="w-4 h-4 text-builder-accent animate-spin" />
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-builder-text-muted" />
        ) : (
          <ChevronUp className="w-4 h-4 text-builder-text-muted" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-builder-border-subtle animate-in">
          {/* Phase 14: Enhanced Funnel Type Indicator with signals */}
          <div className="px-3 pt-3">
            <div className="text-xs text-builder-text-dim px-2 py-1.5 bg-builder-bg rounded-lg space-y-1">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  funnelType.confidence > 0.7 ? "bg-green-500" : 
                  funnelType.confidence > 0.4 ? "bg-amber-500 animate-pulse" : 
                  "bg-gray-400"
                )} />
                <span className="capitalize font-medium">{funnelType.type}</span>
                <span className="text-builder-text-muted">
                  {funnelType.confidence > 0.7 ? 'detected' : 
                   funnelType.confidence > 0.4 ? '(uncertain)' : 
                   '(default)'}
                </span>
              </div>
              {funnelType.signals.length > 0 && funnelType.confidence > 0.3 && (
                <div className="text-[10px] text-builder-text-muted pl-3">
                  Based on: {funnelType.signals.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Phase 14: Clone Style from URL */}
          <div className="px-3 pt-2">
            {!showUrlInput ? (
              <button
                onClick={() => setShowUrlInput(true)}
                className="flex items-center gap-2 text-xs text-builder-text-muted hover:text-builder-text transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                Clone style from URL
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="builder-input text-xs h-8 flex-1"
                  disabled={isCloningStyle}
                  onKeyDown={(e) => e.key === 'Enter' && handleCloneStyle()}
                />
                {isCloningStyle ? (
                  <Loader2 className="w-4 h-4 animate-spin text-builder-accent" />
                ) : (
                  <>
                    <Button size="sm" onClick={handleCloneStyle} className="h-8 px-2">
                      <Link2 className="w-3.5 h-3.5" />
                    </Button>
                    <button onClick={() => { setShowUrlInput(false); setCloneUrl(''); }}>
                      <X className="w-4 h-4 text-builder-text-muted" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Build me a VSL funnel for..."
                className="builder-input resize-none pr-12 text-sm"
                rows={2}
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitPrompt();
                  }
                }}
              />
              <button
                onClick={handleSubmitPrompt}
                disabled={!prompt.trim() || isProcessing}
                className={cn(
                  'absolute right-2 bottom-2 p-2 rounded-lg transition-all',
                  prompt.trim() && !isProcessing
                    ? 'bg-builder-accent text-white hover:brightness-110'
                    : 'bg-builder-surface-active text-builder-text-dim'
                )}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Thinking State - Friendly loading indicator instead of raw JSON */}
          {isThinking && !parseError && (
            <div className="px-3 pb-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-builder-accent/10 to-builder-accent/5 border border-builder-accent/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-builder-accent/20 rounded-full animate-ping" />
                    <div className="relative p-2 bg-builder-accent rounded-full">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-builder-text">
                      {thinkingText.title}
                    </div>
                    <div className="text-xs text-builder-text-muted mt-0.5">
                      {thinkingText.subtitle}
                    </div>
                  </div>
                </div>
                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mt-3">
                  <div className="w-2 h-2 rounded-full bg-builder-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-builder-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-builder-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Parse Error - Show error with discard option */}
          {parseError && !isProcessing && (
            <div className="px-3 pb-3">
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs font-medium text-orange-500">{parseError}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDiscardResponse}
                    className="flex-1 text-builder-text-muted"
                  >
                    Dismiss
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      handleDiscardResponse();
                      handleSubmitPrompt();
                    }}
                    className="flex-1"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !streamedResponse && !isThinking && (
            <div className="px-3 pb-3">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Suggestions - Only show when idle */}
          {!isThinking && !parseError && !isProcessing && (
            <div className="px-3 pb-3">
              <div className="text-xs text-builder-text-dim mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Suggestions
                </div>
                {!isLoadingSuggestions && (
                  <button
                    onClick={fetchSuggestions}
                    className="p-1 hover:bg-builder-surface-hover rounded transition-colors"
                    title="Refresh suggestions"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {isLoadingSuggestions ? (
                <div className="flex items-center justify-center py-6 text-builder-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleApplySuggestion(suggestion)}
                      disabled={isProcessing}
                      className={cn(
                        'w-full text-left p-3 rounded-xl bg-builder-surface border border-builder-border-subtle hover:border-builder-accent/40 hover:bg-builder-surface-hover transition-all group',
                        isProcessing && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-builder-surface-hover text-builder-accent group-hover:bg-builder-accent/10">
                          {suggestionIcons[suggestion.type] || <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-builder-text">
                            {suggestion.title}
                          </div>
                          <div className="text-xs text-builder-text-muted mt-0.5 line-clamp-2">
                            {suggestion.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !error ? (
                <div className="text-xs text-builder-text-muted text-center py-4">
                  Type a prompt to get started
                </div>
              ) : null}
            </div>
          )}

          {/* Context indicator */}
          {selection.id && !isThinking && (
            <div className="px-3 pb-3">
              <div className="text-xs text-builder-text-dim px-3 py-2 bg-builder-bg rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-builder-accent" />
                Context: <span className="text-builder-text-secondary capitalize">{selection.type}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
