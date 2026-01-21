import { motion } from "framer-motion";
import { 
  Pencil, Copy, Trash2, MoreHorizontal, Play,
  Calendar, UserPlus, Bell, Tag, Zap, Webhook,
  ArrowRightLeft, Trophy, XCircle, DollarSign, Clock,
  CalendarClock, UserX, CalendarCheck, CalendarX, FileText,
  FolderInput, Folder, Check
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import type { TriggerType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface AutomationFolder {
  id: string;
  name: string;
  color: string;
}

interface AutomationCardProps {
  id?: string;
  name: string;
  description?: string | null;
  triggerType: TriggerType;
  isActive: boolean;
  stepsCount: number;
  lastRun?: string | null;
  folderId?: string | null;
  folders?: AutomationFolder[];
  onToggle: (isActive: boolean) => void;
  onEdit: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMoveToFolder?: (folderId: string | null) => void;
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
  folderId,
  folders = [],
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
  onMoveToFolder,
}: AutomationCardProps) {
  const icon = TRIGGER_ICONS[triggerType] || <Zap className="h-4 w-4" />;
  const label = TRIGGER_LABELS[triggerType] || triggerType;
  const isLoose = !folderId;
  const currentFolder = folders.find(f => f.id === folderId);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-all cursor-pointer",
        "hover:shadow-lg hover:border-primary/30",
        !isActive && "opacity-60",
        isLoose && "border-dashed border-amber-500/30"
      )}
      onClick={onEdit}
    >
      {/* Loose indicator */}
      {isLoose && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          Inbox
        </div>
      )}

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
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Quick Move Button for loose automations */}
          {isLoose && folders.length > 0 && onMoveToFolder && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                >
                  <FolderInput className="h-3.5 w-3.5" />
                  Add to folder
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => onMoveToFolder(folder.id)}
                  >
                    <div 
                      className="w-3 h-3 rounded mr-2" 
                      style={{ backgroundColor: folder.color }}
                    />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
              {onMoveToFolder && folders.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="h-4 w-4 mr-2" />
                    Move to folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem 
                      onClick={() => onMoveToFolder(null)}
                      disabled={!folderId}
                    >
                      <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                      Inbox (no folder)
                      {!folderId && <Check className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => onMoveToFolder(folder.id)}
                        disabled={folder.id === folderId}
                      >
                        <div 
                          className="w-3 h-3 rounded mr-2" 
                          style={{ backgroundColor: folder.color }}
                        />
                        {folder.name}
                        {folder.id === folderId && <Check className="h-4 w-4 ml-auto" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
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
        {currentFolder && (
          <>
            <span className="text-muted-foreground/60">•</span>
            <span className="inline-flex items-center gap-1 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: currentFolder.color }}
              />
              {currentFolder.name}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
