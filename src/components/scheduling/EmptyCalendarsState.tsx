// src/components/scheduling/EmptyCalendarsState.tsx
// Empty state for when user has no calendars

import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyCalendarsStateProps {
  onCreateClick: () => void;
}

export default function EmptyCalendarsState({ onCreateClick }: EmptyCalendarsStateProps) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Create Your First Calendar
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Calendars let people book time with you. Set your availability, choose a meeting
          type, and share your booking link.
        </p>
        <Button onClick={onCreateClick} size="lg">
          Create Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
