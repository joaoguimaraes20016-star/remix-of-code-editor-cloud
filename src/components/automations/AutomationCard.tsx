import { motion } from "framer-motion";
import { 
  Pencil, Copy, Trash2, MoreHorizontal, Play,
  Calendar, UserPlus, Bell, Tag, Zap, Webhook,
  ArrowRightLeft, Trophy, XCircle, DollarSign, Clock,
  CalendarClock, UserX, CalendarCheck, CalendarX, FileText
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TriggerType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface AutomationCardProps {
  id?: string;
  name: string;
  description?: string | null;
  triggerType: TriggerType;
  isActive: boolean;
  stepsCount: number;
  lastRun?: string | null;
  onToggle: (isActive: boolean) => void;
  onEdit: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  extraActions?: React.ReactNode;
}

const TRIGGER_ICONS: Partial<Record<TriggerType, React.ReactNode>> = {
  lead_created: <UserPlus className="h-4 w-4" />,
  lead_tag_added: <Tag className="h-4 w-4" />,
  lead_tag_removed: <Tag className="h-4 w-4" />,
  form_submitted: <FileText className="h-4 w-4" />,
  appointment_booked: <Calendar className="h-4 w-4" />,
  appointment_rescheduled: <CalendarClock className="h-4 w-4" />,
  appointment_no_show: <UserX className="h-4 w-4" />,
  appointment_completed: <CalendarCheck className="h-4 w-4" />,
  appointment_canceled: <CalendarX className="h-4 w-4" />,
  stage_changed: <ArrowRightLeft className="h-4 w-4" />,
  deal_won: <Trophy className="h-4 w-4" />,
  deal_lost: <XCircle className="h-4 w-4" />,
  payment_received: <DollarSign className="h-4 w-4" />,
  webhook_received: <Webhook className="h-4 w-4" />,
  manual_trigger: <Play className="h-4 w-4" />,
  scheduled_trigger: <Clock className="h-4 w-4" />,
};

const TRIGGER_LABELS: Partial<Record<TriggerType, string>> = {
  lead_created: "Lead Created",
  lead_tag_added: "Tag Added",
  lead_tag_removed: "Tag Removed",
  form_submitted: "Form Submitted",
  appointment_booked: "Appointment Booked",
  appointment_rescheduled: "Rescheduled",
  appointment_no_show: "No Show",
  appointment_completed: "Completed",
  appointment_canceled: "Canceled",
  stage_changed: "Stage Changed",
  deal_won: "Deal Won",
  deal_lost: "Deal Lost",
  payment_received: "Payment Received",
  webhook_received: "Webhook",
  manual_trigger: "Manual",
  scheduled_trigger: "Scheduled",
};

export function AutomationCard({
  name,
  description,
  triggerType,
  isActive,
  stepsCount,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
  extraActions,
}: AutomationCardProps) {
  const icon = TRIGGER_ICONS[triggerType] || <Zap className="h-4 w-4" />;
  const label = TRIGGER_LABELS[triggerType] || triggerType;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-all cursor-pointer",
        "hover:shadow-lg hover:border-primary/30",
        !isActive && "opacity-60"
      )}
      onClick={onEdit}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground truncate">{name}</h3>
            {description && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {extraActions}
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-primary"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
          isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {label}
        </span>
        <span className="text-muted-foreground/60">•</span>
        <span>{stepsCount} step{stepsCount !== 1 ? "s" : ""}</span>
      </div>
    </motion.div>
  );
}
