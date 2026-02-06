// src/components/scheduling/TimeSlotPicker.tsx
// Displays available time slots for a selected date

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/hooks/useBookingSlots";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime?: string;
  onTimeSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
  accentColor?: string;
}

export default function TimeSlotPicker({
  slots,
  selectedTime,
  onTimeSelect,
  isLoading,
  accentColor = "#3B82F6",
}: TimeSlotPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No available times for this date.</p>
        <p className="text-xs mt-1">Try selecting a different date.</p>
      </div>
    );
  }

  // Convert 24h time to 12h display
  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[320px] overflow-y-auto pr-1">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.utc;
        return (
          <Button
            key={slot.utc}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-10 text-sm font-medium transition-all",
              isSelected && "ring-2 ring-offset-2"
            )}
            style={
              isSelected
                ? { backgroundColor: accentColor, borderColor: accentColor, ringColor: accentColor }
                : undefined
            }
            onClick={() => onTimeSelect(slot)}
          >
            {formatTime(slot.time)}
          </Button>
        );
      })}
    </div>
  );
}
