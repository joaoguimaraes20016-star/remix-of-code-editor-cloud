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
import { Button } from "@/components/ui/button";
import { GitBranch, Trash2, Plus, X } from "lucide-react";
import type { AutomationStep, AutomationCondition } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface ConditionNodeProps {
  step: AutomationStep;
  onUpdate: (updates: Partial<AutomationStep>) => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
  teamId: string;
}

const FIELD_OPTIONS = [
  { value: "lead.status", label: "Lead Status" },
  { value: "lead.source", label: "Lead Source" },
  { value: "lead.tags", label: "Lead Tags" },
  { value: "appointment.status", label: "Appointment Status" },
  { value: "appointment.type", label: "Appointment Type" },
];

const OPERATOR_OPTIONS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "gt", label: "greater than" },
  { value: "lt", label: "less than" },
  { value: "in", label: "is one of" },
];

export function ConditionNode({
  step,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
  teamId,
}: ConditionNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const conditions = step.conditions || [];
  const conditionLogic = step.conditionLogic || "AND";

  const handleAddCondition = () => {
    const newCondition: AutomationCondition = {
      field: "lead.status",
      operator: "equals",
      value: "",
    };
    onUpdate({ conditions: [...conditions, newCondition] });
  };

  const handleUpdateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    const updated = conditions.map((c, i) => (i === index ? { ...c, ...updates } : c));
    onUpdate({ conditions: updated });
  };

  const handleRemoveCondition = (index: number) => {
    onUpdate({ conditions: conditions.filter((_, i) => i !== index) });
  };

  const getSummary = () => {
    if (conditions.length === 0) return "No conditions set";
    if (conditions.length === 1) {
      const c = conditions[0];
      return `${c.field} ${c.operator} ${c.value}`;
    }
    const logicLabel = conditionLogic === "OR" ? "ANY" : "ALL";
    return `${logicLabel} of ${conditions.length} conditions`;
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
            "bg-gradient-to-br from-amber-900/30 to-amber-950/30",
            isSelected
              ? "border-amber-400 ring-2 ring-amber-400/30"
              : "border-amber-500/30 hover:border-amber-500/50"
          )}
        >
          {/* Diamond shape indicator */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45 bg-amber-500/20 border border-amber-500/50" />

          <div className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <GitBranch className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-foreground font-medium">If / Else</div>
              <div className="text-sm text-muted-foreground truncate">{getSummary()}</div>
            </div>
          </div>
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[420px] p-4 bg-background border-border"
        align="center"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-foreground">Conditions</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsOpen(false);
              }}
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {conditions.length > 1 && (
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-xs">Match</Label>
              <Select
                value={conditionLogic}
                onValueChange={(value) => onUpdate({ conditionLogic: value as "AND" | "OR" })}
              >
                <SelectTrigger className="w-20 h-7 bg-background border-border text-foreground text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="AND" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground text-xs">ALL</SelectItem>
                  <SelectItem value="OR" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground text-xs">ANY</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">of these conditions</span>
            </div>
          )}

          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      value={condition.field}
                      onValueChange={(v) => handleUpdateCondition(index, { field: v })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {FIELD_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground text-xs"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(v) => handleUpdateCondition(index, { operator: v as any })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {OPERATOR_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground text-xs"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      value={String(condition.value)}
                      onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
                      placeholder="Value"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground text-xs"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCondition(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {conditionLogic === "OR"
              ? "At least one condition must be true for the following actions to run."
              : "All conditions must be true for the following actions to run."}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
