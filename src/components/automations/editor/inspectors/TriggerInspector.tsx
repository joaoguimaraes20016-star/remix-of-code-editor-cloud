import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AutomationTrigger, TriggerType, TriggerCategory } from "@/lib/automations/types";
import {
  UserPlus, Tag, UserCog, BellOff, Cake, CalendarDays, StickyNote,
  FileText, ClipboardCheck, HelpCircle, Eye, MousePointerClick,
  Calendar, CalendarClock, UserX, CalendarCheck, CalendarX,
  ListPlus, Bell, CheckSquare,
  ArrowRightLeft, Briefcase, Trophy, XCircle, RefreshCw, Clock,
  DollarSign, AlertCircle, Send, AlertTriangle, Repeat, ShoppingCart, RotateCcw,
  MessageCircle, MailOpen, MailX, AlertOctagon, Star,
  Webhook, Play, Search, Music, Mic
  Phone,
} from "lucide-react";

interface TriggerInspectorProps {
  trigger: AutomationTrigger;
  onChange: (trigger: AutomationTrigger) => void;
}

interface TriggerOption {
  value: TriggerType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: TriggerCategory;
}

// Functional triggers (have backend firing):
const FUNCTIONAL_TRIGGERS: Set<TriggerType> = new Set([
  // Contact triggers
  "lead_created",
  "lead_tag_added",
  "lead_tag_removed",
  "contact_changed",
  "birthday_reminder",
  "custom_date_reminder",
  // Form triggers
  "form_submitted",
  // Appointment triggers
  "appointment_booked",
  "appointment_rescheduled",
  "appointment_canceled",
  "appointment_no_show",
  "appointment_completed",
  // Pipeline/Deal triggers
  "stage_changed",
  "deal_created",
  "deal_won",
  "deal_lost",
  // Payment triggers
  "payment_received",
  "payment_failed",
  "invoice_paid",
  "subscription_created",
  "subscription_cancelled",
  "subscription_renewed",
  "refund_issued",
  // Integration triggers
  "webhook_received",
  "manual_trigger",
  "scheduled_trigger",
  "facebook_lead_form",
  "tiktok_form_submitted",
  "google_lead_form",
  "typeform_response",
  "fathom_summary_received",
]);

