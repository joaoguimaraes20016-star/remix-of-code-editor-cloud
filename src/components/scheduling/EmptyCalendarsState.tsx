// src/components/scheduling/EmptyCalendarsState.tsx
// Empty state for when user has no calendars -- leads to the guided wizard

import { Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyCalendarsStateProps {
  onCreateClick: () => void;
}

export default function EmptyCalendarsState({ onCreateClick }: EmptyCalendarsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Calendar className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Create your first event
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Set up a booking calendar in under a minute. We'll walk you through it step by step.
      </p>
      <Button size="lg" onClick={onCreateClick}>
        <Sparkles className="h-4 w-4 mr-2" />
        Get Started
      </Button>
    </div>
  );
}
