import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Loader2, Lightbulb, Wand2, 
  HelpCircle, ChevronRight, ChevronUp, Wrench, MessageCircle, X, Settings, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { streamWorkflowGeneration, streamWorkflowHelp, streamWorkflowOptimization, streamWorkflowExplain, type AutomationContext } from "@/lib/ai/automationAIService";
import type { AutomationDefinition, AutomationStep, ActionType, TriggerType } from "@/lib/automations/types";
import { TRIGGER_META, ACTION_META } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

type PanelMode = 'build' | 'chat';

interface AutomationAIPanelProps {
  definition: AutomationDefinition;
  onDefinitionChange: (definition: AutomationDefinition) => void;
  onNameChange: (name: string) => void;
  onCollapse: () => void;
  isNew?: boolean;
  teamId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
}

const BUILD_PROMPTS = [
  { icon: Wand2, label: "Send a welcome SMS to new leads", prompt: "Send a welcome SMS to new leads" },
  { icon: Lightbulb, label: "Follow up after missed appointments", prompt: "Follow up after missed appointments with an SMS reminder" },
  { icon: HelpCircle, label: "Alert my team when a deal closes", prompt: "Alert my team when a deal closes" },
];

const CHAT_PROMPTS = [
  { 
    icon: HelpCircle, 
    label: "Explain this workflow", 
    prompt: "Explain what this workflow does and why each step matters",
    intent: 'explain' as const
  },
  { 
    icon: Lightbulb, 
    label: "Optimize this workflow", 
    prompt: "Analyze this workflow and suggest improvements for better performance",
    intent: 'optimize' as const
  },
  { 
    icon: Wand2, 
    label: "What should I add next?", 
    prompt: "Based on this workflow, what's the best next step to add?",
    intent: 'help' as const
  },
];

