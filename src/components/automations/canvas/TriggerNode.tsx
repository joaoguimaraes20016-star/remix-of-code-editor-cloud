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
            "bg-gradient-to-br from-[#1a1a2e] to-[#16162a]",
            isSelected
              ? "border-primary ring-2 ring-primary/30"
              : "border-white/10 hover:border-white/20"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <div className={cn("p-2 rounded-lg", selectedOption?.bgColor || "bg-primary/20")}>
              <Zap className={cn("h-5 w-5", selectedOption?.color || "text-primary")} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs text-white/50 uppercase tracking-wide">Trigger</div>
              <div className="text-white font-medium flex items-center gap-2">
                {selectedOption?.label || "Select trigger"}
                <ChevronDown className="h-4 w-4 text-white/40" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-center gap-2">
              {selectedOption?.icon}
              <span className="text-sm text-white/60">{selectedOption?.description}</span>
            </div>
          </div>
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-4 bg-[#1a1a2e] border-white/10"
        align="center"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Trigger Type</Label>
            <Select value={trigger.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                {TRIGGER_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
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
              <Label className="text-white/70">Tag Name</Label>
              <Input
                placeholder="e.g., hot-lead"
                value={trigger.config?.tag || ""}
                onChange={(e) => handleConfigChange("tag", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          )}

          {trigger.type === "time_delay" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/70">Delay</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="5"
                  value={trigger.config?.delay || ""}
                  onChange={(e) => handleConfigChange("delay", e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Unit</Label>
                <Select
                  value={trigger.config?.unit || "minutes"}
                  onValueChange={(value) => handleConfigChange("unit", value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="minutes" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
                      Minutes
                    </SelectItem>
                    <SelectItem value="hours" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
                      Hours
                    </SelectItem>
                    <SelectItem value="days" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
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
