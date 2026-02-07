import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Clock, GitBranch, ChevronDown, ChevronUp,
  Sparkles, LayoutTemplate, Plus, Tag, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionType, TriggerType, AutomationStep } from "@/lib/automations/types";
import { 
  getContextualSuggestions, 
  QUICK_ACTIONS,
  type SuggestedAction 
} from "@/lib/automations/workflowSuggestions";
import { cn } from "@/lib/utils";

interface SmartStartPanelProps {
  triggerType: TriggerType;
  steps: AutomationStep[];
  onAddStep: (type: ActionType) => void;
  onOpenTemplates: () => void;
  onAskAI: (prompt: string) => void;
}

const ACTION_ICONS: Partial<Record<ActionType, React.ReactNode>> = {
  send_message: <MessageSquare className="h-4 w-4" />,
  time_delay: <Clock className="h-4 w-4" />,
  condition: <GitBranch className="h-4 w-4" />,
  add_tag: <Tag className="h-4 w-4" />,
  notify_team: <Bell className="h-4 w-4" />,
};

export function SmartStartPanel({
  triggerType,
  steps,
  onAddStep,
  onOpenTemplates,
  onAskAI,
}: SmartStartPanelProps) {
  const [showAllActions, setShowAllActions] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const suggestions = getContextualSuggestions(triggerType, steps);
  const topSuggestions = suggestions.slice(0, 3);

  const handleAskAI = () => {
    if (aiPrompt.trim()) {
      onAskAI(aiPrompt);
      setAiPrompt("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground/90 mb-1">
          {steps.length === 0 ? "Get Started" : "Add Next Step"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {steps.length === 0 
            ? "What should happen when this triggers?" 
            : "Continue building your workflow"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2 mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Suggested
        </p>
        {topSuggestions.map((suggestion) => (
          <motion.button
            key={suggestion.type}
            onClick={() => onAddStep(suggestion.type)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border hover:border-border/70 transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              {ACTION_ICONS[suggestion.type] || <Plus className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground group-hover:text-foreground">
                {suggestion.label}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {suggestion.description}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Templates Button */}
      <Button
        variant="outline"
        onClick={onOpenTemplates}
        className="w-full mb-4 border-border bg-muted/30 hover:bg-muted/50 text-foreground/80 hover:text-foreground"
      >
        <LayoutTemplate className="h-4 w-4 mr-2" />
        Use a Template
      </Button>

      {/* AI Helper */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Ask AI</span>
        </div>
        <div className="relative">
          <Input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
            placeholder="What should happen next?"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground pr-10"
          />
          <button
            onClick={handleAskAI}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Try: "Send a reminder 1 hour before"
        </p>
      </div>

      {/* Show All Actions Toggle */}
      <div className="mt-auto pt-4 border-t border-border">
        <button
          onClick={() => setShowAllActions(!showAllActions)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground/70 transition-colors"
        >
          {showAllActions ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Hide all actions
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show all actions
            </>
          )}
        </button>

        <AnimatePresence>
          {showAllActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-1 overflow-hidden"
            >
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.type}
                  onClick={() => onAddStep(action.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  {ACTION_ICONS[action.type] || <Plus className="h-4 w-4" />}
                  <span>{action.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
