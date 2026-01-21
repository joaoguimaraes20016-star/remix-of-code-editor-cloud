import { useState } from "react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  MessageSquare,
  Clock,
  Tag,
  ClipboardList,
  UserCheck,
  ArrowRightLeft,
  Bell,
  Webhook,
  GitBranch,
  Mail,
  MessageCircle,
  UserPlus,
  Search,
  Receipt,
  CreditCard,
  CalendarPlus,
  Brain,
  Target,
  Split,
} from "lucide-react";
import type { ActionType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddNodeButtonProps {
  onAdd: (type: ActionType) => void;
  className?: string;
  size?: "default" | "sm";
}

interface ActionOption {
  type: ActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: "messaging" | "crm" | "appointment" | "pipeline" | "payment" | "flow" | "ai" | "integration";
}

const ACTION_OPTIONS: ActionOption[] = [
  // Messaging
  { type: "send_message", label: "Send Message", description: "SMS, Email, or Voice", icon: <MessageSquare className="h-4 w-4" />, color: "text-blue-400", category: "messaging" },
  { type: "send_email", label: "Send Email", description: "Send an email", icon: <Mail className="h-4 w-4" />, color: "text-sky-400", category: "messaging" },
  { type: "send_whatsapp", label: "Send WhatsApp", description: "WhatsApp message", icon: <MessageCircle className="h-4 w-4" />, color: "text-emerald-400", category: "messaging" },
  { type: "notify_team", label: "Notify Team", description: "Alert team members", icon: <Bell className="h-4 w-4" />, color: "text-yellow-400", category: "messaging" },
  
  // CRM
  { type: "create_contact", label: "Create Contact", description: "Add a new contact", icon: <UserPlus className="h-4 w-4" />, color: "text-emerald-400", category: "crm" },
  { type: "find_contact", label: "Find Contact", description: "Lookup contact", icon: <Search className="h-4 w-4" />, color: "text-sky-400", category: "crm" },
  { type: "add_tag", label: "Add Tag", description: "Tag the contact", icon: <Tag className="h-4 w-4" />, color: "text-green-400", category: "crm" },
  { type: "add_task", label: "Create Task", description: "Assign a task", icon: <ClipboardList className="h-4 w-4" />, color: "text-purple-400", category: "crm" },
  { type: "assign_owner", label: "Assign Owner", description: "Set owner", icon: <UserCheck className="h-4 w-4" />, color: "text-cyan-400", category: "crm" },
  
  // Appointments
  { type: "book_appointment", label: "Book Appointment", description: "Schedule appointment", icon: <CalendarPlus className="h-4 w-4" />, color: "text-purple-400", category: "appointment" },
  
  // Pipeline
  { type: "update_stage", label: "Update Stage", description: "Move in pipeline", icon: <ArrowRightLeft className="h-4 w-4" />, color: "text-indigo-400", category: "pipeline" },
  
  // Payment
  { type: "send_invoice", label: "Send Invoice", description: "Create invoice", icon: <Receipt className="h-4 w-4" />, color: "text-green-400", category: "payment" },
  { type: "charge_payment", label: "Charge Payment", description: "One-time charge", icon: <CreditCard className="h-4 w-4" />, color: "text-emerald-400", category: "payment" },
  
  // Flow Control
  { type: "time_delay", label: "Wait", description: "Pause before next step", icon: <Clock className="h-4 w-4" />, color: "text-orange-400", category: "flow" },
  { type: "condition", label: "If / Else", description: "Branch based on conditions", icon: <GitBranch className="h-4 w-4" />, color: "text-amber-400", category: "flow" },
  { type: "split_test", label: "A/B Split", description: "Random split testing", icon: <Split className="h-4 w-4" />, color: "text-indigo-400", category: "flow" },
  { type: "goal_achieved", label: "Goal Event", description: "Mark goal achieved", icon: <Target className="h-4 w-4" />, color: "text-green-400", category: "flow" },
  
  // AI
  { type: "ai_decision", label: "AI Decision", description: "Smart branching", icon: <Brain className="h-4 w-4" />, color: "text-purple-400", category: "ai" },
  
  // Integrations
  { type: "custom_webhook", label: "Webhook", description: "Call external API", icon: <Webhook className="h-4 w-4" />, color: "text-gray-400", category: "integration" },
];

const CATEGORY_LABELS: Record<string, string> = {
  messaging: "Communication",
  crm: "CRM",
  appointment: "Appointments",
  pipeline: "Pipeline",
  payment: "Payments",
  flow: "Flow Control",
  ai: "AI",
  integration: "Integrations",
};

const CATEGORY_ORDER = ["messaging", "crm", "appointment", "pipeline", "payment", "flow", "ai", "integration"];

export function AddNodeButton({ onAdd, className, size = "default" }: AddNodeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type: ActionType) => {
    onAdd(type);
    setIsOpen(false);
  };

  const actionsByCategory = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = ACTION_OPTIONS.filter((a) => a.category === category);
    return acc;
  }, {} as Record<string, ActionOption[]>);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex items-center justify-center rounded-full transition-all",
            "bg-white/5 border border-dashed border-white/20 hover:border-primary hover:bg-primary/10",
            size === "sm" ? "h-8 w-8" : "h-10 w-10",
            className
          )}
        >
          <Plus className={cn("text-white/60", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 bg-[#1a1a2e] border-white/10"
        align="center"
      >
        <div className="p-3 border-b border-white/10">
          <h4 className="text-sm font-medium text-white">Add Step</h4>
          <p className="text-xs text-white/50">Choose an action to add to your workflow</p>
        </div>

        <ScrollArea className="h-96">
          <div className="p-2">
            {CATEGORY_ORDER.map((category) => {
              const actions = actionsByCategory[category];
              if (!actions || actions.length === 0) return null;
              
              return (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1 text-xs text-white/40 uppercase tracking-wide">
                    {CATEGORY_LABELS[category]}
                  </div>
                  {actions.map((action) => (
                    <button
                      key={action.type}
                      onClick={() => handleSelect(action.type)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className={cn("p-1.5 rounded-md bg-white/5", action.color)}>
                        {action.icon}
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-white">{action.label}</div>
                        <div className="text-xs text-white/50">{action.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
