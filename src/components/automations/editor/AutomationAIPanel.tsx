import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Send, Loader2, Lightbulb, Wand2, 
  HelpCircle, ChevronRight, PanelLeftClose, Wrench, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { streamAICopilot } from "@/lib/ai/aiCopilotService";
import type { AutomationDefinition, AutomationStep, ActionType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

type PanelMode = 'build' | 'chat';

interface AutomationAIPanelProps {
  definition: AutomationDefinition;
  onDefinitionChange: (definition: AutomationDefinition) => void;
  onNameChange: (name: string) => void;
  onCollapse: () => void;
  isNew?: boolean;
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
  { icon: HelpCircle, label: "Explain this workflow", prompt: "Explain what this workflow does in simple terms" },
  { icon: Lightbulb, label: "What should I add next?", prompt: "What step should I add next to improve this workflow?" },
  { icon: Wand2, label: "Best practices for automations", prompt: "What are the best practices for automation workflows?" },
];

export function AutomationAIPanel({ 
  definition, 
  onDefinitionChange, 
  onNameChange,
  onCollapse,
  isNew = false 
}: AutomationAIPanelProps) {
  const [mode, setMode] = useState<PanelMode>('build');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Check if this is a workflow generation request
    const isGenerationRequest = isNew || 
      messageContent.toLowerCase().includes("create") ||
      messageContent.toLowerCase().includes("build") ||
      messageContent.toLowerCase().includes("send") ||
      messageContent.toLowerCase().includes("follow up") ||
      messageContent.toLowerCase().includes("alert") ||
      messageContent.toLowerCase().includes("notify") ||
      messageContent.toLowerCase().includes("add");

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
        await streamAICopilot(
          "generate",
          messageContent,
          {},
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
                    order: index,
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
                          content: `✨ Done! I've created your workflow:\n\n**${parsed.workflow.name || 'New Workflow'}**\n\nTrigger: ${parsed.workflow.trigger?.type?.replace(/_/g, ' ')}\nSteps: ${steps.length} action(s)\n\nYou can now customize each step by clicking on it.`,
                          isGenerating: false,
                        }
                      : m
                  ));
                }
              } catch {
                // If parsing fails, just show the raw response
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, isGenerating: false }
                    : m
                ));
              }
            },
            onError: (error) => {
              setIsLoading(false);
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: `Sorry, I encountered an error: ${error}`, isGenerating: false }
                  : m
              ));
            },
          },
          "workflow"
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
      // Regular helper response (mock for now)
      setTimeout(() => {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: generateMockResponse(messageContent, definition),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 800);
    }
  }, [isLoading, isNew, definition, onDefinitionChange, onNameChange]);

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // Get prompts based on mode
  const prompts = mode === 'build' ? BUILD_PROMPTS : CHAT_PROMPTS;

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-white/50">
              {mode === 'build' ? 'Build with AI' : 'Ask questions'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Mode Toggle */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          <button
            onClick={() => { setMode('build'); setMessages([]); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
              mode === 'build' 
                ? "bg-primary text-white shadow-sm" 
                : "text-white/50 hover:text-white/70"
            )}
          >
            <Wrench className="h-4 w-4" />
            Build
          </button>
          <button
            onClick={() => { setMode('chat'); setMessages([]); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
              mode === 'chat' 
                ? "bg-primary text-white shadow-sm" 
                : "text-white/50 hover:text-white/70"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
              <h2 className="text-lg font-semibold text-white mb-2">
                {mode === 'build' 
                  ? (isNew ? "What would you like to automate?" : "Modify your workflow")
                  : "Ask me anything"
                }
              </h2>
              <p className="text-sm text-white/50 max-w-[280px] mx-auto">
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
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider px-1">
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
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors flex-1">
                      {prompt.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-primary transition-colors" />
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
                    ? "bg-primary/20 ml-6" 
                    : "bg-white/5 mr-2"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">AI</span>
                    {message.isGenerating && (
                      <Loader2 className="h-3 w-3 animate-spin text-white/50 ml-auto" />
                    )}
                  </div>
                )}
                <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                  {message.content || (message.isGenerating ? "Thinking..." : "")}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-white/50 px-4 py-3"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Building your workflow...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="relative">
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
            className="min-h-[56px] max-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-12 resize-none rounded-xl focus:border-primary/50 focus:ring-primary/20"
          />
          <Button
            size="icon"
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-white/30 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// Mock response generator for non-generation requests
function generateMockResponse(prompt: string, definition: AutomationDefinition): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes("explain")) {
    const stepCount = definition.steps.length;
    return `This workflow starts when "${definition.trigger.type.replace(/_/g, " ")}" happens.\n\n${
      stepCount === 0 
        ? "Currently, no actions are configured. I'd recommend starting with a confirmation message to acknowledge the trigger event."
        : `It then executes ${stepCount} step(s). ${
            definition.steps.some(s => s.type === "send_message") 
              ? "The workflow includes messaging actions." 
              : "The workflow focuses on internal actions."
          }`
    }`;
  }
  
  if (lowerPrompt.includes("add next") || lowerPrompt.includes("should i add")) {
    if (definition.steps.length === 0) {
      return "I'd suggest adding a 'Send Message' step first. A quick SMS confirmation shows your leads you're responsive.";
    }
    return "Consider adding a 'Wait' step before any follow-up, then another message or a conditional check.";
  }
  
  if (lowerPrompt.includes("optimize") || lowerPrompt.includes("conversion")) {
    return "To optimize:\n\n1. Add a message within 5 minutes of trigger\n2. Include clear call-to-actions\n3. Add follow-up sequence with 24-48h delays\n4. Use conditions to personalize\n5. Notify team for high-value triggers";
  }
  
  return "I can help you build effective workflows. Try asking:\n\n• 'What should I add next?'\n• 'Explain this workflow'\n• 'How do I add a reminder?'";
}
