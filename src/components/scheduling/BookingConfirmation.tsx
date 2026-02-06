// src/components/scheduling/BookingConfirmation.tsx
// Success screen shown after a booking is confirmed

import { CheckCircle2, Calendar, Clock, Video, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface BookingConfirmationProps {
  eventTypeName: string;
  startTime: string; // ISO UTC
  durationMinutes: number;
  hostName?: string | null;
  meetingLink?: string | null;
  rescheduleUrl?: string;
  cancelUrl?: string;
  timezone: string;
  accentColor?: string;
}

export default function BookingConfirmation({
  eventTypeName,
  startTime,
  durationMinutes,
  hostName,
  meetingLink,
  rescheduleUrl,
  cancelUrl,
  timezone,
  accentColor = "#3B82F6",
}: BookingConfirmationProps) {
  const startDate = new Date(startTime);

  // Format in the user's timezone
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  // Generate Google Calendar add link
  const googleCalendarUrl = (() => {
    const startStr = startDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const endStr = endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: eventTypeName,
      dates: `${startStr}/${endStr}`,
      details: meetingLink ? `Meeting link: ${meetingLink}` : "",
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  })();

  return (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: accentColor + "15" }}
        >
          <CheckCircle2
            className="h-8 w-8"
            style={{ color: accentColor }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">You're Booked!</h2>
        <p className="text-muted-foreground mt-1">
          A confirmation has been sent to your email.
        </p>
      </div>

      {/* Booking Details */}
      <Card className="text-left">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-foreground">{eventTypeName}</h3>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{dateFormatter.format(startDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {timeFormatter.format(startDate)} - {timeFormatter.format(endDate)} ({durationMinutes} min)
            </span>
          </div>

          {hostName && (
            <div className="text-sm text-muted-foreground">
              Host: <span className="text-foreground">{hostName}</span>
            </div>
          )}

          {meetingLink && (
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => window.open(meetingLink, "_blank")}
            >
              <Video className="h-4 w-4 mr-2" />
              Join Meeting
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.open(googleCalendarUrl, "_blank")}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Add to Google Calendar
        </Button>
      </div>

      {(rescheduleUrl || cancelUrl) && (
        <div className="flex items-center justify-center gap-4 text-sm">
          {rescheduleUrl && (
            <button
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              onClick={() => window.open(rescheduleUrl, "_self")}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reschedule
            </button>
          )}
          {cancelUrl && (
            <button
              className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              onClick={() => window.open(cancelUrl, "_self")}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
