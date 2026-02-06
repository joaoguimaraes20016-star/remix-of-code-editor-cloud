// src/components/scheduling/AvailabilitySettings.tsx
// Weekly availability grid with time pickers, timezone selector, and date overrides

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Clock, Plus, Trash2, CalendarOff, CalendarCheck, Link2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAvailabilitySchedules,
  useUpdateAvailability,
  useAvailabilityOverrides,
  useCreateOverride,
  useDeleteOverride,
  DAY_NAMES,
} from "@/hooks/useAvailability";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function AvailabilitySettings() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const [overrideDate, setOverrideDate] = useState<Date | undefined>();
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideAvailable, setOverrideAvailable] = useState(false);
  const [overrideStart, setOverrideStart] = useState("09:00");
  const [overrideEnd, setOverrideEnd] = useState("17:00");
  const [overrideReason, setOverrideReason] = useState("");
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null);
  const [gcalConnecting, setGcalConnecting] = useState(false);
  const [busyCalendars, setBusyCalendars] = useState<string[]>([]);

  const { data: schedules, isLoading: schedulesLoading } = useAvailabilitySchedules(teamId, true); // teamWide = true
  const { data: overrides, isLoading: overridesLoading } = useAvailabilityOverrides(teamId, true); // teamWide = true
  const updateAvailability = useUpdateAvailability(teamId, true); // teamWide = true
  const createOverride = useCreateOverride(teamId, true); // teamWide = true
  const deleteOverride = useDeleteOverride(teamId);

  // Check Google Calendar connection status
  useEffect(() => {
    if (!teamId || !user?.id) return;

    const checkGcalConnection = async () => {
      const { data } = await supabase
        .from("google_calendar_connections")
        .select("sync_enabled, busy_calendars")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      setGcalConnected(!!data && data.sync_enabled);
      setBusyCalendars(data?.busy_calendars || ["primary"]);
    };

    checkGcalConnection();
  }, [teamId, user?.id]);

  const handleToggleDay = (schedule: any) => {
    updateAvailability.mutate({
      id: schedule.id,
      is_available: !schedule.is_available,
    });
  };

  const handleTimeChange = (schedule: any, field: "start_time" | "end_time", value: string) => {
    updateAvailability.mutate({
      id: schedule.id,
      [field]: value,
    });
  };

  const handleTimezoneChange = (timezone: string) => {
    if (!schedules) return;
    // Update all schedules with new timezone
    schedules.forEach((s) => {
      updateAvailability.mutate({ id: s.id, timezone });
    });
  };

  const handleAddOverride = () => {
    if (!overrideDate || !teamId) return;

    createOverride.mutate({
      team_id: teamId,
      user_id: null, // Team-wide override
      date: format(overrideDate, "yyyy-MM-dd"),
      is_available: overrideAvailable,
      start_time: overrideAvailable ? overrideStart : null,
      end_time: overrideAvailable ? overrideEnd : null,
      reason: overrideReason || null,
    } as any);

    setOverrideDialogOpen(false);
    setOverrideDate(undefined);
    setOverrideReason("");
  };

  const handleConnectGoogleCalendar = async () => {
    if (!teamId) return;

    // Open popup BEFORE async call (prevents popup blocker)
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "about:blank",
      "google-calendar-oauth",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      toast.error("Please allow popups for this site");
      return;
    }

    // Show loading state in popup
    popup.document.write("<html><head><title>Connecting...</title></head><body style='font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh;'><div>Loading Google Calendar connection...</div></body></html>");

    setGcalConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-connect-feature", {
        body: { teamId, feature: "calendar" },
      });

      if (error || !data?.authUrl) {
        popup.close();
        toast.error("Failed to start Google Calendar connection");
        setGcalConnecting(false);
        return;
      }

      // Navigate popup to OAuth URL
      popup.location.href = data.authUrl;

      if (!popup) {
        toast.error("Please allow popups for this site");
        setGcalConnecting(false);
        return;
      }

      // Listen for OAuth completion
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === "google-oauth-success") {
          window.removeEventListener("message", handleMessage);
          popup.close();
          
          // Create or update google_calendar_connections record
          if (teamId && user?.id) {
            const { data: teamIntegration } = await supabase
              .from("team_integrations")
              .select("config")
              .eq("team_id", teamId)
              .eq("integration_type", "google")
              .single();

            if (teamIntegration?.config) {
              const config = teamIntegration.config as any;
              await supabase
                .from("google_calendar_connections")
                .upsert({
                  team_id: teamId,
                  user_id: user.id,
                  access_token: config.access_token,
                  refresh_token: config.refresh_token,
                  token_expires_at: config.expires_at,
                  sync_enabled: true,
                  busy_calendars: ["primary"],
                }, {
                  onConflict: "team_id,user_id",
                });
            }
          }

          toast.success("Google Calendar connected successfully");
          setGcalConnected(true);
          setGcalConnecting(false);
          // Refresh connection status
          setTimeout(() => {
            const checkGcalConnection = async () => {
              const { data } = await supabase
                .from("google_calendar_connections")
                .select("sync_enabled, busy_calendars")
                .eq("team_id", teamId)
                .eq("user_id", user?.id)
                .single();
              setGcalConnected(!!data && data.sync_enabled);
              setBusyCalendars(data?.busy_calendars || ["primary"]);
            };
            checkGcalConnection();
          }, 1000);
        } else if (event.data?.type === "google-oauth-error") {
          window.removeEventListener("message", handleMessage);
          popup.close();
          toast.error(event.data.error || "Google Calendar connection failed");
          setGcalConnecting(false);
        }
      };

      window.addEventListener("message", handleMessage);

      // Fallback: check if popup closed without message
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          setGcalConnecting(false);
        }
      }, 1000);
    } catch (err: any) {
      toast.error("Failed to connect Google Calendar: " + err.message);
      setGcalConnecting(false);
    }
  };

  const currentTimezone = schedules?.[0]?.timezone || "America/New_York";

  if (schedulesLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Calendar Connection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to automatically block busy times from showing as available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gcalConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Google Calendar Connected</p>
                  <p className="text-xs text-muted-foreground">
                    Busy times from your calendar will automatically block booking slots
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Not Connected</p>
                  <p className="text-xs text-muted-foreground">
                    Connect to automatically block busy times from your Google Calendar
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleConnectGoogleCalendar}
                disabled={gcalConnecting}
              >
                {gcalConnecting ? "Connecting..." : "Connect Google Calendar"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timezone Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timezone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={currentTimezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team Weekly Hours</CardTitle>
          <CardDescription>Set the team's regular working hours for each day of the week. These hours apply to all calendars.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(schedules || [])
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <Switch
                  checked={schedule.is_available}
                  onCheckedChange={() => handleToggleDay(schedule)}
                />
                <span className="w-24 font-medium text-sm">
                  {DAY_NAMES[schedule.day_of_week]}
                </span>

                {schedule.is_available ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={schedule.start_time}
                      onChange={(e) => handleTimeChange(schedule, "start_time", e.target.value)}
                      className="w-32 text-sm"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      type="time"
                      value={schedule.end_time}
                      onChange={(e) => handleTimeChange(schedule, "end_time", e.target.value)}
                      className="w-32 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm flex-1">Unavailable</span>
                )}
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Date Overrides */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Team Date Overrides</CardTitle>
              <CardDescription>Set custom hours or time off for specific dates (applies to all calendars)</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setOverrideDialogOpen(true);
                setOverrideAvailable(false);
                setOverrideStart("09:00");
                setOverrideEnd("17:00");
                setOverrideReason("");
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Override
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {overridesLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !overrides || overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No date overrides set. Add one to block a day off or set custom hours.
            </p>
          ) : (
            <div className="space-y-2">
              {overrides.map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {override.is_available ? (
                      <CalendarCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <CalendarOff className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(override.date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {override.is_available
                          ? `${override.start_time} - ${override.end_time}`
                          : "Day off"}
                        {override.reason && ` — ${override.reason}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteOverride.mutate(override.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Date Override</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Select Date</Label>
              <Calendar
                mode="single"
                selected={overrideDate}
                onSelect={setOverrideDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border mx-auto"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={overrideAvailable}
                onCheckedChange={setOverrideAvailable}
              />
              <Label className="text-sm">
                {overrideAvailable ? "Custom hours" : "Day off (unavailable all day)"}
              </Label>
            </div>

            {overrideAvailable && (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={overrideStart}
                  onChange={(e) => setOverrideStart(e.target.value)}
                  className="w-32"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="time"
                  value={overrideEnd}
                  onChange={(e) => setOverrideEnd(e.target.value)}
                  className="w-32"
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium mb-1 block">Reason (optional)</Label>
              <Input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Doctor's appointment"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOverride} disabled={!overrideDate}>
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
