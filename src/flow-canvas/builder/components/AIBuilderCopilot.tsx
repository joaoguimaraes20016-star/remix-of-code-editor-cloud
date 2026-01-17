import React, { useState, useEffect } from 'react';
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
  Check,
  X
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getSuggestions, streamAICopilot, PageContext } from '@/lib/ai/aiCopilotService';
import { parseAIBlockResponse, getBlockDescription, looksLikeJSON } from '@/lib/ai/parseAIBlockResponse';
import { Button } from '@/components/ui/button';

interface AIBuilderCopilotPanelProps extends AICopilotProps {
  isExpanded: boolean;
  onToggle: () => void;
  /** Callback to add a block to the canvas */
  onAddBlock?: (block: Block, position?: { stackId: string; index: number }, options?: { type?: 'block' | 'section' }) => void;
}

const suggestionIcons: Record<string, React.ReactNode> = {
  step: <Layout className="w-4 h-4" />,
  copy: <FileText className="w-4 h-4" />,
  layout: <Zap className="w-4 h-4" />,
  'next-action': <ArrowRight className="w-4 h-4" />,
};

// Build context from current page state
function buildPageContext(page: Page, selection: SelectionState): PageContext {
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
  };
}

export const AIBuilderCopilot: React.FC<AIBuilderCopilotPanelProps> = ({
  currentPage,
  selection,
  onApplySuggestion,
  onAddBlock,
  isExpanded,
  onToggle,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<AIsuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Parsed block ready to apply
  const [parsedBlock, setParsedBlock] = useState<Block | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Fetch suggestions when panel expands or context changes
  useEffect(() => {
    if (isExpanded && !isLoadingSuggestions && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [isExpanded]);

  // Try to parse block when streaming completes
  useEffect(() => {
    if (streamedResponse && !isProcessing && looksLikeJSON(streamedResponse)) {
      const block = parseAIBlockResponse(streamedResponse);
      if (block) {
        setParsedBlock(block);
        setParseError(null);
      } else {
        setParsedBlock(null);
        setParseError('Could not parse AI response into a valid block');
      }
    }
  }, [streamedResponse, isProcessing]);

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setError(null);
    
    try {
      const context = buildPageContext(currentPage, selection);
      const newSuggestions = await getSuggestions(context);
      
      // Map to expected format with unique IDs
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
      // Don't show toast for initial load failures - just show inline error
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    setStreamedResponse('');
    setError(null);
    setParsedBlock(null);
    setParseError(null);
    
    const context = buildPageContext(currentPage, selection);
    
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
          // Parsing happens in useEffect above
        },
        onError: (err) => {
          setIsProcessing(false);
          setError(err.message);
          toast.error(err.message);
        },
      }
    );
  };

  const handleApplyBlock = () => {
    if (!parsedBlock || !onAddBlock) return;
    
    onAddBlock(parsedBlock);
    toast.success(`Added "${parsedBlock.label}" to canvas`);
    
    // Clear state after applying
    setStreamedResponse('');
    setParsedBlock(null);
    setParseError(null);
    setPrompt('');
  };

  const handleDiscardResponse = () => {
    setStreamedResponse('');
    setParsedBlock(null);
    setParseError(null);
  };

  const handleApplySuggestion = async (suggestion: AIsuggestion) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // For now, directly apply the suggestion
      // In future, could call AI to expand the suggestion
      onApplySuggestion(suggestion);
      toast.success(`Applied: ${suggestion.title}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply suggestion';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn(
      'fixed bottom-6 left-6 w-72 bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 z-40',
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
          {/* Prompt Input */}
          <div className="p-3">
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask AI to help with your funnel..."
                className="builder-input resize-none pr-12 text-sm"
                rows={2}
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

          {/* Parsed Block Preview - Ready to Apply */}
          {parsedBlock && onAddBlock && (
            <div className="px-3 pb-3">
              <div className="p-3 rounded-lg bg-builder-success/10 border border-builder-success/30">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-builder-success shrink-0" />
                    <span className="text-xs font-medium text-builder-success">Block Ready</span>
                  </div>
                </div>
                <p className="text-xs text-builder-text-secondary mb-3">
                  {getBlockDescription(parsedBlock)}
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleApplyBlock}
                    className="flex-1 bg-builder-success hover:bg-builder-success/90 text-white"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Apply to Canvas
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDiscardResponse}
                    className="text-builder-text-muted hover:text-builder-text"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Parse Error - Show raw response with error */}
          {parseError && streamedResponse && !parsedBlock && (
            <div className="px-3 pb-3">
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs font-medium text-orange-500">{parseError}</span>
                </div>
                <div className="text-xs text-builder-text-muted whitespace-pre-wrap max-h-24 overflow-y-auto mb-2 font-mono bg-builder-bg p-2 rounded">
                  {streamedResponse}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleDiscardResponse}
                  className="w-full text-builder-text-muted"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Streaming Response (while processing) */}
          {isProcessing && streamedResponse && (
            <div className="px-3 pb-3">
              <div className="p-3 rounded-lg bg-builder-bg text-xs text-builder-text-secondary whitespace-pre-wrap max-h-32 overflow-y-auto font-mono">
                {streamedResponse}
                <span className="animate-pulse">▊</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !streamedResponse && (
            <div className="px-3 pb-3">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {!parsedBlock && !parseError && !isProcessing && (
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
                  {suggestions.map((suggestion) => (
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
                          <div className="text-xs text-builder-text-muted mt-0.5">
                            {suggestion.description}
                          </div>
                        </div>
                        <div className="text-xs text-builder-text-dim font-mono">
                          {Math.round(suggestion.confidence * 100)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !error ? (
                <div className="text-xs text-builder-text-muted text-center py-4">
                  No suggestions available
                </div>
              ) : null}
            </div>
          )}

          {/* Context indicator */}
          {selection.id && (
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
