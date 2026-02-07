import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Send, Loader2, Lightbulb, Wand2, 
  HelpCircle, ChevronRight, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AutomationDefinition } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface WorkflowAIHelperProps {
  definition: AutomationDefinition;
  onSuggestionApply?: (suggestion: string) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: HelpCircle, label: "Explain this workflow", prompt: "Explain what this workflow does in simple terms" },
  { icon: Lightbulb, label: "What should I add next?", prompt: "What step should I add next to improve this workflow?" },
  { icon: Wand2, label: "Optimize for conversions", prompt: "How can I optimize this workflow for better conversions?" },
];

export function WorkflowAIHelper({ definition, onSuggestionApply }: WorkflowAIHelperProps) {
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

  const handleSendMessage = async (messageContent: string) => {
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

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: generateMockResponse(messageContent, definition),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Workflow Assistant</h3>
          <p className="text-xs text-muted-foreground">Ask me anything about your workflow</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center py-4">
              I can help you build and optimize your automation workflow.
            </p>

            {/* Quick Prompts */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </p>
              {QUICK_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border hover:border-border/70 transition-all text-left"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground/80">{prompt.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-3 rounded-xl",
                  message.role === "user" 
                    ? "bg-primary/20 ml-8" 
                    : "bg-muted/30 mr-4"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary">Assistant</span>
                  </div>
                )}
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  {message.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-muted-foreground p-3"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-auto border-t border-border pt-4">
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
            placeholder="Ask about your workflow..."
            className="min-h-[60px] max-h-[120px] bg-background border-border text-foreground placeholder:text-muted-foreground pr-12 resize-none"
          />
          <Button
            size="sm"
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2 text-center">
          Press Enter to send
        </p>
      </div>
    </div>
  );
}

// Mock response generator (replace with actual AI integration)
function generateMockResponse(prompt: string, definition: AutomationDefinition): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes("explain")) {
    const stepCount = definition.steps.length;
    return `This workflow starts when "${definition.trigger.type.replace(/_/g, " ")}" happens.\n\n${
      stepCount === 0 
        ? "Currently, no actions are configured. I'd recommend starting with a confirmation message to acknowledge the trigger event."
        : `It then executes ${stepCount} step(s) to process the event. The workflow ${
            definition.steps.some(s => s.type === "send_message") 
              ? "includes messaging" 
              : "focuses on internal actions"
          }.`
    }`;
  }
  
  if (lowerPrompt.includes("add next") || lowerPrompt.includes("should i add")) {
    if (definition.steps.length === 0) {
      return "I'd suggest adding a 'Send Message' step first to acknowledge the trigger. A quick SMS confirmation shows your leads you're responsive and engaged.";
    }
    const lastStep = definition.steps[definition.steps.length - 1];
    if (lastStep.type === "send_message") {
      return "After sending a message, consider adding a 'Wait' step before any follow-up. This gives your lead time to respond and prevents overwhelming them.";
    }
    if (lastStep.type === "time_delay") {
      return "Now would be a great time to add another message or a conditional check. You could send a follow-up, or use 'If/Else' to branch based on their response.";
    }
    return "Consider adding a notification to your team or a task assignment to ensure follow-through on this workflow.";
  }
  
  if (lowerPrompt.includes("optimize") || lowerPrompt.includes("conversion")) {
    return "To optimize for conversions:\n\n1. Add a confirmation message within 5 minutes of the trigger\n2. Include a clear call-to-action in your messages\n3. Add a follow-up sequence with 24-48 hour delays\n4. Use conditions to personalize based on lead data\n5. Notify your team for high-value triggers";
  }
  
  return "I can help you build effective automation workflows. Try asking:\n\n• 'What should I add next?'\n• 'Explain this workflow'\n• 'How do I add a reminder?'\n• 'Optimize for better response rates'";
}