const TRIGGER_OPTIONS: TriggerOption[] = [
  // Contact triggers
  { value: "lead_created", label: "Contact Created", description: "When a new contact is added", icon: <UserPlus className="h-4 w-4" />, category: "contact" },
  { value: "lead_tag_added", label: "Contact Tag Added", description: "When a tag is added", icon: <Tag className="h-4 w-4" />, category: "contact" },
  { value: "lead_tag_removed", label: "Contact Tag Removed", description: "When a tag is removed", icon: <Tag className="h-4 w-4" />, category: "contact" },
  { value: "contact_changed", label: "Contact Changed", description: "When a contact field is updated", icon: <UserCog className="h-4 w-4" />, category: "contact" },
  { value: "contact_dnd", label: "Contact DND", description: "When DND status changes", icon: <BellOff className="h-4 w-4" />, category: "contact" },
  { value: "birthday_reminder", label: "Birthday Reminder", description: "Annual birthday trigger", icon: <Cake className="h-4 w-4" />, category: "contact" },
  { value: "custom_date_reminder", label: "Custom Date Reminder", description: "Trigger on custom date field", icon: <CalendarDays className="h-4 w-4" />, category: "contact" },
  { value: "note_added", label: "Note Added", description: "When a note is added", icon: <StickyNote className="h-4 w-4" />, category: "contact" },
  { value: "note_changed", label: "Note Changed", description: "When a note is updated", icon: <StickyNote className="h-4 w-4" />, category: "contact" },
  
  // Form triggers
  { value: "form_submitted", label: "Form Submitted", description: "When a form is completed", icon: <FileText className="h-4 w-4" />, category: "form" },
  { value: "survey_submitted", label: "Survey Submitted", description: "When a survey is completed", icon: <ClipboardCheck className="h-4 w-4" />, category: "form" },
  { value: "quiz_submitted", label: "Quiz Submitted", description: "When a quiz is completed", icon: <HelpCircle className="h-4 w-4" />, category: "form" },
  { value: "funnel_page_view", label: "Page Viewed", description: "When a funnel page is viewed", icon: <Eye className="h-4 w-4" />, category: "form" },
  { value: "trigger_link_clicked", label: "Trigger Link Clicked", description: "When a tracked link is clicked", icon: <MousePointerClick className="h-4 w-4" />, category: "form" },
  
  // Appointment triggers
  { value: "appointment_booked", label: "Appointment Booked", description: "When an appointment is scheduled", icon: <Calendar className="h-4 w-4" />, category: "appointment" },
  { value: "appointment_rescheduled", label: "Appointment Rescheduled", description: "When rescheduled", icon: <CalendarClock className="h-4 w-4" />, category: "appointment" },
  { value: "appointment_no_show", label: "No Show", description: "When lead misses appointment", icon: <UserX className="h-4 w-4" />, category: "appointment" },
  { value: "appointment_completed", label: "Appointment Completed", description: "When completed", icon: <CalendarCheck className="h-4 w-4" />, category: "appointment" },
  { value: "appointment_canceled", label: "Appointment Canceled", description: "When canceled", icon: <CalendarX className="h-4 w-4" />, category: "appointment" },
  
  // Task triggers
  { value: "task_added", label: "Task Added", description: "When a task is created", icon: <ListPlus className="h-4 w-4" />, category: "task" },
  { value: "task_reminder", label: "Task Reminder", description: "Task due date reminder", icon: <Bell className="h-4 w-4" />, category: "task" },
  { value: "task_completed", label: "Task Completed", description: "When a task is completed", icon: <CheckSquare className="h-4 w-4" />, category: "task" },
  
  // Pipeline triggers
  { value: "stage_changed", label: "Pipeline Stage Changed", description: "When stage changes", icon: <ArrowRightLeft className="h-4 w-4" />, category: "pipeline" },
  { value: "deal_created", label: "Opportunity Created", description: "When a deal is created", icon: <Briefcase className="h-4 w-4" />, category: "pipeline" },
  { value: "deal_won", label: "Deal Won", description: "When marked as won", icon: <Trophy className="h-4 w-4" />, category: "pipeline" },
  { value: "deal_lost", label: "Deal Lost", description: "When marked as lost", icon: <XCircle className="h-4 w-4" />, category: "pipeline" },
  { value: "opportunity_changed", label: "Opportunity Changed", description: "When details change", icon: <RefreshCw className="h-4 w-4" />, category: "pipeline" },
  { value: "stale_opportunity", label: "Stale Opportunity", description: "No activity threshold", icon: <Clock className="h-4 w-4" />, category: "pipeline" },
  
  // Payment triggers
  { value: "payment_received", label: "Payment Received", description: "When payment is successful", icon: <DollarSign className="h-4 w-4" />, category: "payment" },
  { value: "payment_failed", label: "Payment Failed", description: "When payment fails", icon: <AlertCircle className="h-4 w-4" />, category: "payment" },
  { value: "invoice_created", label: "Invoice Created", description: "When invoice is created", icon: <FileText className="h-4 w-4" />, category: "payment" },
  { value: "invoice_sent", label: "Invoice Sent", description: "When invoice is sent", icon: <Send className="h-4 w-4" />, category: "payment" },
  { value: "invoice_paid", label: "Invoice Paid", description: "When invoice is paid", icon: <CheckSquare className="h-4 w-4" />, category: "payment" },
  { value: "invoice_overdue", label: "Invoice Overdue", description: "When invoice is overdue", icon: <AlertTriangle className="h-4 w-4" />, category: "payment" },
  { value: "subscription_created", label: "Subscription Created", description: "When subscription starts", icon: <Repeat className="h-4 w-4" />, category: "payment" },
  { value: "subscription_cancelled", label: "Subscription Cancelled", description: "When cancelled", icon: <XCircle className="h-4 w-4" />, category: "payment" },
  { value: "subscription_renewed", label: "Subscription Renewed", description: "When renewed", icon: <RefreshCw className="h-4 w-4" />, category: "payment" },
  { value: "refund_issued", label: "Refund Issued", description: "When refund is processed", icon: <RotateCcw className="h-4 w-4" />, category: "payment" },
  { value: "order_submitted", label: "Order Submitted", description: "When order is placed", icon: <ShoppingCart className="h-4 w-4" />, category: "payment" },
  
  // Messaging triggers
  { value: "customer_replied", label: "Customer Replied", description: "When customer sends a message", icon: <MessageCircle className="h-4 w-4" />, category: "messaging" },
  { value: "email_opened", label: "Email Opened", description: "When email is opened", icon: <MailOpen className="h-4 w-4" />, category: "messaging" },
  { value: "email_bounced", label: "Email Bounced", description: "When email bounces", icon: <MailX className="h-4 w-4" />, category: "messaging" },
  { value: "messaging_error", label: "Messaging Error", description: "When delivery fails", icon: <AlertOctagon className="h-4 w-4" />, category: "messaging" },
  { value: "call_status", label: "Call Status", description: "When call status changes", icon: <Phone className="h-4 w-4" />, category: "messaging" },
  { value: "new_review_received", label: "New Review Received", description: "When a review is received", icon: <Star className="h-4 w-4" />, category: "messaging" },
  
  // Integration triggers
  { value: "webhook_received", label: "Inbound Webhook", description: "When external webhook is received", icon: <Webhook className="h-4 w-4" />, category: "integration" },
  { value: "manual_trigger", label: "Manual Trigger", description: "Triggered manually by user", icon: <Play className="h-4 w-4" />, category: "integration" },
  { value: "scheduled_trigger", label: "Scheduled", description: "Runs on a schedule", icon: <Clock className="h-4 w-4" />, category: "integration" },
  { value: "facebook_lead_form", label: "Facebook Lead Form", description: "When FB form is submitted", icon: <FileText className="h-4 w-4" />, category: "integration" },
  { value: "tiktok_form_submitted", label: "TikTok Form", description: "When TikTok form is submitted", icon: <Music className="h-4 w-4" />, category: "integration" },
  { value: "google_lead_form", label: "Google Lead Form", description: "When Google form is submitted", icon: <Search className="h-4 w-4" />, category: "integration" },
  { value: "typeform_response", label: "Typeform Response", description: "When a Typeform is submitted", icon: <FileText className="h-4 w-4" />, category: "integration" },
  { value: "fathom_summary_received", label: "Fathom Summary", description: "When a call summary is received", icon: <Mic className="h-4 w-4" />, category: "integration" },
];

