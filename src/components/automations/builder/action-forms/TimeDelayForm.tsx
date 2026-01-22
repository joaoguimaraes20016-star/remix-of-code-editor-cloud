import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Building2 } from "lucide-react";

interface TimeDelayConfig {
  duration: number;
  unit: "minutes" | "hours" | "days";
  onlyDuringBusinessHours?: boolean;
  skipWeekends?: boolean;
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
    
    let text = `Wait ${duration} ${unitLabel}`;
    if (config.onlyDuringBusinessHours) {
      text += " (business hours only)";
    }
    if (config.skipWeekends) {
      text += " (skipping weekends)";
    }
    return text;
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

      {/* Business Hours Option */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label className="text-sm">Only during business hours</Label>
              <p className="text-xs text-muted-foreground">
                Resume only when business hours are active
              </p>
            </div>
          </div>
          <Switch
            checked={config.onlyDuringBusinessHours ?? false}
            onCheckedChange={(checked) => 
              onChange({ ...config, onlyDuringBusinessHours: checked })
            }
          />
        </div>

        {config.unit === "days" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm">Skip weekends</Label>
                <p className="text-xs text-muted-foreground">
                  Only count business days
                </p>
              </div>
            </div>
            <Switch
              checked={config.skipWeekends ?? false}
              onCheckedChange={(checked) => 
                onChange({ ...config, skipWeekends: checked })
              }
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{getPreviewText()}</span>
      </div>
    </div>
  );
}