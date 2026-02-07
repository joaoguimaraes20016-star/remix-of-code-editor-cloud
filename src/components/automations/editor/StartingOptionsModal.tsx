import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, LayoutTemplate, Hammer, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StartingOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: () => void;
  onStartScratch: () => void;
  onAIGenerate?: (prompt: string) => Promise<void>;
}

const EXAMPLE_PROMPTS = [
  "Send a welcome SMS to new leads",
  "Follow up after missed appointments",
  "Alert team when a deal closes",
];

export function StartingOptionsModal({
  open,
  onOpenChange,
  onSelectTemplate,
  onStartScratch,
  onAIGenerate,
}: StartingOptionsModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim() || !onAIGenerate) return;
    setIsGenerating(true);
    try {
      await onAIGenerate(prompt);
      onOpenChange(false);
    } finally {
      setIsGenerating(false);
      setPrompt("");
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[540px] bg-background border-border p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">What would you like to automate?</DialogTitle>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-6"
        >
          {/* AI Chat Section */}
          <div className="text-center mb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 mb-2"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                What would you like to automate?
              </h2>
            </motion.div>
          </div>

          {/* AI Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="relative mb-3"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your automation..."
              disabled={isGenerating}
              className="w-full px-4 py-3 pr-12 bg-muted/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating || !onAIGenerate}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </motion.div>

          {/* Example Prompts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex flex-wrap gap-2 mb-5"
          >
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                disabled={isGenerating}
                className="text-xs px-3 py-1.5 rounded-full bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground/70 transition-all disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Option Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="grid grid-cols-2 gap-3 mb-4"
          >
            <OptionCard
              icon={LayoutTemplate}
              title="Use a Template"
              description="Pre-built workflows"
              onClick={onSelectTemplate}
              disabled={isGenerating}
            />
            <OptionCard
              icon={Hammer}
              title="Start from Scratch"
              description="Build step by step"
              onClick={onStartScratch}
              variant="secondary"
              disabled={isGenerating}
            />
          </motion.div>

          {/* Skip Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-center"
          >
            <button
              onClick={onStartScratch}
              disabled={isGenerating}
              className="text-xs text-muted-foreground hover:text-foreground/60 hover:underline transition-all disabled:opacity-50"
            >
              Skip for now
            </button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

interface OptionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

function OptionCard({
  icon: Icon,
  title,
  description,
  onClick,
  variant = "primary",
  disabled = false,
}: OptionCardProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-start text-left p-4 rounded-xl border transition-all duration-200",
        "bg-muted/20 hover:bg-muted/40",
        variant === "primary"
          ? "border-primary/20 hover:border-primary/40"
          : "border-border hover:border-border/70",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon
        className={cn(
          "w-6 h-6 mb-2",
          variant === "primary" ? "text-primary" : "text-foreground/70"
        )}
      />
      <h3 className="text-sm font-medium text-foreground mb-0.5">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </motion.button>
  );
}