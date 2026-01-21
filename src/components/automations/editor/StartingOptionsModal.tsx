import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, LayoutTemplate, Hammer, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StartingOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: () => void;
  onStartScratch: () => void;
}

export function StartingOptionsModal({
  open,
  onOpenChange,
  onSelectTemplate,
  onStartScratch,
}: StartingOptionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg bg-[#0a0a0f] border-white/10 p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">How would you like to start?</DialogTitle>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4"
            >
              <Sparkles className="w-7 h-7 text-primary" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-xl font-semibold text-white mb-2"
            >
              How would you like to start?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-white/50 text-sm"
            >
              Choose a template or build your automation from scratch
            </motion.p>
          </div>

          {/* Option Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <OptionCard
              icon={LayoutTemplate}
              title="Use a Template"
              description="Pre-built workflows ready to customize"
              onClick={onSelectTemplate}
              delay={0.25}
            />
            <OptionCard
              icon={Hammer}
              title="Start from Scratch"
              description="Build your own step by step"
              onClick={onStartScratch}
              delay={0.3}
              variant="secondary"
            />
          </div>

          {/* Skip Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-center"
          >
            <button
              onClick={onStartScratch}
              className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors group"
            >
              Skip for now
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
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
  delay: number;
  variant?: "primary" | "secondary";
}

function OptionCard({
  icon: Icon,
  title,
  description,
  onClick,
  delay,
  variant = "primary",
}: OptionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center text-center p-6 rounded-xl border transition-all duration-200",
        "bg-white/[0.03] hover:bg-white/[0.06]",
        variant === "primary"
          ? "border-primary/20 hover:border-primary/40"
          : "border-white/10 hover:border-white/20"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
          variant === "primary" ? "bg-primary/10" : "bg-white/5"
        )}
      >
        <Icon
          className={cn(
            "w-6 h-6",
            variant === "primary" ? "text-primary" : "text-white/70"
          )}
        />
      </div>
      <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
      <p className="text-xs text-white/40 leading-relaxed">{description}</p>
    </motion.button>
  );
}
