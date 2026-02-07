// src/components/scheduling/ConnectionsSettings.tsx
// Connections tab for scheduling integrations (GoHighLevel style)

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Blocks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ZoomConfig } from "@/components/ZoomConfig";
import { FathomConfig } from "@/components/FathomConfig";

// Brand logos
import zoomLogo from "@/assets/integrations/zoom.svg";
import fathomLogo from "@/assets/integrations/fathom.svg";

// Google logos from official CDN (matching AppsPortal approach)
const googleCalendarLogo = "https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png";
const googleMeetLogo = "https://www.gstatic.com/images/branding/product/1x/meet_2020q4_48dp.png";

export default function ConnectionsSettings() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gcalConnected, setGcalConnected] = useState<boolean>(false);
  const [gcalConnecting, setGcalConnecting] = useState(false);
  const [zoomConnected, setZoomConnected] = useState<boolean>(false);
  const [fathomConnected, setFathomConnected] = useState<boolean>(false);
  const [showZoomConfig, setShowZoomConfig] = useState(false);
  const [showFathomConfig, setShowFathomConfig] = useState(false);

  // Check connection statuses
  useEffect(() => {
    if (!teamId || !user?.id) return;

    const checkConnections = async () => {
      // Google Calendar — per-user table
      const { data: gcalData } = await supabase
        .from("google_calendar_connections" as any)
        .select("sync_enabled")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .maybeSingle() as { data: any; error: any };

      setGcalConnected(!!gcalData && !!gcalData.sync_enabled);

      // Zoom — team_integrations table
      const { data: zoomData } = await supabase
        .from("team_integrations")
        .select("is_connected")
        .eq("team_id", teamId)
        .eq("integration_type", "zoom")
        .maybeSingle();

      setZoomConnected(!!zoomData?.is_connected);

      // Fathom — team_integrations table
      const { data: fathomData } = await supabase
        .from("team_integrations")
        .select("is_connected")
        .eq("team_id", teamId)
        .eq("integration_type", "fathom")
        .maybeSingle();

      setFathomConnected(!!fathomData?.is_connected);
    };

    checkConnections();
  }, [teamId, user?.id]);

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

      // Listen for OAuth completion
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval);
          setGcalConnecting(false);
          // Refresh connection status
          setTimeout(() => {
            (supabase
              .from("google_calendar_connections" as any)
              .select("sync_enabled")
              .eq("team_id", teamId)
              .eq("user_id", user?.id)
              .single() as any)
              .then(({ data }: any) => {
                setGcalConnected(!!data && data.sync_enabled);
                if (data?.sync_enabled) {
                  toast.success("Google Calendar connected successfully");
                }
              });
          }, 1000);
        }
      }, 500);
    } catch (error: any) {
      popup.close();
      toast.error("Failed to connect Google Calendar: " + error.message);
      setGcalConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cross-navigation to Apps Portal */}
      <Alert className="border-muted-foreground/20 bg-muted/30">
        <Blocks className="h-4 w-4" />
        <AlertTitle>Looking for more integrations?</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Browse all available apps including Slack, Discord, Meta, and more in the Apps Portal.
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-4 shrink-0"
            onClick={() => navigate(`/team/${teamId}/apps`)}
          >
            Apps Portal
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </AlertDescription>
      </Alert>

      {/* Your Connections Section */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Your Connections</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your personal accounts to enable scheduling features
        </p>

        <div className="space-y-3">
          {/* Google Calendar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border">
                    <img src={googleCalendarLogo} alt="Google Calendar" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Google Calendar</h3>
                    <p className="text-sm text-muted-foreground">
                      Sync your calendar to block busy times
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {gcalConnected ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Not Connected</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleConnectGoogleCalendar}
                        disabled={gcalConnecting}
                      >
                        {gcalConnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Meet */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border">
                    <img src={googleMeetLogo} alt="Google Meet" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Google Meet</h3>
                    <p className="text-sm text-muted-foreground">
                      Use Google Meet for video calls
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Coming Soon</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Connections Section */}
      <div className="pt-6 border-t">
        <h2 className="text-lg font-semibold mb-2">Team Connections</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Shared integrations for your entire team
        </p>

        <div className="space-y-3">
          {/* Zoom */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border">
                    <img src={zoomLogo} alt="Zoom" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Zoom</h3>
                    <p className="text-sm text-muted-foreground">
                      Auto-generate meeting links for your team
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {zoomConnected ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Not Connected</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowZoomConfig(true)}
                  >
                    {zoomConnected ? "Configure" : "Connect"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fathom */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border">
                    <img src={fathomLogo} alt="Fathom" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Fathom</h3>
                    <p className="text-sm text-muted-foreground">
                      Pull AI call summaries into appointments
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {fathomConnected ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Not Connected</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFathomConfig(true)}
                  >
                    {fathomConnected ? "Configure" : "Connect"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zoom Config Dialog */}
      {showZoomConfig && teamId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Zoom Integration</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowZoomConfig(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ZoomConfig teamId={teamId} onUpdate={() => {
                setShowZoomConfig(false);
                // Refresh Zoom connection status
                supabase
                  .from("team_integrations")
                  .select("is_connected")
                  .eq("team_id", teamId)
                  .eq("integration_type", "zoom")
                  .maybeSingle()
                  .then(({ data }) => setZoomConnected(!!data?.is_connected));
              }} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fathom Config Dialog */}
      {showFathomConfig && teamId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fathom Integration</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFathomConfig(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <FathomConfig teamId={teamId} onUpdate={() => {
                setShowFathomConfig(false);
                // Refresh Fathom connection status
                supabase
                  .from("team_integrations")
                  .select("is_connected")
                  .eq("team_id", teamId)
                  .eq("integration_type", "fathom")
                  .maybeSingle()
                  .then(({ data }) => setFathomConnected(!!data?.is_connected));
              }} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
