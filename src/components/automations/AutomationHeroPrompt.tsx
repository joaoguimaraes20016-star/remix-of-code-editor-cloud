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
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Hero Prompt Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            AI-Powered
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            What would you like to automate?
          </h2>
          <p className="text-muted-foreground">
            Describe what you want to happen, or choose a quick start below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Send a text when someone books an appointment..."
              className="w-full h-14 pl-5 pr-14 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!prompt.trim()}
              className="absolute right-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">or start with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Quick Start Tiles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {QUICK_START_TILES.map((tile, index) => (
          <motion.button
            key={tile.id}
            onClick={() => onQuickStart(tile.trigger)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left"
          >
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
              {tile.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                {tile.title}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5 truncate">
                {tile.description}
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
