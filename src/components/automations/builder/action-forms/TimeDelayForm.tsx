import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

interface TimeDelayConfig {
  duration: number;
  unit: "minutes" | "hours" | "days";
}

interface TimeDelayFormProps {
  config: TimeDelayConfig;
  onChange: (config: TimeDelayConfig) => void;
}

export function TimeDelayForm({ config, onChange }: TimeDelayFormProps) {
  const getPreviewText = () => {
    const duration = config.duration || 0;
    const unit = config.unit || "minutes";
    if (duration === 0) return "No delay configured";
    const unitLabel = duration === 1 ? unit.slice(0, -1) : unit;
    return `Wait ${duration} ${unitLabel} before the next step`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            placeholder="5"
            value={config.duration || ""}
            onChange={(e) =>
              onChange({ ...config, duration: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Select
            value={config.unit || "minutes"}
            onValueChange={(value: TimeDelayConfig["unit"]) =>
              onChange({ ...config, unit: value })
            }
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

      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{getPreviewText()}</span>
      </div>
    </div>
  );
}
