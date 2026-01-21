import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Mail,
  MessageCircle,
  UserPlus,
  Search,
  UserCog,
  StickyNote,
  CalendarPlus,
  Receipt,
  CreditCard,
  GitBranch,
  Split,
  Target,
  Brain,
  Sparkles,
  BarChart,
} from "lucide-react";
import type { ActionType } from "@/lib/automations/types";

interface AddStepButtonProps {
  onAddStep: (type: ActionType) => void;
}

interface ActionOption {
  type: ActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "messaging" | "crm" | "appointment" | "pipeline" | "payment" | "flow" | "ai" | "marketing" | "integration";
}

const ACTION_OPTIONS: ActionOption[] = [
  // Communication
  { type: "send_message", label: "Send Message", description: "SMS, Email, or Voice", icon: <MessageSquare className="h-4 w-4" />, category: "messaging" },
  { type: "send_email", label: "Send Email", description: "Send an email", icon: <Mail className="h-4 w-4" />, category: "messaging" },
  { type: "send_whatsapp", label: "Send WhatsApp", description: "WhatsApp message", icon: <MessageCircle className="h-4 w-4" />, category: "messaging" },
  { type: "notify_team", label: "Notify Team", description: "Alert team members", icon: <Bell className="h-4 w-4" />, category: "messaging" },
  
  // CRM
  { type: "create_contact", label: "Create Contact", description: "Add a new contact", icon: <UserPlus className="h-4 w-4" />, category: "crm" },
  { type: "find_contact", label: "Find Contact", description: "Lookup contact", icon: <Search className="h-4 w-4" />, category: "crm" },
  { type: "update_contact", label: "Update Contact", description: "Modify fields", icon: <UserCog className="h-4 w-4" />, category: "crm" },
  { type: "add_tag", label: "Add Tag", description: "Tag the contact", icon: <Tag className="h-4 w-4" />, category: "crm" },
  { type: "add_task", label: "Create Task", description: "Assign a task", icon: <ClipboardList className="h-4 w-4" />, category: "crm" },
  { type: "add_note", label: "Add Note", description: "Add a note", icon: <StickyNote className="h-4 w-4" />, category: "crm" },
  { type: "assign_owner", label: "Assign Owner", description: "Set owner", icon: <UserCheck className="h-4 w-4" />, category: "crm" },
  
  // Appointments
  { type: "book_appointment", label: "Book Appointment", description: "Schedule appointment", icon: <CalendarPlus className="h-4 w-4" />, category: "appointment" },
  
  // Pipeline
  { type: "update_stage", label: "Update Stage", description: "Move in pipeline", icon: <ArrowRightLeft className="h-4 w-4" />, category: "pipeline" },
  
  // Payments
  { type: "send_invoice", label: "Send Invoice", description: "Create invoice", icon: <Receipt className="h-4 w-4" />, category: "payment" },
  { type: "charge_payment", label: "Charge Payment", description: "One-time charge", icon: <CreditCard className="h-4 w-4" />, category: "payment" },
  
  // Flow Control
  { type: "time_delay", label: "Wait", description: "Pause before next step", icon: <Clock className="h-4 w-4" />, category: "flow" },
  { type: "condition", label: "If / Else", description: "Branch on conditions", icon: <GitBranch className="h-4 w-4" />, category: "flow" },
  { type: "split_test", label: "A/B Split", description: "Split testing", icon: <Split className="h-4 w-4" />, category: "flow" },
  { type: "goal_achieved", label: "Goal Event", description: "Track conversion", icon: <Target className="h-4 w-4" />, category: "flow" },
  
  // AI
  { type: "ai_decision", label: "AI Decision", description: "Smart branching", icon: <Brain className="h-4 w-4" />, category: "ai" },
  { type: "ai_message", label: "AI Message", description: "Generate response", icon: <Sparkles className="h-4 w-4" />, category: "ai" },
  
  // Marketing
  { type: "meta_conversion", label: "Meta Conversion", description: "Facebook CAPI", icon: <BarChart className="h-4 w-4" />, category: "marketing" },
  
  // Integrations
  { type: "custom_webhook", label: "Webhook", description: "Call external API", icon: <Webhook className="h-4 w-4" />, category: "integration" },
];

const CATEGORY_LABELS: Record<string, string> = {
  messaging: "Communication",
  crm: "CRM Actions",
  appointment: "Appointments",
  pipeline: "Pipeline",
  payment: "Payments",
  flow: "Flow Control",
  ai: "AI Actions",
  marketing: "Marketing",
  integration: "Integrations",
};

export function AddStepButton({ onAddStep }: AddStepButtonProps) {
  const grouped = ACTION_OPTIONS.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, ActionOption[]>);

  const categories = ["messaging", "crm", "appointment", "pipeline", "payment", "flow", "ai", "marketing", "integration"];

  return (
    <div className="flex justify-center py-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 border-dashed">
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72">
          <ScrollArea className="h-96">
            {categories.map((category, idx) => {
              const items = grouped[category];
              if (!items || items.length === 0) return null;
              
              return (
                <div key={category}>
                  {idx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel>{CATEGORY_LABELS[category]}</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {items.map((option) => (
                      <DropdownMenuItem
                        key={option.type}
                        onClick={() => onAddStep(option.type)}
                        className="flex items-start gap-3 cursor-pointer py-2"
                      >
                        <div className="mt-0.5">{option.icon}</div>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </div>
              );
            })}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
