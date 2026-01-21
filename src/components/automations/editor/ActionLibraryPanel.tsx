import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Search, MessageSquare, Mail, Phone, Bell, Star, Tag, UserPlus, UserCog, 
  Trash2, StickyNote, ClipboardList, UserCheck, UserMinus, BellOff, Copy, Users,
  Calendar, CalendarClock, CalendarX, Link, PhoneIncoming, ArrowRightLeft, 
  Briefcase, RefreshCw, CheckCircle, Receipt, CreditCard, Repeat, XCircle,
  Clock, Building2, GitBranch, Split, CornerDownRight, Target, Variable,
  PlayCircle, PlusCircle, MinusCircle, StopCircle, CalendarDays, Hash, Type,
  Calculator, Brain, Sparkles, Languages, FileText, Bot, Facebook, ChartBar,
  Megaphone, Webhook, Table, Slack, MessageCircleMore, Voicemail, PhoneCall, Reply
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ActionType } from "@/lib/automations/types";
import { ChevronDown } from "lucide-react";

interface ActionLibraryPanelProps {
  onSelect: (type: ActionType) => void;
  supportedActions?: ActionType[];
}

interface ActionOption {
  type: ActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface ActionCategory {
  id: string;
  label: string;
  actions: ActionOption[];
}

const ACTION_CATEGORIES: ActionCategory[] = [
  {
    id: "messaging",
    label: "Messaging",
    actions: [
      { type: "send_message", label: "Send Message", description: "Email, SMS, or multi-channel", icon: <MessageSquare className="h-4 w-4" />, color: "text-primary" },
      { type: "send_email", label: "Send Email", description: "Send an email message", icon: <Mail className="h-4 w-4" />, color: "text-sky-400" },
      { type: "send_sms", label: "Send SMS", description: "Send a text message", icon: <MessageSquare className="h-4 w-4" />, color: "text-green-400" },
      { type: "send_whatsapp", label: "Send WhatsApp", description: "Send WhatsApp message", icon: <MessageCircleMore className="h-4 w-4" />, color: "text-emerald-400" },
      { type: "send_voicemail", label: "Send Voicemail", description: "Drop a voicemail", icon: <Voicemail className="h-4 w-4" />, color: "text-violet-400" },
      { type: "make_call", label: "Make Call", description: "Initiate a phone call", icon: <PhoneCall className="h-4 w-4" />, color: "text-blue-400" },
      { type: "notify_team", label: "Notify Team", description: "Send internal notification", icon: <Bell className="h-4 w-4" />, color: "text-amber-400" },
      { type: "send_review_request", label: "Request Review", description: "Ask for a review", icon: <Star className="h-4 w-4" />, color: "text-yellow-400" },
      { type: "reply_in_comments", label: "Reply in Comments", description: "Auto-reply to comments", icon: <Reply className="h-4 w-4" />, color: "text-blue-400" },
    ],
  },
  {
    id: "crm",
    label: "CRM Actions",
    actions: [
      { type: "create_contact", label: "Create Contact", description: "Add new contact to CRM", icon: <UserPlus className="h-4 w-4" />, color: "text-primary" },
      { type: "find_contact", label: "Find Contact", description: "Lookup existing contact", icon: <Search className="h-4 w-4" />, color: "text-sky-400" },
      { type: "update_contact", label: "Update Contact", description: "Modify contact fields", icon: <UserCog className="h-4 w-4" />, color: "text-blue-400" },
      { type: "delete_contact", label: "Delete Contact", description: "Remove contact from CRM", icon: <Trash2 className="h-4 w-4" />, color: "text-destructive" },
      { type: "add_tag", label: "Add Tag", description: "Tag the contact", icon: <Tag className="h-4 w-4" />, color: "text-green-400" },
      { type: "remove_tag", label: "Remove Tag", description: "Remove a tag", icon: <Tag className="h-4 w-4" />, color: "text-red-400" },
      { type: "add_note", label: "Add Note", description: "Add note to contact", icon: <StickyNote className="h-4 w-4" />, color: "text-amber-400" },
      { type: "add_task", label: "Create Task", description: "Assign a task", icon: <ClipboardList className="h-4 w-4" />, color: "text-blue-400" },
      { type: "assign_owner", label: "Assign Owner", description: "Set contact owner", icon: <UserCheck className="h-4 w-4" />, color: "text-violet-400" },
      { type: "remove_owner", label: "Remove Owner", description: "Unassign owner", icon: <UserMinus className="h-4 w-4" />, color: "text-orange-400" },
      { type: "toggle_dnd", label: "Toggle DND", description: "Enable/disable Do Not Disturb", icon: <BellOff className="h-4 w-4" />, color: "text-amber-400" },
      { type: "copy_contact", label: "Copy Contact", description: "Duplicate contact", icon: <Copy className="h-4 w-4" />, color: "text-indigo-400" },
      { type: "add_followers", label: "Add Followers", description: "Add team followers", icon: <Users className="h-4 w-4" />, color: "text-blue-400" },
      { type: "remove_followers", label: "Remove Followers", description: "Remove followers", icon: <Users className="h-4 w-4" />, color: "text-red-400" },
    ],
  },
  {
    id: "appointments",
    label: "Appointments",
    actions: [
      { type: "book_appointment", label: "Book Appointment", description: "Schedule an appointment", icon: <Calendar className="h-4 w-4" />, color: "text-cyan-400" },
      { type: "update_appointment", label: "Update Appointment", description: "Modify appointment", icon: <CalendarClock className="h-4 w-4" />, color: "text-blue-400" },
      { type: "cancel_appointment", label: "Cancel Appointment", description: "Cancel the booking", icon: <CalendarX className="h-4 w-4" />, color: "text-red-400" },
      { type: "create_booking_link", label: "Create Booking Link", description: "Generate one-time link", icon: <Link className="h-4 w-4" />, color: "text-violet-400" },
      { type: "log_call", label: "Log Call", description: "Record external call", icon: <PhoneIncoming className="h-4 w-4" />, color: "text-green-400" },
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    actions: [
      { type: "update_stage", label: "Update Stage", description: "Move to different stage", icon: <ArrowRightLeft className="h-4 w-4" />, color: "text-indigo-400" },
      { type: "create_deal", label: "Create Deal", description: "Create new opportunity", icon: <Briefcase className="h-4 w-4" />, color: "text-violet-400" },
      { type: "update_deal", label: "Update Deal", description: "Modify deal details", icon: <RefreshCw className="h-4 w-4" />, color: "text-blue-400" },
      { type: "close_deal", label: "Close Deal", description: "Mark deal as won", icon: <CheckCircle className="h-4 w-4" />, color: "text-green-400" },
      { type: "find_opportunity", label: "Find Opportunity", description: "Lookup existing deal", icon: <Search className="h-4 w-4" />, color: "text-sky-400" },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    actions: [
      { type: "send_invoice", label: "Send Invoice", description: "Create and send invoice", icon: <Receipt className="h-4 w-4" />, color: "text-green-400" },
      { type: "charge_payment", label: "Charge Payment", description: "Process one-time payment", icon: <CreditCard className="h-4 w-4" />, color: "text-emerald-400" },
      { type: "create_subscription", label: "Create Subscription", description: "Start recurring billing", icon: <Repeat className="h-4 w-4" />, color: "text-violet-400" },
      { type: "cancel_subscription", label: "Cancel Subscription", description: "End subscription", icon: <XCircle className="h-4 w-4" />, color: "text-red-400" },
    ],
  },
  {
    id: "flow",
    label: "Flow Control",
    actions: [
      { type: "time_delay", label: "Wait", description: "Pause for duration", icon: <Clock className="h-4 w-4" />, color: "text-orange-400" },
      { type: "wait_until", label: "Wait Until", description: "Wait for specific time", icon: <CalendarClock className="h-4 w-4" />, color: "text-amber-400" },
      { type: "business_hours", label: "Business Hours", description: "Check business hours", icon: <Building2 className="h-4 w-4" />, color: "text-blue-400" },
      { type: "condition", label: "If / Else", description: "Conditional branching", icon: <GitBranch className="h-4 w-4" />, color: "text-purple-400" },
      { type: "split_test", label: "A/B Split", description: "Split test paths", icon: <Split className="h-4 w-4" />, color: "text-pink-400" },
      { type: "go_to", label: "Go To", description: "Jump to step", icon: <CornerDownRight className="h-4 w-4" />, color: "text-indigo-400" },
      { type: "goal_achieved", label: "Goal Achieved", description: "Mark conversion goal", icon: <Target className="h-4 w-4" />, color: "text-green-400" },
      { type: "set_variable", label: "Set Variable", description: "Store custom value", icon: <Variable className="h-4 w-4" />, color: "text-violet-400" },
      { type: "run_workflow", label: "Run Workflow", description: "Trigger another workflow", icon: <PlayCircle className="h-4 w-4" />, color: "text-blue-400" },
      { type: "add_to_workflow", label: "Add to Workflow", description: "Enroll in workflow", icon: <PlusCircle className="h-4 w-4" />, color: "text-cyan-400" },
      { type: "remove_from_workflow", label: "Remove from Workflow", description: "Exit workflow", icon: <MinusCircle className="h-4 w-4" />, color: "text-red-400" },
      { type: "stop_workflow", label: "Stop Workflow", description: "End execution", icon: <StopCircle className="h-4 w-4" />, color: "text-destructive" },
    ],
  },
  {
    id: "data",
    label: "Data Transform",
    actions: [
      { type: "format_date", label: "Format Date", description: "Transform date format", icon: <CalendarDays className="h-4 w-4" />, color: "text-cyan-400" },
      { type: "format_number", label: "Format Number", description: "Transform number format", icon: <Hash className="h-4 w-4" />, color: "text-blue-400" },
      { type: "format_text", label: "Format Text", description: "Transform text", icon: <Type className="h-4 w-4" />, color: "text-indigo-400" },
      { type: "math_operation", label: "Math Operation", description: "Perform calculation", icon: <Calculator className="h-4 w-4" />, color: "text-violet-400" },
    ],
  },
  {
    id: "ai",
    label: "AI Actions",
    actions: [
      { type: "ai_intent", label: "AI Intent Detection", description: "Detect message intent", icon: <Brain className="h-4 w-4" />, color: "text-purple-400" },
      { type: "ai_decision", label: "AI Decision", description: "Smart branching with AI", icon: <Sparkles className="h-4 w-4" />, color: "text-violet-400" },
      { type: "ai_translate", label: "AI Translate", description: "Translate content", icon: <Languages className="h-4 w-4" />, color: "text-sky-400" },
      { type: "ai_summarize", label: "AI Summarize", description: "Summarize text", icon: <FileText className="h-4 w-4" />, color: "text-teal-400" },
      { type: "ai_message", label: "AI Message", description: "AI-generated response", icon: <Bot className="h-4 w-4" />, color: "text-pink-400" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    actions: [
      { type: "meta_conversion", label: "Meta Conversion", description: "Track Facebook conversion", icon: <Facebook className="h-4 w-4" />, color: "text-blue-400" },
      { type: "google_conversion", label: "Google Conversion", description: "Track Google Ads conversion", icon: <ChartBar className="h-4 w-4" />, color: "text-red-400" },
      { type: "add_to_audience", label: "Add to Audience", description: "Add to custom audience", icon: <Megaphone className="h-4 w-4" />, color: "text-indigo-400" },
      { type: "remove_from_audience", label: "Remove from Audience", description: "Remove from audience", icon: <Megaphone className="h-4 w-4" />, color: "text-orange-400" },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    actions: [
      { type: "custom_webhook", label: "Webhook", description: "Send to external URL", icon: <Webhook className="h-4 w-4" />, color: "text-purple-400" },
      { type: "google_sheets", label: "Google Sheets", description: "Add row to sheet", icon: <Table className="h-4 w-4" />, color: "text-green-400" },
      { type: "slack_message", label: "Slack Message", description: "Send to Slack", icon: <Slack className="h-4 w-4" />, color: "text-purple-400" },
      { type: "enqueue_dialer", label: "Power Dialer", description: "Add to call queue", icon: <Phone className="h-4 w-4" />, color: "text-blue-400" },
    ],
  },
];

export function ActionLibraryPanel({ onSelect, supportedActions }: ActionLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["messaging", "crm", "flow"]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = ACTION_CATEGORIES.map((category) => ({
    ...category,
    actions: category.actions.filter(
      (action) =>
        action.label.toLowerCase().includes(search.toLowerCase()) ||
        action.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((category) => category.actions.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-sidebar-accent/50 border-sidebar-border h-9"
          />
        </div>
      </div>

      {/* Categories */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredCategories.map((category) => (
            <Collapsible
              key={category.id}
              open={search.length > 0 || expandedCategories.includes(category.id)}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                <span>{category.label}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    (search.length > 0 || expandedCategories.includes(category.id)) && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1 py-1">
                  {category.actions.map((action) => {
                    const isSupported = !supportedActions || supportedActions.includes(action.type);
                    
                    return (
                      <motion.button
                        key={action.type}
                        whileHover={isSupported ? { x: 4 } : undefined}
                        whileTap={isSupported ? { scale: 0.98 } : undefined}
                        onClick={() => isSupported && onSelect(action.type)}
                        disabled={!isSupported}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                          isSupported 
                            ? "hover:bg-sidebar-accent/70 cursor-pointer" 
                            : "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg bg-sidebar-accent", action.color)}>
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{action.label}</span>
                            {!isSupported && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 shrink-0">
                                Coming soon
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/50 truncate">{action.description}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