const CATEGORY_LABELS: Record<TriggerCategory, string> = {
  contact: "Contact",
  form: "Forms & Funnels",
  appointment: "Appointments",
  task: "Tasks",
  pipeline: "Pipeline",
  payment: "Payments",
  messaging: "Messaging",
  integration: "Integrations",
};

const CATEGORY_ORDER: TriggerCategory[] = [
  'contact', 'form', 'appointment', 'task', 'pipeline', 'payment', 'messaging', 'integration'
];

// Group options by category
const TRIGGER_CATEGORIES = CATEGORY_ORDER.reduce((acc, category) => {
  acc[category] = TRIGGER_OPTIONS.filter(opt => opt.category === category);
  return acc;
}, {} as Record<TriggerCategory, TriggerOption[]>);

export function TriggerInspector({ trigger, onChange }: TriggerInspectorProps) {
  const handleTypeChange = (type: TriggerType) => {
    onChange({ type, config: {} });
  };

  const handleConfigChange = (key: string, value: any) => {
    onChange({ ...trigger, config: { ...trigger.config, [key]: value } });
  };

  const selectedOption = TRIGGER_OPTIONS.find(opt => opt.value === trigger.type);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-foreground/70">Trigger Type</Label>
        <Select value={trigger.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="bg-background border-border text-foreground">
            <SelectValue>
              {selectedOption && (
                <div className="flex items-center gap-2">
                  {selectedOption.icon}
                  <span>{selectedOption.label}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <ScrollArea className="h-80">
              {CATEGORY_ORDER.map((category) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0 bg-background">
                    {CATEGORY_LABELS[category]}
                  </div>
                  {TRIGGER_CATEGORIES[category]?.map((opt) => {
                    const isFunctional = FUNCTIONAL_TRIGGERS.has(opt.value);
                    return (
                      <SelectItem 
                        key={opt.value} 
                        value={opt.value} 
                        className={isFunctional ? "text-foreground hover:bg-muted focus:bg-muted focus:text-foreground" : "text-muted-foreground hover:bg-muted/50 focus:bg-muted/50 focus:text-muted-foreground cursor-not-allowed"}
                        disabled={!isFunctional}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {opt.icon}
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span>{opt.label}</span>
                              {!isFunctional && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 shrink-0">
                                  Coming soon
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </div>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-border" />

      {/* Tag triggers */}
      {(trigger.type === "lead_tag_added" || trigger.type === "lead_tag_removed") && (
        <div className="space-y-2">
          <Label className="text-foreground/70">Tag Name</Label>
          <Input
            value={trigger.config?.tag || ""}
            onChange={(e) => handleConfigChange("tag", e.target.value)}
            placeholder="e.g., hot-lead"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      {/* Contact changed trigger */}
      {trigger.type === "contact_changed" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/70">Field (Optional)</Label>
            <Input
              value={trigger.config?.field || ""}
              onChange={(e) => handleConfigChange("field", e.target.value)}
              placeholder="Any field"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Leave empty to trigger on any field change</p>
          </div>
        </div>
      )}

      {/* Date reminder triggers */}
      {(trigger.type === "birthday_reminder" || trigger.type === "custom_date_reminder") && (
        <div className="space-y-4">
          {trigger.type === "custom_date_reminder" && (
            <div className="space-y-2">
              <Label className="text-foreground/70">Date Field</Label>
              <Input
                value={trigger.config?.field || ""}
                onChange={(e) => handleConfigChange("field", e.target.value)}
                placeholder="e.g., anniversary_date"
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground/70">Days Before</Label>
              <Input
                type="number"
                min={0}
                value={trigger.config?.daysBefore || 0}
                onChange={(e) => handleConfigChange("daysBefore", parseInt(e.target.value))}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/70">Time</Label>
              <Input
                type="time"
                value={trigger.config?.time || "09:00"}
                onChange={(e) => handleConfigChange("time", e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Form submitted trigger */}
      {(trigger.type === "form_submitted" || trigger.type === "survey_submitted" || trigger.type === "quiz_submitted") && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/70">Funnel (Optional)</Label>
            <Input
              value={trigger.config?.funnelId || ""}
              onChange={(e) => handleConfigChange("funnelId", e.target.value)}
              placeholder="Any funnel"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Leave empty to trigger on any submission</p>
          </div>
        </div>
      )}

      {/* Stage changed trigger */}
      {trigger.type === "stage_changed" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/70">Pipeline (Optional)</Label>
            <Input
              value={trigger.config?.pipelineId || ""}
              onChange={(e) => handleConfigChange("pipelineId", e.target.value)}
              placeholder="Any pipeline"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/70">From Stage (Optional)</Label>
            <Input
              value={trigger.config?.fromStage || ""}
              onChange={(e) => handleConfigChange("fromStage", e.target.value)}
              placeholder="Any stage"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/70">To Stage (Optional)</Label>
            <Input
              value={trigger.config?.toStage || ""}
              onChange={(e) => handleConfigChange("toStage", e.target.value)}
              placeholder="Any stage"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      {/* Appointment triggers - Calendar & Event Type constraints */}
      {(trigger.type === "appointment_booked" || 
        trigger.type === "appointment_rescheduled" || 
        trigger.type === "appointment_no_show" || 
        trigger.type === "appointment_completed" ||
        trigger.type === "appointment_canceled") && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/70">Calendar (Optional)</Label>
            <Input
              value={trigger.config?.calendarId || ""}
              onChange={(e) => handleConfigChange("calendarId", e.target.value)}
              placeholder="Any calendar"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Leave empty to trigger for any calendar</p>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/70">Event Type (Optional)</Label>
            <Input
              value={trigger.config?.eventTypeName || ""}
              onChange={(e) => handleConfigChange("eventTypeName", e.target.value)}
              placeholder="Any event type"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">e.g., "Discovery Call", "Strategy Session"</p>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/70">Closer (Optional)</Label>
            <Input
              value={trigger.config?.closerId || ""}
              onChange={(e) => handleConfigChange("closerId", e.target.value)}
              placeholder="Any closer"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Filter by assigned closer</p>
          </div>
        </div>
      )}

      {/* Stale opportunity trigger */}
      {trigger.type === "stale_opportunity" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/70">Days Without Activity</Label>
            <Input
              type="number"
              min={1}
              value={trigger.config?.staleDays || 7}
              onChange={(e) => handleConfigChange("staleDays", parseInt(e.target.value))}
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">Trigger when no activity for this many days</p>
          </div>
        </div>
      )}

      {/* Webhook trigger */}
      {trigger.type === "webhook_received" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/70">Webhook URL</Label>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <code className="text-xs text-primary break-all">
                {`https://your-project.supabase.co/functions/v1/webhook-trigger/${trigger.config?.webhookId || 'YOUR_WEBHOOK_ID'}`}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">Send POST requests to this URL to trigger this automation</p>
          </div>
        </div>
      )}

      {/* Scheduled trigger */}
      {trigger.type === "scheduled_trigger" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/70">Schedule</Label>
            <Select 
              value={trigger.config?.schedule || "daily"} 
              onValueChange={(v) => handleConfigChange("schedule", v)}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="daily" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Daily</SelectItem>
                <SelectItem value="weekly" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Weekly</SelectItem>
                <SelectItem value="monthly" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/70">Time</Label>
            <Input
              type="time"
              value={trigger.config?.time || "09:00"}
              onChange={(e) => handleConfigChange("time", e.target.value)}
              className="bg-background border-border text-foreground"
            />
          </div>
          {trigger.config?.schedule === "weekly" && (
            <div className="space-y-2">
              <Label className="text-foreground/70">Day of Week</Label>
              <Select 
                value={String(trigger.config?.dayOfWeek || 1)} 
                onValueChange={(v) => handleConfigChange("dayOfWeek", parseInt(v))}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="0" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Sunday</SelectItem>
                  <SelectItem value="1" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Monday</SelectItem>
                  <SelectItem value="2" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Tuesday</SelectItem>
                  <SelectItem value="3" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Wednesday</SelectItem>
                  <SelectItem value="4" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Thursday</SelectItem>
                  <SelectItem value="5" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Friday</SelectItem>
                  <SelectItem value="6" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Payment triggers - show payment type filter */}
      {(trigger.type === "payment_received" || trigger.type === "payment_failed") && (
        <div className="space-y-2">
          <Label className="text-foreground/70">Payment Type (Optional)</Label>
          <Select 
            value={trigger.config?.paymentType || "any"} 
            onValueChange={(v) => handleConfigChange("paymentType", v === "any" ? undefined : v)}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Any payment" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="any" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Any Payment</SelectItem>
              <SelectItem value="subscription" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Subscription</SelectItem>
              <SelectItem value="one_time" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">One-Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Messaging error trigger */}
      {trigger.type === "messaging_error" && (
        <div className="space-y-2">
          <Label className="text-foreground/70">Channel (Optional)</Label>
          <Select 
            value={trigger.config?.channel || "any"} 
            onValueChange={(v) => handleConfigChange("channel", v === "any" ? undefined : v)}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Any channel" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="any" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Any Channel</SelectItem>
              <SelectItem value="sms" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">SMS</SelectItem>
              <SelectItem value="email" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Email</SelectItem>
              <SelectItem value="whatsapp" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Customer replied trigger */}
      {trigger.type === "customer_replied" && (
        <div className="space-y-2">
          <Label className="text-foreground/70">Channel (Optional)</Label>
          <Select 
            value={trigger.config?.channel || "any"} 
            onValueChange={(v) => handleConfigChange("channel", v === "any" ? undefined : v)}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Any channel" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="any" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Any Channel</SelectItem>
              <SelectItem value="sms" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">SMS</SelectItem>
              <SelectItem value="email" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Email</SelectItem>
              <SelectItem value="whatsapp" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">WhatsApp</SelectItem>
              <SelectItem value="facebook" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Facebook Messenger</SelectItem>
              <SelectItem value="instagram" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Instagram DM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