export function AutomationAIPanel({ 
  definition, 
  onDefinitionChange, 
  onNameChange,
  onCollapse,
  isNew = false,
  teamId
}: AutomationAIPanelProps) {
  const [mode, setMode] = useState<PanelMode>('build');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userGuidance, setUserGuidance] = useState<string>('');
  const [showGuidance, setShowGuidance] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Build rich workflow context for AI
  const buildWorkflowContext = useCallback((): AutomationContext => {
    const availableTriggers = Object.keys(TRIGGER_META) as TriggerType[];
    const availableActions = Object.keys(ACTION_META) as ActionType[];
    
    return {
      currentDefinition: definition,
      triggerType: definition.trigger.type,
      availableTriggers,
      availableActions,
      stepCount: definition.steps.length,
      hasConditionals: definition.steps.some(s => s.type === 'condition'),
      teamId,
      userGuidance: userGuidance.trim() || undefined,
    };
  }, [definition, teamId, userGuidance]);

  // Detect intent type from user message
  const detectIntentType = useCallback((message: string): 'generate' | 'help' | 'optimize' | 'explain' => {
    const lower = message.toLowerCase();
    
    // Generation keywords
    if (lower.match(/\b(create|build|make|generate|add|send|follow up|alert|notify)\b/)) {
      return 'generate';
    }
    
    // Optimization keywords
    if (lower.match(/\b(improve|optimize|better|enhance|fix|upgrade)\b/)) {
      return 'optimize';
    }
    
    // Explanation keywords
    if (lower.match(/\b(explain|what does|how does|why|understand|describe)\b/)) {
      return 'explain';
    }
    
    // Default to help
    return 'help';
  }, []);

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageContent.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Route based on mode: build mode generates workflows, chat mode provides help/explanations
    const isGenerationRequest = mode === 'build';

    if (isGenerationRequest) {
      // Generate workflow using AI
      let fullResponse = "";
      
      const assistantMessageId = `msg-${Date.now()}-assistant`;
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isGenerating: true,
      }]);

      try {
        const context = buildWorkflowContext();
        await streamWorkflowGeneration(
          messageContent,
          context,
          {
            onDelta: (delta) => {
              fullResponse += delta;
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: fullResponse }
                  : m
              ));
            },
            onDone: () => {
              setIsLoading(false);
              
              // Try to parse the workflow from the response
              try {
                const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
                const jsonStr = jsonMatch ? jsonMatch[1] : fullResponse;
                const parsed = JSON.parse(jsonStr.trim());
                
                if (parsed.workflow) {
                  const steps: AutomationStep[] = (parsed.workflow.steps || []).map((step: any, index: number) => ({
                    id: `step-${Date.now()}-${index}`,
                    order: index + 1,
                    type: step.type as ActionType,
                    config: step.config || {},
                  }));

                  onDefinitionChange({
                    ...definition,
                    trigger: parsed.workflow.trigger || definition.trigger,
                    steps,
                  });

                  if (parsed.workflow.name) {
                    onNameChange(parsed.workflow.name);
                  }

                  // Update message to show success
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId 
                      ? { 
                          ...m, 
                          content: `Done! I've created your workflow:\n\n**${parsed.workflow.name || 'New Workflow'}**\n\nTrigger: ${parsed.workflow.trigger?.type?.replace(/_/g, ' ')}\nSteps: ${steps.length} action(s)\n\nYou can now customize each step by clicking on it.`,
                          isGenerating: false,
                        }
                      : m
                  ));
                } else {
                  // If no workflow structure, show response as-is
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId 
                      ? { ...m, isGenerating: false }
                      : m
                  ));
                }
              } catch (parseError) {
                // If parsing fails, show response with helpful message
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { 
                        ...m, 
                        content: fullResponse || "I generated a response, but couldn't parse it as a workflow. Please try rephrasing your request.",
                        isGenerating: false 
                      }
                    : m
                ));
              }
            },
            onError: (error) => {
              console.error('[AutomationAIPanel] Generation error:', error);
              setIsLoading(false);
              const errorMessage = error instanceof Error ? error.message : String(error);
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: `Sorry, I encountered an error: ${errorMessage}`, isGenerating: false }
                  : m
              ));
            },
          }
        );
      } catch (error) {
        setIsLoading(false);
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, content: "Sorry, I encountered an error generating your workflow.", isGenerating: false }
            : m
        ));
      }
    } else {
      // Chat/help mode - use real AI
      const intent = detectIntentType(messageContent);
      const context = buildWorkflowContext();
      let fullResponse = "";
      
      const assistantMessageId = `msg-${Date.now()}-assistant`;
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isGenerating: true,
      }]);

      try {
        if (intent === 'optimize') {
          await streamWorkflowOptimization(context, {
            onDelta: (chunk) => {
              fullResponse += chunk;
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: fullResponse }
                  : m
              ));
            },
            onDone: () => {
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, isGenerating: false }
                  : m
              ));
              setIsLoading(false);
            },
            onError: (error) => {
              console.error("Chat error:", error);
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: "I encountered an error. Please try again.", isGenerating: false }
                  : m
              ));
              setIsLoading(false);
            }
          });
        } else if (intent === 'explain') {
          await streamWorkflowExplain(context, {
            onDelta: (chunk) => {
              fullResponse += chunk;
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: fullResponse }
                  : m
              ));
            },
            onDone: () => {
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, isGenerating: false }
                  : m
              ));
              setIsLoading(false);
            },
            onError: (error) => {
              console.error("Chat error:", error);
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: "I encountered an error. Please try again.", isGenerating: false }
                  : m
              ));
              setIsLoading(false);
            }
          });
        } else {
          await streamWorkflowHelp(messageContent, context, {
            onDelta: (chunk) => {
              fullResponse += chunk;
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: fullResponse }
                  : m
              ));
            },
            onDone: () => {
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, isGenerating: false }
                  : m
              ));
              setIsLoading(false);
            },
            onError: (error) => {
              console.error("Chat error:", error);
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: "I encountered an error. Please try again.", isGenerating: false }
                  : m
              ));
              setIsLoading(false);
            }
          });
        }
      } catch (error) {
        console.error("[AutomationAIPanel] Chat error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setIsLoading(false);
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, content: `Sorry, I encountered an error: ${errorMessage}`, isGenerating: false }
            : m
        ));
      }
    }
  }, [isLoading, isNew, definition, onDefinitionChange, onNameChange, buildWorkflowContext, detectIntentType, mode]);

  // Render markdown formatting (bold, italic, code)
  const renderMarkdown = (text: string): React.ReactNode => {
    if (!text) return null;
    
    // First strip HTML tags and normalize whitespace
    let cleanText = text.replace(/<[^>]*>/g, ' ').trim();
    
    // Convert markdown to HTML - process bold first, then italic
    let html = cleanText
      // Bold: **text** (process first to avoid conflicts with italic)
      .replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/__([^_]+?)__/g, '<strong class="font-semibold text-foreground">$1</strong>')
      // Italic: *text* (only single asterisks that aren't part of **)
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em class="italic text-foreground/90">$1</em>')
      // Code: `code`
      .replace(/`([^`]+?)`/g, '<code class="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono text-foreground">$1</code>')
      // Line breaks (preserve double newlines for paragraphs)
      .replace(/\n\n+/g, '</p><p class="mt-2">')
      .replace(/\n/g, '<br />');
    
    return <div className="prose prose-sm max-w-none [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
  };

  const handleQuickPrompt = (prompt: string, intent?: 'generate' | 'help' | 'optimize' | 'explain') => {
    // If intent is specified (from CHAT_PROMPTS), temporarily set mode
    if (intent === 'optimize' || intent === 'explain') {
      setMode('chat');
    }
    // Pass intent through by storing it temporarily or detecting from prompt
    handleSendMessage(prompt);
  };

  // Get prompts based on mode
  const prompts = mode === 'build' ? BUILD_PROMPTS : CHAT_PROMPTS;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Matches AICopilot */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <span className="text-base font-semibold text-foreground">Assistant</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuidance(!showGuidance)}
            className="p-1.5 hover:bg-muted/50 rounded transition-colors"
            title="AI Response Preferences"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={onCollapse}
            className="p-1.5 hover:bg-muted/50 rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* User Guidance Input */}
      {showGuidance && (
        <div className="px-6 py-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium text-foreground">
              AI Response Preferences
            </Label>
            <button
              onClick={() => setShowGuidance(false)}
              className="p-0.5 hover:bg-muted/50 rounded"
            >
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <Textarea
            value={userGuidance}
            onChange={(e) => setUserGuidance(e.target.value)}
            placeholder="e.g., 'Always focus on conversion optimization' or 'Keep responses under 100 words' or 'Use technical terminology'"
            className="text-xs min-h-[60px] resize-none bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            These preferences will guide how the AI responds to your questions.
          </p>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="text-center py-6">
                <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                  {mode === 'build' ? (
                    <Wrench className="h-8 w-8 text-primary" />
                  ) : (
                    <MessageCircle className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  {mode === 'build' 
                    ? (isNew ? "What would you like to automate?" : "Modify your workflow")
                    : "Ask me anything"
                  }
                </h2>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                  {mode === 'build'
                    ? (isNew 
                        ? "Describe your automation in plain language and I'll build it for you."
                        : "Ask me to add steps, change triggers, or optimize your workflow."
                      )
                    : "I can explain automations, suggest best practices, or answer questions about your workflow."
                  }
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider px-1">
                  Try asking
                </p>
                {prompts.map((prompt, idx) => {
                  const Icon = prompt.icon;
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/30 transition-all text-left group"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors flex-1">
                        {prompt.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === "user" 
                      ? "bg-primary/10 ml-6" 
                      : "bg-muted/30 border border-border/50 mr-2"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">AI</span>
                      {message.isGenerating && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
                      )}
                    </div>
                  )}
                  <div className="text-sm text-foreground/90 leading-relaxed">
                    {message.role === "assistant"
                      ? renderMarkdown(message.content || (message.isGenerating ? "Thinking..." : ""))
                      : <p className="whitespace-pre-wrap">{message.content}</p>
                    }
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground px-4 py-3"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Building your workflow...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area - Matches AICopilot bottom section */}
      <div className="border-t border-border/50 bg-background p-4">
        {/* Mode Selector Pills - Same pattern as AICopilot */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => { setMode('build'); setMessages([]); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              mode === 'build' 
                ? "bg-foreground text-background" 
                : "bg-muted/50 text-foreground/60 hover:bg-muted hover:text-foreground/80"
            )}
          >
            <Wrench className="w-3 h-3" />
            Build
          </button>
          <button
            onClick={() => { setMode('chat'); setMessages([]); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              mode === 'chat' 
                ? "bg-foreground text-background" 
                : "bg-muted/50 text-foreground/60 hover:bg-muted hover:text-foreground/80"
            )}
          >
            <MessageCircle className="w-3 h-3" />
            Chat
          </button>
        </div>

        {/* Chat Input */}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(input);
              }
            }}
            placeholder={mode === 'build' ? "Describe what you want to automate..." : "Ask a question..."}
            className="resize-none flex-1 text-sm min-h-[44px] max-h-[120px] py-2.5 min-w-0"
            rows={2}
          />
          <Button
            size="icon"
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-10 w-10"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

