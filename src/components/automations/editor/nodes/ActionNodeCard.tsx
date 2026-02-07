import { motion } from "framer-motion";
import { 
  MessageSquare, Clock, Tag, ClipboardList, UserCheck, ArrowRightLeft, 
  Bell, Webhook, Check, AlertCircle, GitBranch, UserPlus, UserCog, StickyNote,
  Briefcase, CheckCircle, CalendarClock, Building2, Split, CornerDownRight,
  PlayCircle, StopCircle, Phone, Mail, MessageCircleMore, MessageCircle, Voicemail, PhoneCall,
  Star, Reply, Search, Trash2, BellOff, Copy, Users, UserMinus, Calendar,
  CalendarX, Link, PhoneIncoming, RefreshCw, Receipt, CreditCard, Repeat,
  XCircle, Target, Variable, PlusCircle, MinusCircle, CalendarDays,
  Hash, Type, Calculator, Brain, Sparkles, Languages, FileText, Bot,
  Facebook, ChartBar, Megaphone, Table, Slack, Music
} from "lucide-react";
import type { AutomationStep, ActionType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface ActionNodeCardProps {
  step: AutomationStep;
  isSelected: boolean;
  onSelect: () => void;
  onToggleEnabled?: (stepId: string, enabled: boolean) => void;
}

interface ActionDisplay {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const ACTION_DISPLAY: Record<ActionType, ActionDisplay> = {
  // Messaging Actions
  send_message: { 
    label: "Send Message", 
    icon: <MessageSquare className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  send_email: {
    label: "Send Email",
    icon: <Mail className="h-4 w-4" />,
    color: "text-sky-400",
    bgColor: "bg-sky-500/15"
  },
  send_sms: {
    label: "Send SMS",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-primary",
    bgColor: "bg-primary/15"
  },
  send_whatsapp: {
    label: "Send WhatsApp",
    icon: <MessageCircleMore className="h-4 w-4" />,
    color: "text-primary",
    bgColor: "bg-primary/15"
  },
  send_voicemail: {
    label: "Send Voicemail",
    icon: <Voicemail className="h-4 w-4" />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/15"
  },
  make_call: {
    label: "Make Call",
    icon: <PhoneCall className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15"
  },
  notify_team: { 
    label: "Notify Team", 
    icon: <Bell className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  send_review_request: {
    label: "Send Review Request",
    icon: <Star className="h-4 w-4" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/15"
  },
  reply_in_comments: {
    label: "Reply in Comments",
    icon: <Reply className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15"
  },

  // CRM Actions
  create_contact: { 
    label: "Create Contact", 
    icon: <UserPlus className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  find_contact: {
    label: "Find Contact",
    icon: <Search className="h-4 w-4" />,
    color: "text-sky-400",
    bgColor: "bg-sky-500/15"
  },
  update_contact: { 
    label: "Update Contact", 
    icon: <UserCog className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  delete_contact: {
    label: "Delete Contact",
    icon: <Trash2 className="h-4 w-4" />,
    color: "text-destructive",
    bgColor: "bg-destructive/15"
  },
  add_tag: { 
    label: "Add Tag", 
    icon: <Tag className="h-4 w-4" />, 
    color: "text-success", 
    bgColor: "bg-success/15" 
  },
  remove_tag: { 
    label: "Remove Tag", 
    icon: <Tag className="h-4 w-4" />, 
    color: "text-destructive", 
    bgColor: "bg-destructive/15" 
  },
  add_note: { 
    label: "Add Note", 
    icon: <StickyNote className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  add_task: { 
    label: "Create Task", 
    icon: <ClipboardList className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  assign_owner: { 
    label: "Assign Owner", 
    icon: <UserCheck className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  remove_owner: {
    label: "Remove Owner",
    icon: <UserMinus className="h-4 w-4" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15"
  },
  toggle_dnd: {
    label: "Toggle DND",
    icon: <BellOff className="h-4 w-4" />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15"
  },
  copy_contact: {
    label: "Copy Contact",
    icon: <Copy className="h-4 w-4" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/15"
  },
  add_followers: {
    label: "Add Followers",
    icon: <Users className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15"
  },
  remove_followers: {
    label: "Remove Followers",
    icon: <Users className="h-4 w-4" />,
    color: "text-red-400",
    bgColor: "bg-red-500/15"
  },

  // Appointment Actions
  book_appointment: {
    label: "Book Appointment",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15"
  },
  update_appointment: {
    label: "Update Appointment",
    icon: <CalendarClock className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15"
  },
  cancel_appointment: {
    label: "Cancel Appointment",
    icon: <CalendarX className="h-4 w-4" />,
    color: "text-red-400",
    bgColor: "bg-red-500/15"
  },
  create_booking_link: {
    label: "Create Booking Link",
    icon: <Link className="h-4 w-4" />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/15"
  },
  log_call: {
    label: "Log Call",
    icon: <PhoneIncoming className="h-4 w-4" />,
    color: "text-primary",
    bgColor: "bg-primary/15"
  },

  // Pipeline Actions
  update_stage: { 
    label: "Update Stage", 
    icon: <ArrowRightLeft className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  create_deal: { 
    label: "Create Deal", 
    icon: <Briefcase className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  update_deal: {
    label: "Update Deal",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15"
  },
  close_deal: { 
    label: "Close Deal", 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: "text-success", 
    bgColor: "bg-success/15" 
  },
  find_opportunity: {
    label: "Find Opportunity",
    icon: <Search className="h-4 w-4" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/15"
  },

  // Payment Actions
  send_invoice: {
    label: "Send Invoice",
    icon: <Receipt className="h-4 w-4" />,
    color: "text-primary",
    bgColor: "bg-primary/15"
  },
  charge_payment: {
    label: "Charge Payment",
    icon: <CreditCard className="h-4 w-4" />,
    color: "text-primary",
    bgColor: "bg-primary/15"
  },
  create_subscription: {
    label: "Create Subscription",
    icon: <Repeat className="h-4 w-4" />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/15"
  },
  cancel_subscription: {
    label: "Cancel Subscription",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-400",
    bgColor: "bg-red-500/15"
  },

  // Flow Control Actions
  time_delay: { 
    label: "Wait", 
    icon: <Clock className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  wait_until: { 
    label: "Wait Until", 
    icon: <CalendarClock className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  business_hours: { 
    label: "Business Hours", 
    icon: <Building2 className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  condition: { 
    label: "If / Else", 
    icon: <GitBranch className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  split_test: { 
    label: "A/B Split", 
    icon: <Split className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  go_to: { 
    label: "Go To", 
    icon: <CornerDownRight className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  goal_achieved: {
    label: "Goal Achieved",
    icon: <Target className="h-4 w-4" />,
    color: "text-green-400",
    bgColor: "bg-green-500/15"
  },
  set_variable: {
    label: "Set Variable",
    icon: <Variable className="h-4 w-4" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/15"
  },
  run_workflow: { 
    label: "Run Workflow", 
    icon: <PlayCircle className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  add_to_workflow: {
    label: "Add to Workflow",
    icon: <PlusCircle className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15"
  },
  remove_from_workflow: {
    label: "Remove from Workflow",
    icon: <MinusCircle className="h-4 w-4" />,
    color: "text-red-400",
    bgColor: "bg-red-500/15"
  },
  remove_from_all_workflows: {
    label: "Remove from All Workflows",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-500",
    bgColor: "bg-red-500/15"
  },
  stop_workflow: { 
    label: "Stop", 
    icon: <StopCircle className="h-4 w-4" />, 
    color: "text-destructive", 
    bgColor: "bg-destructive/15" 
  },

  // Data Transform Actions
  format_date: {
    label: "Format Date",
    icon: <CalendarDays className="h-4 w-4" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15"
  },
  format_number: {
    label: "Format Number",
    icon: <Hash className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15"
  },
  format_text: {
    label: "Format Text",
    icon: <Type className="h-4 w-4" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/15"
  },
  math_operation: {
    label: "Math Operation",
    icon: <Calculator className="h-4 w-4" />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/15"
  },

  // AI Actions
  ai_intent: {
    label: "AI Intent",
    icon: <Brain className="h-4 w-4" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/15"
  },
  ai_decision: {
    label: "AI Decision",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/15"
  },
  ai_translate: {
    label: "AI Translate",
    icon: <Languages className="h-4 w-4" />,
    color: "text-sky-400",
    bgColor: "bg-sky-500/15"
  },
  ai_summarize: {
    label: "AI Summarize",
    icon: <FileText className="h-4 w-4" />,
    color: "text-teal-400",
    bgColor: "bg-teal-500/15"
  },
  ai_message: {
    label: "AI Message",
    icon: <Bot className="h-4 w-4" />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/15"
  },

  // Marketing Actions
  meta_conversion: {
    label: "Meta Conversion",
    icon: <Facebook className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15"
  },
  google_conversion: {
    label: "Google Conversion",
    icon: <ChartBar className="h-4 w-4" />,
    color: "text-red-400",
    bgColor: "bg-red-500/15"
  },
  add_to_audience: {
    label: "Add to Audience",
    icon: <Megaphone className="h-4 w-4" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/15"
  },
  remove_from_audience: {
    label: "Remove from Audience",
    icon: <Megaphone className="h-4 w-4" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15"
  },

  // Integration Actions
  custom_webhook: { 
    label: "Webhook", 
    icon: <Webhook className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  google_sheets: {
    label: "Google Sheets",
    icon: <Table className="h-4 w-4" />,
    color: "text-primary",
    bgColor: "bg-primary/15"
  },
  slack_message: {
    label: "Slack Message",
    icon: <Slack className="h-4 w-4" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/15"
  },
  enqueue_dialer: { 
    label: "Power Dialer", 
    icon: <Phone className="h-4 w-4" />, 
    color: "text-primary", 
    bgColor: "bg-primary/15" 
  },
  discord_message: {
    label: "Discord Message",
    icon: <MessageCircle className="h-4 w-4" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/15"
  },
  tiktok_event: {
    label: "TikTok Event",
    icon: <Music className="h-4 w-4" />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/15"
  },
};

// Check if step is properly configured
function isStepConfigured(step: AutomationStep): boolean {
  switch (step.type) {
    case 'send_message':
    case 'send_email':
    case 'send_sms':
    case 'send_whatsapp':
      return !!(step.config?.template && step.config?.channel);
    case 'time_delay':
      return !!(step.config?.delayValue && step.config?.delayType);
    case 'add_tag':
    case 'remove_tag':
      return !!step.config?.tag;
    case 'add_task':
      return !!step.config?.title;
    case 'notify_team':
      return !!step.config?.message;
    case 'condition':
      return (step.conditions?.length || 0) > 0 || (step.conditionGroups?.length || 0) > 0;
    case 'custom_webhook':
      return !!step.config?.url;
    case 'find_contact':
      return !!step.config?.searchField;
    case 'send_invoice':
      return !!step.config?.amount;
    case 'book_appointment':
      return !!step.config?.calendarId;
    case 'math_operation':
      return !!step.config?.operation;
    default:
      return true;
  }
}

// Get a preview text based on the step configuration
function getStepPreview(step: AutomationStep): string {
  switch (step.type) {
    case 'send_message':
    case 'send_email':
    case 'send_sms':
    case 'send_whatsapp':
      if (step.config?.template) {
        const template = step.config.template;
        return template.length > 40 ? `"${template.substring(0, 40)}..."` : `"${template}"`;
      }
      return step.config?.channel ? `via ${step.config.channel.toUpperCase()}` : 'Click to configure';
    case 'time_delay':
      if (step.config?.delayValue && step.config?.delayType) {
        return `Wait ${step.config.delayValue} ${step.config.delayType}`;
      }
      return 'Set delay duration';
    case 'add_tag':
      return step.config?.tag ? `"${step.config.tag}"` : 'Choose a tag';
    case 'remove_tag':
      return step.config?.tag ? `Remove "${step.config.tag}"` : 'Choose a tag';
    case 'add_task':
      return step.config?.title ? `"${step.config.title}"` : 'Set task details';
    case 'notify_team':
      return step.config?.message ? `"${step.config.message.substring(0, 30)}..."` : 'Set notification';
    case 'condition':
      const count = step.conditions?.length || step.conditionGroups?.length || 0;
      return count > 0 ? `${count} condition${count !== 1 ? 's' : ''}` : 'Add conditions';
    case 'custom_webhook':
      return step.config?.url ? step.config.url.substring(0, 30) + '...' : 'Configure webhook';
    case 'find_contact':
      return step.config?.searchField ? `Search by ${step.config.searchField}` : 'Set search criteria';
    case 'send_invoice':
      return step.config?.amount ? `$${step.config.amount}` : 'Set invoice details';
    case 'book_appointment':
      return step.config?.calendarId ? 'Calendar configured' : 'Select calendar';
    case 'math_operation':
      return step.config?.operation || 'Set operation';
    case 'ai_intent':
    case 'ai_decision':
      return 'AI-powered logic';
    case 'goal_achieved':
      return step.config?.goalName || 'Set goal name';
    default:
      return 'Click to configure';
  }
}

export function ActionNodeCard({ step, isSelected, onSelect, onToggleEnabled }: ActionNodeCardProps) {
  const display = ACTION_DISPLAY[step.type] || ACTION_DISPLAY.send_message;
  const preview = getStepPreview(step);
  const isConfigured = isStepConfigured(step);
  const isEnabled = step.enabled !== false; // default to enabled

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-96 rounded-2xl border-2 transition-all shadow-lg",
        "bg-background",
        isSelected 
          ? "border-primary shadow-primary/20" 
          : "border-border hover:border-primary/50 hover:shadow-xl",
        !isEnabled && "opacity-50"
      )}
    >
      {/* Status Indicator */}
      <div className={cn(
        "absolute -right-1.5 -top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background",
        !isEnabled ? "bg-muted-foreground" : isConfigured ? "bg-green-500" : "bg-yellow-500"
      )}>
        {!isEnabled ? (
          <StopCircle className="h-3.5 w-3.5 text-white" />
        ) : isConfigured ? (
          <Check className="h-3.5 w-3.5 text-white" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-white" />
        )}
      </div>

      {/* Enable/Disable Toggle */}
      {onToggleEnabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleEnabled(step.id, !isEnabled);
          }}
          className={cn(
            "absolute -left-1.5 -top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background transition-colors z-10",
            isEnabled 
              ? "bg-primary hover:bg-primary/80" 
              : "bg-muted-foreground hover:bg-muted-foreground/80"
          )}
          title={isEnabled ? "Disable this step (skip during execution)" : "Enable this step"}
        >
          {isEnabled ? (
            <Check className="h-3 w-3 text-white" />
          ) : (
            <StopCircle className="h-3 w-3 text-white" />
          )}
        </button>
      )}

      <div className="flex items-start gap-5 p-6">
        {/* Icon */}
        <div className={cn("p-4 rounded-xl", isEnabled ? display.bgColor : "bg-muted")}>
          <span className={isEnabled ? display.color : "text-muted-foreground"}>{display.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 text-left min-w-0">
          <div className={cn(
            "font-semibold text-lg mb-1",
            isEnabled ? "text-foreground" : "text-muted-foreground"
          )}>
            {display.label}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {!isEnabled ? "Disabled — will be skipped" : preview}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
