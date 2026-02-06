// src/components/scheduling/BookingCalendar.tsx
// Reusable calendar date picker that shows available/unavailable dates

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { addDays, format, isBefore, startOfDay } from "date-fns";

interface BookingCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  maxAdvanceDays?: number;
  accentColor?: string;
}

export default function BookingCalendar({
  selectedDate,
  onDateSelect,
  maxAdvanceDays = 60,
  accentColor = "#3B82F6",
}: BookingCalendarProps) {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, maxAdvanceDays);

  return (
    <div className="flex justify-center">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateSelect(date)}
        disabled={(date) => isBefore(date, today) || date > maxDate}
        className="rounded-xl border shadow-sm"
        modifiersStyles={{
          selected: {
            backgroundColor: accentColor,
            color: "white",
          },
        }}
      />
    </div>
  );
}
