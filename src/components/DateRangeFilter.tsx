import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

export type DateRangePreset = 
  | "last7days"
  | "last4weeks"
  | "last3months"
  | "last12months"
  | "next7days"
  | "next30days"
  | "alltime"
  | "custom";

interface DateRangeFilterProps {
  onRangeChange: (range: { from: Date | null; to: Date | null; preset: DateRangePreset }) => void;
}

export function DateRangeFilter({ onRangeChange }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>("last7days");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const getPresetRange = (preset: DateRangePreset): { from: Date | null; to: Date | null } => {
    const today = startOfDay(new Date());
    
    switch (preset) {
      case "last7days":
        return { from: subDays(today, 6), to: today };
      case "last4weeks":
        return { from: subWeeks(today, 4), to: today };
      case "last3months":
        return { from: subMonths(today, 3), to: today };
      case "last12months":
        return { from: subMonths(today, 12), to: today };
      case "next7days":
        return { from: today, to: subDays(today, -7) };
      case "next30days":
        return { from: today, to: subDays(today, -30) };
      case "alltime":
        return { from: null, to: null };
      case "custom":
        return { 
          from: customRange?.from || null, 
          to: customRange?.to || null 
        };
      default:
        return { from: subDays(today, 6), to: today };
    }
  };

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    const range = getPresetRange(preset);
    onRangeChange({ ...range, preset });
  };

  const handleCustomRangeChange = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      onRangeChange({ 
        from: startOfDay(range.from), 
        to: startOfDay(range.to), 
        preset: "custom" 
      });
    }
  };

  const getDisplayText = () => {
    if (selectedPreset === "custom" && customRange?.from) {
      if (customRange.to) {
        return `${format(customRange.from, "MMM d, yyyy")} - ${format(customRange.to, "MMM d, yyyy")}`;
      }
      return format(customRange.from, "MMM d, yyyy");
    }
    
    const presetLabels = {
      last7days: "Last 7 Days",
      last4weeks: "Last 4 Weeks",
      last3months: "Last 3 Months",
      last12months: "Last 12 Months",
      next7days: "Next 7 Days",
      next30days: "Next 30 Days",
      alltime: "All Time",
      custom: "Custom Range"
    };
    
    return presetLabels[selectedPreset];
  };

  return (
    <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full sm:w-[180px] bg-card h-8 sm:h-10 text-[11px] sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card">
          <SelectItem value="last7days" className="text-[11px] sm:text-sm">Last 7 Days</SelectItem>
          <SelectItem value="last4weeks" className="text-[11px] sm:text-sm">Last 4 Weeks</SelectItem>
          <SelectItem value="last3months" className="text-[11px] sm:text-sm">Last 3 Months</SelectItem>
          <SelectItem value="last12months" className="text-[11px] sm:text-sm">Last 12 Months</SelectItem>
          <SelectItem value="next7days" className="text-[11px] sm:text-sm">Next 7 Days</SelectItem>
          <SelectItem value="next30days" className="text-[11px] sm:text-sm">Next 30 Days</SelectItem>
          <SelectItem value="alltime" className="text-[11px] sm:text-sm">All Time</SelectItem>
          <SelectItem value="custom" className="text-[11px] sm:text-sm">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {selectedPreset === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal bg-card h-8 sm:h-10 text-[11px] sm:text-sm",
                !customRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {customRange?.from ? (
                customRange.to ? (
                  <>
                    {format(customRange.from, "LLL dd")} -{" "}
                    {format(customRange.to, "LLL dd")}
                  </>
                ) : (
                  format(customRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={customRange?.from}
              selected={customRange}
              onSelect={handleCustomRangeChange}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
