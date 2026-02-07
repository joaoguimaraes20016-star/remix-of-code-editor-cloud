import { motion } from "framer-motion";
import { 
  Zap, Check, AlertCircle, UserPlus, Tag, Calendar, CalendarClock, 
  UserX, CalendarCheck, CalendarX, ArrowRightLeft, Briefcase, 
  Trophy, XCircle, DollarSign, Webhook, Play, 
  Clock, Timer, FileText, X, Cake, UserCog, BellOff, CalendarDays,
  StickyNote, ClipboardCheck, HelpCircle, Eye, MousePointerClick,
  ListPlus, Bell, CheckSquare, RefreshCw, Send, AlertTriangle,
  Repeat, RotateCcw, ShoppingCart, MessageCircle, MailOpen, MailX,
  AlertOctagon, Star, Facebook, Music, Search, CreditCard, Receipt,
  ReceiptText
} from "lucide-react";
import type { AutomationTrigger, TriggerType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface TriggerNodeCardProps {
  trigger: AutomationTrigger;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

interface TriggerDisplay {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const TRIGGER_DISPLAY: Record<TriggerType, TriggerDisplay> = {
  // Contact Events
  lead_created: { 
    label: "Lead Created", 
    icon: <UserPlus className="h-5 w-5" />, 
    color: "text-primary", 
    bgColor: "bg-primary/20" 
  },
  lead_tag_added: { 
    label: "Tag Added", 
    icon: <Tag className="h-5 w-5" />, 
    color: "text-green-400", 
    bgColor: "bg-green-500/20" 
  },
  lead_tag_removed: { 
    label: "Tag Removed", 
    icon: <Tag className="h-5 w-5" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
  contact_changed: {
    label: "Contact Changed",
    icon: <UserCog className="h-5 w-5" />,
    color: "text-sky-400",
    bgColor: "bg-sky-500/20"
  },
  contact_dnd: {
    label: "DND Status Changed",
    icon: <BellOff className="h-5 w-5" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20"
  },
  birthday_reminder: {
    label: "Birthday Reminder",
    icon: <Cake className="h-5 w-5" />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20"
  },
  custom_date_reminder: {
    label: "Custom Date Reminder",
    icon: <CalendarDays className="h-5 w-5" />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20"
  },
  note_added: {
    label: "Note Added",
    icon: <StickyNote className="h-5 w-5" />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20"
  },

  // Form Events
  form_submitted: { 
    label: "Form Submitted", 
    icon: <FileText className="h-5 w-5" />, 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/20" 
  },
  survey_submitted: {
    label: "Survey Submitted",
    icon: <ClipboardCheck className="h-5 w-5" />,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20"
  },
  quiz_submitted: {
    label: "Quiz Submitted",
    icon: <HelpCircle className="h-5 w-5" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20"
  },
  funnel_page_view: {
    label: "Page Viewed",
    icon: <Eye className="h-5 w-5" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20"
  },
  trigger_link_clicked: {
    label: "Link Clicked",
    icon: <MousePointerClick className="h-5 w-5" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20"
  },

  // Task Events
  task_added: {
    label: "Task Added",
    icon: <ListPlus className="h-5 w-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20"
  },
  task_reminder: {
    label: "Task Reminder",
    icon: <Bell className="h-5 w-5" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20"
  },
  task_completed: {
    label: "Task Completed",
    icon: <CheckSquare className="h-5 w-5" />,
    color: "text-primary",
    bgColor: "bg-primary/20"
  },

  // Appointment Events
  appointment_booked: { 
    label: "Appointment Booked", 
    icon: <Calendar className="h-5 w-5" />, 
    color: "text-cyan-400", 
    bgColor: "bg-cyan-500/20" 
  },
  appointment_rescheduled: { 
    label: "Rescheduled", 
    icon: <CalendarClock className="h-5 w-5" />, 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/20" 
  },
  appointment_no_show: { 
    label: "No Show", 
    icon: <UserX className="h-5 w-5" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
  appointment_completed: { 
    label: "Completed", 
    icon: <CalendarCheck className="h-5 w-5" />, 
    color: "text-primary", 
    bgColor: "bg-primary/20" 
  },
  appointment_canceled: { 
    label: "Canceled", 
    icon: <CalendarX className="h-5 w-5" />, 
    color: "text-gray-400", 
    bgColor: "bg-gray-500/20" 
  },

  // Pipeline Events
  stage_changed: { 
    label: "Stage Changed", 
    icon: <ArrowRightLeft className="h-5 w-5" />, 
    color: "text-indigo-400", 
    bgColor: "bg-indigo-500/20" 
  },
  deal_created: { 
    label: "Deal Created", 
    icon: <Briefcase className="h-5 w-5" />, 
    color: "text-violet-400", 
    bgColor: "bg-violet-500/20" 
  },
  deal_won: { 
    label: "Deal Won", 
    icon: <Trophy className="h-5 w-5" />, 
    color: "text-yellow-400", 
    bgColor: "bg-yellow-500/20" 
  },
  deal_lost: { 
    label: "Deal Lost", 
    icon: <XCircle className="h-5 w-5" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
  opportunity_changed: {
    label: "Opportunity Changed",
    icon: <RefreshCw className="h-5 w-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20"
  },
  stale_opportunity: {
    label: "Stale Opportunity",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20"
  },

  // Payment Events
  payment_received: { 
    label: "Payment Received", 
    icon: <DollarSign className="h-5 w-5" />, 
    color: "text-primary", 
    bgColor: "bg-primary/20" 
  },
  payment_failed: { 
    label: "Payment Failed", 
    icon: <AlertCircle className="h-5 w-5" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
  invoice_created: {
    label: "Invoice Created",
    icon: <ReceiptText className="h-5 w-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20"
  },
  invoice_sent: {
    label: "Invoice Sent",
    icon: <Send className="h-5 w-5" />,
    color: "text-sky-400",
    bgColor: "bg-sky-500/20"
  },
  invoice_paid: {
    label: "Invoice Paid",
    icon: <Receipt className="h-5 w-5" />,
    color: "text-primary",
    bgColor: "bg-primary/20"
  },
  invoice_overdue: {
    label: "Invoice Overdue",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20"
  },
  subscription_created: {
    label: "Subscription Created",
    icon: <Repeat className="h-5 w-5" />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20"
  },
  subscription_cancelled: {
    label: "Subscription Cancelled",
    icon: <XCircle className="h-5 w-5" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20"
  },
  subscription_renewed: {
    label: "Subscription Renewed",
    icon: <RotateCcw className="h-5 w-5" />,
    color: "text-green-400",
    bgColor: "bg-green-500/20"
  },
  refund_issued: {
    label: "Refund Issued",
    icon: <CreditCard className="h-5 w-5" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20"
  },
  order_submitted: {
    label: "Order Submitted",
    icon: <ShoppingCart className="h-5 w-5" />,
    color: "text-primary",
    bgColor: "bg-primary/20"
  },

  // Messaging Events
  customer_replied: {
    label: "Customer Replied",
    icon: <MessageCircle className="h-5 w-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20"
  },
  email_opened: {
    label: "Email Opened",
    icon: <MailOpen className="h-5 w-5" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20"
  },
  email_bounced: {
    label: "Email Bounced",
    icon: <MailX className="h-5 w-5" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20"
  },
  messaging_error: {
    label: "Messaging Error",
    icon: <AlertOctagon className="h-5 w-5" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20"
  },
  new_review_received: {
    label: "New Review",
    icon: <Star className="h-5 w-5" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20"
  },

  // Integration Events
  webhook_received: { 
    label: "Webhook Received", 
    icon: <Webhook className="h-5 w-5" />, 
    color: "text-purple-400", 
    bgColor: "bg-purple-500/20" 
  },
  manual_trigger: { 
    label: "Manual Trigger", 
    icon: <Play className="h-5 w-5" />, 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/20" 
  },
  scheduled_trigger: { 
    label: "Scheduled", 
    icon: <Clock className="h-5 w-5" />, 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/20" 
  },
  time_delay: { 
    label: "Time Delay", 
    icon: <Timer className="h-5 w-5" />, 
    color: "text-gray-400", 
    bgColor: "bg-gray-500/20" 
  },
  facebook_lead_form: {
    label: "Facebook Lead Form",
    icon: <Facebook className="h-5 w-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20"
  },
  tiktok_form_submitted: {
    label: "TikTok Form",
    icon: <Music className="h-5 w-5" />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20"
  },
  google_lead_form: {
    label: "Google Lead Form",
    icon: <Search className="h-5 w-5" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20"
  },
};

// Check if trigger has required configuration
function isTriggerConfigured(trigger: AutomationTrigger): boolean {
  switch (trigger.type) {
    case 'webhook_received':
      return !!trigger.config?.webhookId;
    case 'scheduled_trigger':
      return !!trigger.config?.schedule;
    case 'lead_tag_added':
    case 'lead_tag_removed':
      return !!trigger.config?.tagName;
    default:
      return true;
  }
}

export function TriggerNodeCard({ trigger, isSelected, onSelect, onDelete }: TriggerNodeCardProps) {
  const display = TRIGGER_DISPLAY[trigger.type] || {
    label: trigger.type,
    icon: <Zap className="h-5 w-5" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  };

  const isConfigured = isTriggerConfigured(trigger);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "relative w-96 rounded-2xl border-2 transition-all shadow-lg group",
        "bg-background",
        isSelected 
          ? "border-primary shadow-primary/20" 
          : "border-border hover:border-primary/50 hover:shadow-xl"
      )}
    >
      {/* Delete Button - Always visible */}
      {onDelete && (
        <motion.button
          initial={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-all z-10 shadow-lg border-2 border-background"
          title="Remove trigger"
        >
          <X className="h-4 w-4 text-white" />
        </motion.button>
      )}

      {/* Status Indicator */}
      <div className={cn(
        "absolute -right-1.5 -top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background",
        isConfigured ? "bg-green-500" : "bg-yellow-500"
      )}>
        {isConfigured ? (
          <Check className="h-3.5 w-3.5 text-white" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-white" />
        )}
      </div>

      <button
        onClick={onSelect}
        className="w-full flex items-center gap-5 p-6"
      >
        {/* Icon */}
        <div className={cn("p-4 rounded-xl", display.bgColor)}>
          <span className={display.color}>{display.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <div className="text-xs text-primary/70 uppercase tracking-wider font-medium mb-1">
            When this happens
          </div>
          <div className="text-foreground font-semibold text-lg">
            {display.label}
          </div>
        </div>

        {/* Trigger Badge */}
        <div className="px-3 py-1.5 rounded-lg bg-primary/15 text-sm font-medium text-primary">
          Trigger
        </div>
      </button>
    </motion.div>
  );
}
