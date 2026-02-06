// src/components/scheduling/CalendarCard.tsx
// Individual calendar card component (clean design, no gradients)

import { Clock, MapPin, Copy, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { EventType } from "@/hooks/useEventTypes";
import { toast } from "sonner";

const LOCATION_LABELS: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  phone: "Phone Call",
  in_person: "In Person",
  custom: "Custom URL",
};

interface CalendarCardProps {
  calendar: EventType;
  teamId: string;
  onEdit: (calendar: EventType) => void;
  onToggleActive: (calendar: EventType) => void;
  onDelete: (calendarId: string) => void;
}

export default function CalendarCard({
  calendar,
  teamId,
  onEdit,
  onToggleActive,
  onDelete,
}: CalendarCardProps) {
  const bookingLink = `${window.location.origin}/book/${teamId}/${calendar.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    toast.success("Calendar link copied to clipboard");
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md border-l-4",
        !calendar.is_active && "opacity-60"
      )}
      style={{ borderLeftColor: calendar.color }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-base text-foreground truncate">
                {calendar.name}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs shrink-0",
                  calendar.is_active
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                )}
              >
                {calendar.is_active ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {calendar.duration_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {LOCATION_LABELS[calendar.location_type] || calendar.location_type}
              </span>
            </div>

            {/* Booking Link */}
            <div className="flex items-center gap-2 mt-2">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground truncate flex-1">
                {bookingLink}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={copyLink}
                title="Copy link"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Right side - Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(calendar)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(calendar)}>
                {calendar.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(calendar.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
