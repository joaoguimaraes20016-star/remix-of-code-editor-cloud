import { useState } from "react";
import {
  Search,
  MessageSquare,
  Clock,
  Tag,
  ClipboardList,
  UserCheck,
  ArrowRightLeft,
  Bell,
  Webhook,
  GitBranch,
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserCog,
  StickyNote,
  Briefcase,
  CheckCircle,
  CalendarClock,
  Building2,
  Split,
  CornerDownRight,
  PlayCircle,
  StopCircle,
  Phone,
  Mail,
  MessageCircle,
  Voicemail,
  Star,
  UserMinus,
  BellOff,
  Copy,
  Users,
  CalendarPlus,
  CalendarX,
  Link,
  PhoneCall,
  Edit,
  Receipt,
  CreditCard,
  Repeat,
  XCircle,
  Target,
  Variable,
  ListPlus,
  ListMinus,
  Calendar,
  Hash,
  Type,
  Calculator,
  Brain,
  Sparkles,
  Languages,
  FileText,
  MessageSquarePlus,
  BarChart,
  Table,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ActionType, ActionCategory } from "@/lib/automations/types";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NodeSidebarProps {
  onAddNode: (type: ActionType) => void;
}

interface NodeOption {
  type: ActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface NodeCategory {
  id: ActionCategory;
  label: string;
  nodes: NodeOption[];
}

const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: "messaging",
    label: "Communication",
    nodes: [
      { type: "send_message", label: "Send Message", description: "SMS, Email, or Voice", icon: <MessageSquare className="h-4 w-4" />, color: "text-blue-400" },
      { type: "send_email", label: "Send Email", description: "Send an email", icon: <Mail className="h-4 w-4" />, color: "text-sky-400" },
      { type: "send_sms", label: "Send SMS", description: "Send a text message", icon: <MessageSquare className="h-4 w-4" />, color: "text-green-400" },
      { type: "send_whatsapp", label: "Send WhatsApp", description: "Send WhatsApp message", icon: <MessageCircle className="h-4 w-4" />, color: "text-emerald-400" },
      { type: "send_voicemail", label: "Send Voicemail", description: "Drop a voicemail", icon: <Voicemail className="h-4 w-4" />, color: "text-purple-400" },
      { type: "make_call", label: "Make Call", description: "Initiate outbound call", icon: <Phone className="h-4 w-4" />, color: "text-blue-400" },
      { type: "notify_team", label: "Notify Team", description: "Alert team members", icon: <Bell className="h-4 w-4" />, color: "text-yellow-400" },
      { type: "send_review_request", label: "Request Review", description: "Ask for a review", icon: <Star className="h-4 w-4" />, color: "text-amber-400" },
      { type: "reply_in_comments", label: "Reply in Comments", description: "Reply to social comments", icon: <MessageCircle className="h-4 w-4" />, color: "text-pink-400" },
    ],
  },
  {
    id: "crm",
    label: "CRM Actions",
    nodes: [
      { type: "create_contact", label: "Create Contact", description: "Add a new contact", icon: <UserPlus className="h-4 w-4" />, color: "text-emerald-400" },
      { type: "find_contact", label: "Find Contact", description: "Lookup contact by field", icon: <Search className="h-4 w-4" />, color: "text-sky-400" },
      { type: "update_contact", label: "Update Contact", description: "Modify contact fields", icon: <UserCog className="h-4 w-4" />, color: "text-sky-400" },
      { type: "delete_contact", label: "Delete Contact", description: "Remove contact", icon: <UserMinus className="h-4 w-4" />, color: "text-red-400" },
      { type: "add_tag", label: "Add Tag", description: "Tag for segmentation", icon: <Tag className="h-4 w-4" />, color: "text-green-400" },
      { type: "remove_tag", label: "Remove Tag", description: "Remove a tag", icon: <Tag className="h-4 w-4" />, color: "text-red-400" },
      { type: "add_task", label: "Create Task", description: "Assign a follow-up task", icon: <ClipboardList className="h-4 w-4" />, color: "text-purple-400" },
      { type: "add_note", label: "Add Note", description: "Add a note to record", icon: <StickyNote className="h-4 w-4" />, color: "text-amber-400" },
      { type: "assign_owner", label: "Assign Owner", description: "Set lead or deal owner", icon: <UserCheck className="h-4 w-4" />, color: "text-cyan-400" },
      { type: "remove_owner", label: "Remove Owner", description: "Unassign owner", icon: <UserMinus className="h-4 w-4" />, color: "text-slate-400" },
      { type: "toggle_dnd", label: "Toggle DND", description: "Enable/disable DND", icon: <BellOff className="h-4 w-4" />, color: "text-orange-400" },
      { type: "copy_contact", label: "Copy Contact", description: "Duplicate contact", icon: <Copy className="h-4 w-4" />, color: "text-slate-400" },
      { type: "add_followers", label: "Add Followers", description: "Add team followers", icon: <Users className="h-4 w-4" />, color: "text-cyan-400" },
    ],
  },
  {
    id: "appointment",
    label: "Appointments",
    nodes: [
      { type: "book_appointment", label: "Book Appointment", description: "Schedule an appointment", icon: <CalendarPlus className="h-4 w-4" />, color: "text-purple-400" },
      { type: "update_appointment", label: "Update Appointment", description: "Modify appointment", icon: <CalendarClock className="h-4 w-4" />, color: "text-sky-400" },
      { type: "cancel_appointment", label: "Cancel Appointment", description: "Cancel an appointment", icon: <CalendarX className="h-4 w-4" />, color: "text-red-400" },
      { type: "create_booking_link", label: "Create Booking Link", description: "Generate booking URL", icon: <Link className="h-4 w-4" />, color: "text-blue-400" },
      { type: "log_call", label: "Log Call", description: "Record call details", icon: <PhoneCall className="h-4 w-4" />, color: "text-slate-400" },
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    nodes: [
      { type: "update_stage", label: "Update Stage", description: "Move in pipeline", icon: <ArrowRightLeft className="h-4 w-4" />, color: "text-indigo-400" },
      { type: "create_deal", label: "Create Opportunity", description: "Create a new deal", icon: <Briefcase className="h-4 w-4" />, color: "text-violet-400" },
      { type: "update_deal", label: "Update Opportunity", description: "Modify deal details", icon: <Edit className="h-4 w-4" />, color: "text-sky-400" },
      { type: "close_deal", label: "Close Deal", description: "Mark deal as won/lost", icon: <CheckCircle className="h-4 w-4" />, color: "text-green-400" },
      { type: "find_opportunity", label: "Find Opportunity", description: "Lookup opportunity", icon: <Search className="h-4 w-4" />, color: "text-violet-400" },
    ],
  },
  {
    id: "payment",
    label: "Payments",
    nodes: [
      { type: "send_invoice", label: "Send Invoice", description: "Create and send invoice", icon: <Receipt className="h-4 w-4" />, color: "text-green-400" },
      { type: "charge_payment", label: "Charge Payment", description: "One-time charge", icon: <CreditCard className="h-4 w-4" />, color: "text-emerald-400" },
      { type: "create_subscription", label: "Create Subscription", description: "Start recurring billing", icon: <Repeat className="h-4 w-4" />, color: "text-blue-400" },
      { type: "cancel_subscription", label: "Cancel Subscription", description: "Stop recurring billing", icon: <XCircle className="h-4 w-4" />, color: "text-red-400" },
    ],
  },
  {
    id: "flow",
    label: "Flow Control",
    nodes: [
      { type: "time_delay", label: "Wait", description: "Pause before next step", icon: <Clock className="h-4 w-4" />, color: "text-primary" },
      { type: "wait_until", label: "Wait Until", description: "Wait until date/time", icon: <CalendarClock className="h-4 w-4" />, color: "text-primary" },
      { type: "business_hours", label: "Business Hours", description: "Wait for business hours", icon: <Building2 className="h-4 w-4" />, color: "text-teal-400" },
      { type: "condition", label: "If / Else", description: "Branch based on conditions", icon: <GitBranch className="h-4 w-4" />, color: "text-primary" },
      { type: "split_test", label: "A/B Split", description: "Random split testing", icon: <Split className="h-4 w-4" />, color: "text-primary" },
      { type: "go_to", label: "Go To", description: "Jump to another step", icon: <CornerDownRight className="h-4 w-4" />, color: "text-slate-400" },
      { type: "run_workflow", label: "Run Workflow", description: "Trigger another automation", icon: <PlayCircle className="h-4 w-4" />, color: "text-primary" },
      { type: "stop_workflow", label: "Stop", description: "End this workflow", icon: <StopCircle className="h-4 w-4" />, color: "text-red-500" },
      { type: "goal_achieved", label: "Goal Event", description: "Mark goal as achieved", icon: <Target className="h-4 w-4" />, color: "text-green-400" },
      { type: "set_variable", label: "Set Variable", description: "Set custom value", icon: <Variable className="h-4 w-4" />, color: "text-purple-400" },
      { type: "add_to_workflow", label: "Add to Workflow", description: "Add to another workflow", icon: <ListPlus className="h-4 w-4" />, color: "text-blue-400" },
      { type: "remove_from_workflow", label: "Remove from Workflow", description: "Remove from workflow", icon: <ListMinus className="h-4 w-4" />, color: "text-slate-400" },
    ],
  },
  {
    id: "data",
    label: "Data Transform",
    nodes: [
      { type: "format_date", label: "Format Date", description: "Convert date format", icon: <Calendar className="h-4 w-4" />, color: "text-amber-400" },
      { type: "format_number", label: "Format Number", description: "Format number values", icon: <Hash className="h-4 w-4" />, color: "text-amber-400" },
      { type: "format_text", label: "Format Text", description: "Transform text", icon: <Type className="h-4 w-4" />, color: "text-amber-400" },
      { type: "math_operation", label: "Math Operation", description: "Perform calculations", icon: <Calculator className="h-4 w-4" />, color: "text-amber-400" },
    ],
  },
  {
    id: "ai",
    label: "AI Actions",
    nodes: [
      { type: "ai_intent", label: "AI Intent Detection", description: "Detect user intent", icon: <Brain className="h-4 w-4" />, color: "text-purple-400" },
      { type: "ai_decision", label: "AI Decision Maker", description: "Smart branching", icon: <Sparkles className="h-4 w-4" />, color: "text-purple-400" },
      { type: "ai_translate", label: "AI Translate", description: "Translate content", icon: <Languages className="h-4 w-4" />, color: "text-purple-400" },
      { type: "ai_summarize", label: "AI Summarize", description: "Summarize content", icon: <FileText className="h-4 w-4" />, color: "text-purple-400" },
      { type: "ai_message", label: "AI Message", description: "Generate AI response", icon: <MessageSquarePlus className="h-4 w-4" />, color: "text-purple-400" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    nodes: [
      { type: "meta_conversion", label: "Meta Conversion", description: "Send to Facebook CAPI", icon: <BarChart className="h-4 w-4" />, color: "text-blue-500" },
      { type: "google_conversion", label: "Google Conversion", description: "Send to Google Ads", icon: <BarChart className="h-4 w-4" />, color: "text-yellow-500" },
      { type: "add_to_audience", label: "Add to Audience", description: "Add to custom audience", icon: <Users className="h-4 w-4" />, color: "text-blue-400" },
      { type: "remove_from_audience", label: "Remove from Audience", description: "Remove from audience", icon: <UserMinus className="h-4 w-4" />, color: "text-slate-400" },
    ],
  },
  {
    id: "integration",
    label: "Integrations",
    nodes: [
      { type: "custom_webhook", label: "Webhook", description: "Call external API", icon: <Webhook className="h-4 w-4" />, color: "text-gray-400" },
      { type: "google_sheets", label: "Google Sheets", description: "Add row to sheet", icon: <Table className="h-4 w-4" />, color: "text-green-500" },
      { type: "slack_message", label: "Slack Message", description: "Send to Slack", icon: <Hash className="h-4 w-4" />, color: "text-purple-400" },
      { type: "enqueue_dialer", label: "Power Dialer", description: "Add to dialer queue", icon: <Phone className="h-4 w-4" />, color: "text-red-400" },
    ],
  },
];

export function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    NODE_CATEGORIES.map((c) => c.id)
  );

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = NODE_CATEGORIES.map((category) => ({
    ...category,
    nodes: category.nodes.filter(
      (node) =>
        node.label.toLowerCase().includes(search.toLowerCase()) ||
        node.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((category) => category.nodes.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search actions..."
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
      </div>

      {/* Categories */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {filteredCategories.map((category) => (
            <Collapsible
              key={category.id}
              open={expandedCategories.includes(category.id)}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wide">
                  {category.label}
                </span>
                {expandedCategories.includes(category.id) ? (
                  <ChevronDown className="h-3 w-3 text-white/40" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-white/40" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1 mt-1">
                  {category.nodes.map((node) => (
                    <button
                      key={node.type}
                      onClick={() => onAddNode(node.type)}
                      className="w-full flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all group"
                    >
                      <div
                        className={cn(
                          "p-2 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors",
                          node.color
                        )}
                      >
                        {node.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-white">
                          {node.label}
                        </div>
                        <div className="text-xs text-white/50 mt-0.5">
                          {node.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
