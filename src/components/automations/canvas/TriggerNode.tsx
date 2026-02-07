import { useState } from "react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  UserPlus,
  Tag,
  Calendar,
  CalendarX,
  CalendarCheck,
  Clock,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import type { TriggerType, AutomationTrigger } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface TriggerNodeProps {
  trigger: AutomationTrigger;
  onChange: (trigger: AutomationTrigger) => void;
  isSelected: boolean;
  onSelect: () => void;
}

interface TriggerOption {
  value: TriggerType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    value: "lead_created",
    label: "Lead Created",
    description: "When a new lead is added",
    icon: <UserPlus className="h-4 w-4" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  {
    value: "lead_tag_added",
    label: "Lead Tag Added",
    description: "When a tag is added to a lead",
    icon: <Tag className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  {
    value: "appointment_booked",
    label: "Appointment Booked",
    description: "When an appointment is scheduled",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  {
    value: "appointment_rescheduled",
    label: "Appointment Rescheduled",
    description: "When an appointment time changes",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
  {
    value: "appointment_no_show",
    label: "Appointment No Show",
    description: "When lead doesn't show up",
    icon: <CalendarX className="h-4 w-4" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  {
    value: "appointment_completed",
    label: "Appointment Completed",
    description: "When an appointment finishes",
    icon: <CalendarCheck className="h-4 w-4" />,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  {
    value: "payment_received",
    label: "Payment Received",
    description: "When a payment is processed",
    icon: <CreditCard className="h-4 w-4" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  {
    value: "time_delay",
    label: "Time Delay",
    description: "Trigger after a specific delay",
    icon: <Clock className="h-4 w-4" />,
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
  },
];

export function TriggerNode({ trigger, onChange, isSelected, onSelect }: TriggerNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = TRIGGER_OPTIONS.find((opt) => opt.value === trigger.type);

  const handleTypeChange = (newType: TriggerType) => {
    onChange({
      type: newType,
      config: {},
    });
  };

  const handleConfigChange = (key: string, value: string) => {
    onChange({
      ...trigger,
      config: {
        ...trigger.config,
        [key]: value,
      },
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          onClick={onSelect}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative w-80 rounded-xl border transition-all duration-200",
            "bg-background shadow-sm",
            isSelected
              ? "border-primary ring-2 ring-primary/30"
              : "border-border hover:border-border/70"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className={cn("p-2 rounded-lg", selectedOption?.bgColor || "bg-primary/20")}>
              <Zap className={cn("h-5 w-5", selectedOption?.color || "text-primary")} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Trigger</div>
              <div className="text-foreground font-medium flex items-center gap-2">
                {selectedOption?.label || "Select trigger"}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-center gap-2">
              {selectedOption?.icon}
              <span className="text-sm text-muted-foreground">{selectedOption?.description}</span>
            </div>
          </div>
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-4 bg-background border-border"
        align="center"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/70">Trigger Type</Label>
            <Select value={trigger.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {TRIGGER_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <span className={option.color}>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trigger-specific config */}
          {trigger.type === "lead_tag_added" && (
            <div className="space-y-2">
              <Label className="text-foreground/70">Tag Name</Label>
              <Input
                placeholder="e.g., hot-lead"
                value={trigger.config?.tag || ""}
                onChange={(e) => handleConfigChange("tag", e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          {trigger.type === "time_delay" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-foreground/70">Delay</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="5"
                  value={trigger.config?.delay || ""}
                  onChange={(e) => handleConfigChange("delay", e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/70">Unit</Label>
                <Select
                  value={trigger.config?.unit || "minutes"}
                  onValueChange={(value) => handleConfigChange("unit", value)}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="minutes" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">
                      Minutes
                    </SelectItem>
                    <SelectItem value="hours" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">
                      Hours
                    </SelectItem>
                    <SelectItem value="days" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">
                      Days
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
