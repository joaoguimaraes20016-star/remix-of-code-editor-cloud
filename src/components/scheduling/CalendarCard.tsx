// src/components/scheduling/CalendarCard.tsx
// Individual calendar card component (clean design, no gradients)

import { useState } from "react";
import { Clock, MapPin, Copy, MoreHorizontal, CheckCircle2, XCircle, ExternalLink, Code, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  bookingSlug?: string | null;
  onEdit: (calendar: EventType) => void;
  onToggleActive: (calendar: EventType) => void;
  onDelete: (calendarId: string) => void;
}

export default function CalendarCard({
  calendar,
  teamId,
  bookingSlug,
  onEdit,
  onToggleActive,
  onDelete,
}: CalendarCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const teamSlugOrId = bookingSlug || teamId;
  const bookingLink = `${window.location.origin}/book/${teamSlugOrId}/${calendar.slug}`;

  const embedCode = `<iframe src="${bookingLink}" width="100%" height="700" frameborder="0" style="border:none; border-radius:8px;"></iframe>`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingLink)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    toast.success("Calendar link copied to clipboard");
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard");
  };

  const openTestBooking = () => {
    window.open(bookingLink, "_blank", "noopener,noreferrer");
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
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={openTestBooking}
                title="Test booking page"
              >
                <ExternalLink className="h-3.5 w-3.5" />
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
              <DropdownMenuItem onClick={openTestBooking}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Booking
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyEmbed}>
                <Code className="h-4 w-4 mr-2" />
                Copy Embed Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                Share / QR Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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

      {/* Share / QR Code Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {calendar.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <img
                src={qrCodeUrl}
                alt="QR Code for booking link"
                className="rounded-lg border p-2"
                width={200}
                height={200}
              />
            </div>

            {/* Booking Link */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Booking Link</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-3 py-2 rounded font-mono text-foreground flex-1 break-all">
                  {bookingLink}
                </code>
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              </div>
            </div>

            {/* Embed Code */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Embed Code</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-3 py-2 rounded font-mono text-foreground flex-1 break-all max-h-20 overflow-auto">
                  {embedCode}
                </code>
                <Button variant="outline" size="sm" onClick={copyEmbed}>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              </div>
            </div>

            {/* Test Button */}
            <Button onClick={openTestBooking} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Booking Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
