import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Zap, 
  UserPlus, 
  Tag, 
  Calendar, 
  CalendarX, 
  CalendarCheck, 
  Clock,
  CreditCard 
} from "lucide-react";
import type { TriggerType, AutomationTrigger } from "@/lib/automations/types";

interface TriggerSelectorProps {
  trigger: AutomationTrigger;
  onTriggerChange: (trigger: AutomationTrigger) => void;
}

interface TriggerOption {
  value: TriggerType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    value: "lead_created",
    label: "Lead Created",
    description: "When a new lead is added",
    icon: <UserPlus className="h-4 w-4" />,
    color: "border-l-green-500",
  },
  {
    value: "lead_tag_added",
    label: "Lead Tag Added",
    description: "When a tag is added to a lead",
    icon: <Tag className="h-4 w-4" />,
    color: "border-l-blue-500",
  },
  {
    value: "appointment_booked",
    label: "Appointment Booked",
    description: "When an appointment is scheduled",
    icon: <Calendar className="h-4 w-4" />,
    color: "border-l-purple-500",
  },
  {
    value: "appointment_rescheduled",
    label: "Appointment Rescheduled",
    description: "When an appointment time changes",
    icon: <Calendar className="h-4 w-4" />,
    color: "border-l-orange-500",
  },
  {
    value: "appointment_no_show",
    label: "Appointment No Show",
    description: "When lead doesn't show up",
    icon: <CalendarX className="h-4 w-4" />,
    color: "border-l-red-500",
  },
  {
    value: "appointment_completed",
    label: "Appointment Completed",
    description: "When an appointment finishes",
    icon: <CalendarCheck className="h-4 w-4" />,
    color: "border-l-emerald-500",
  },
  {
    value: "payment_received",
    label: "Payment Received",
    description: "When a payment is processed",
    icon: <CreditCard className="h-4 w-4" />,
    color: "border-l-yellow-500",
  },
  {
    value: "time_delay",
    label: "Time Delay",
    description: "Trigger after a specific delay",
    icon: <Clock className="h-4 w-4" />,
    color: "border-l-gray-500",
  },
];

export function TriggerSelector({ trigger, onTriggerChange }: TriggerSelectorProps) {
  const selectedOption = TRIGGER_OPTIONS.find((opt) => opt.value === trigger.type);

  const handleTypeChange = (newType: TriggerType) => {
    onTriggerChange({
      type: newType,
      config: {},
    });
  };

  const handleConfigChange = (key: string, value: string) => {
    onTriggerChange({
      ...trigger,
      config: {
        ...trigger.config,
        [key]: value,
      },
    });
  };

  return (
    <Card className={`border-l-4 ${selectedOption?.color || "border-l-primary"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span>WHEN THIS HAPPENS</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={trigger.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a trigger" />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon}
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedOption && (
          <p className="text-sm text-muted-foreground">
            {selectedOption.description}
          </p>
        )}

        {/* Trigger-specific config */}
        {trigger.type === "lead_tag_added" && (
          <div className="space-y-2">
            <Label htmlFor="tag">Tag Name</Label>
            <Input
              id="tag"
              placeholder="e.g., hot-lead"
              value={trigger.config?.tag || ""}
              onChange={(e) => handleConfigChange("tag", e.target.value)}
            />
          </div>
        )}

        {trigger.type === "time_delay" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="delay">Delay</Label>
              <Input
                id="delay"
                type="number"
                min={1}
                placeholder="5"
                value={trigger.config?.delay || ""}
                onChange={(e) => handleConfigChange("delay", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={trigger.config?.unit || "minutes"}
                onValueChange={(value) => handleConfigChange("unit", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
