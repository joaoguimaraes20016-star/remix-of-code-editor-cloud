import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, ArrowRight, Calendar, UserPlus, Bell, 
  MessageSquare, Clock, Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TriggerType } from "@/lib/automations/types";

interface AutomationHeroPromptProps {
  onCreateFromPrompt?: (prompt: string) => void;
  onQuickStart: (triggerType: TriggerType) => void;
}

interface QuickStartTile {
  id: string;
  title: string;
  description: string;
  trigger: TriggerType;
  icon: React.ReactNode;
}

const QUICK_START_TILES: QuickStartTile[] = [
  {
    id: "booking-confirmation",
    title: "Confirm bookings",
    description: "Send confirmation when someone books",
    trigger: "appointment_booked",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: "new-lead-notify",
    title: "New lead alerts",
    description: "Notify your team on new leads",
    trigger: "lead_created",
    icon: <UserPlus className="h-5 w-5" />,
  },
  {
    id: "no-show-followup",
    title: "No-show follow-up",
    description: "Re-engage leads who didn't show",
    trigger: "appointment_no_show",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    id: "stage-notification",
    title: "Stage updates",
    description: "Trigger actions on pipeline changes",
    trigger: "stage_changed",
    icon: <Zap className="h-5 w-5" />,
  },
];

export function AutomationHeroPrompt({ onCreateFromPrompt, onQuickStart }: AutomationHeroPromptProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && onCreateFromPrompt) {
      onCreateFromPrompt(prompt.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Hero Prompt Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            What would you like to automate?
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Send a text when someone books..."
              className="w-full h-11 pl-4 pr-12 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!prompt.trim()}
              className="absolute right-1.5 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or quick start</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Quick Start Tiles - More compact grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        {QUICK_START_TILES.map((tile, index) => (
          <motion.button
            key={tile.id}
            onClick={() => onQuickStart(tile.trigger)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.03 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
              {tile.icon}
            </div>
            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {tile.title}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
