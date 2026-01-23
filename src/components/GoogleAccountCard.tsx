import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Check,
  ChevronRight,
  User,
  Mail,
  Unlink,
  Plus,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type GoogleFeature = "sheets" | "calendar" | "drive" | "analytics" | "ads";

interface GoogleFeatureConfig {
  feature: GoogleFeature;
  name: string;
  description: string;
  logo: string;
  available: boolean; // Whether this feature is available to connect
}

const GOOGLE_FEATURES: GoogleFeatureConfig[] = [
  {
    feature: "sheets",
    name: "Google Sheets",
    description: "Sync data with spreadsheets",
    logo: "https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png",
    available: true,
  },
  {
    feature: "calendar",
    name: "Google Calendar",
    description: "Sync appointments and events",
    logo: "https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png",
    available: true,
  },
  {
    feature: "drive",
    name: "Google Drive",
    description: "Access and manage files",
    logo: "https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png",
    available: true,
  },
  {
    feature: "analytics",
    name: "Google Analytics",
    description: "View website analytics",
    logo: "https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg",
    available: false, // Coming soon
  },
  {
    feature: "ads",
    name: "Google Ads",
    description: "Manage ad campaigns",
    logo: "https://www.gstatic.com/images/branding/product/1x/ads_2020q4_48dp.png",
    available: false, // Coming soon
  },
];

const POPUP_LOADING_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Connecting to Google...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #1a1a2e;
      color: #fff;
    }
    .container { text-align: center; }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255,255,255,0.1);
      border-left-color: #4285f4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>Connecting to Google...</p>
  </div>
</body>
</html>`;

interface GoogleAccountCardProps {
  teamId: string;
  isConnected: boolean;
  connectedEmail?: string;
  connectedAt?: string;
  enabledFeatures: Record<string, boolean>;
  onUpdate: () => void;
}

export function GoogleAccountCard({
  teamId,
  isConnected,
  connectedEmail,
  connectedAt,
  enabledFeatures,
  onUpdate,
}: GoogleAccountCardProps) {
  const [connecting, setConnecting] = useState(false);
  const [connectingFeature, setConnectingFeature] = useState<GoogleFeature | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "google-oauth-success") {
        setConnecting(false);
        setConnectingFeature(null);
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        onUpdate();
        toast({
          title: "Google Connected",
          description: event.data.email
            ? `Connected as ${event.data.email}`
            : "Your Google account is now connected.",
        });
      } else if (event.data?.type === "google-oauth-error") {
        setConnecting(false);
        setConnectingFeature(null);
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        toast({
          title: "Connection Failed",
          description: event.data.error || "Failed to connect",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onUpdate, toast]);

  // Fallback polling for popup close detection
  useEffect(() => {
    if (connecting && !pollTimerRef.current) {
      pollTimerRef.current = window.setInterval(async () => {
        if (popupRef.current?.closed) {
          // Check if connection succeeded
          const { data } = await supabase
            .from("team_integrations_public" as any)
            .select("is_connected, config_safe")
            .eq("team_id", teamId)
            .eq("integration_type", "google")
            .maybeSingle();

          const result = data as unknown as {
            is_connected: boolean;
            config_safe: { email?: string; enabled_features?: Record<string, boolean> } | null;
          } | null;

          if (result?.is_connected) {
            setConnecting(false);
            setConnectingFeature(null);
            clearInterval(pollTimerRef.current!);
            pollTimerRef.current = null;
            onUpdate();
            toast({
              title: "Google Connected",
              description: result.config_safe?.email
                ? `Connected as ${result.config_safe.email}`
                : "Your Google account is now connected.",
            });
          } else {
            setConnecting(false);
            setConnectingFeature(null);
            clearInterval(pollTimerRef.current!);
            pollTimerRef.current = null;
          }
        }
      }, 1000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [connecting, teamId, onUpdate, toast]);

  // Watchdog timeout
  useEffect(() => {
    if (connecting) {
      const timeout = setTimeout(() => {
        if (connecting) {
          setConnecting(false);
          setConnectingFeature(null);
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          toast({
            title: "Connection Timeout",
            description: "The connection process timed out. Please try again.",
            variant: "destructive",
          });
        }
      }, 120000);

      return () => clearTimeout(timeout);
    }
  }, [connecting, toast]);

  const handleConnect = async (feature: GoogleFeature = "sheets") => {
    setConnecting(true);
    setConnectingFeature(feature);

    const popup = window.open(
      "about:blank",
      "google-oauth",
      "width=600,height=700,menubar=no,toolbar=no"
    );

    if (!popup) {
      setConnecting(false);
      setConnectingFeature(null);
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site and try again.",
        variant: "destructive",
      });
      return;
    }

    popupRef.current = popup;
    popup.document.write(POPUP_LOADING_HTML);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        popup.close();
        setConnecting(false);
        setConnectingFeature(null);
        toast({
          title: "Not Authenticated",
          description: "Please log in and try again.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("google-connect-feature", {
        body: { teamId, feature },
      });

      if (error || !data?.authUrl) {
        popup.close();
        setConnecting(false);
        setConnectingFeature(null);
        toast({
          title: "Connection Failed",
          description: error?.message || "Failed to start OAuth flow",
          variant: "destructive",
        });
        return;
      }

      popup.location.href = data.authUrl;
    } catch (err) {
      popup.close();
      setConnecting(false);
      setConnectingFeature(null);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ feature, enabled }: { feature: GoogleFeature; enabled: boolean }) => {
      if (enabled) {
        // Enable feature - need OAuth flow
        await handleConnect(feature);
        return;
      }

      // Disable feature
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("config")
        .eq("team_id", teamId)
        .eq("integration_type", "google")
        .single();

      if (!integration) throw new Error("Integration not found");

      const config = integration.config as Record<string, any>;
      const newEnabledFeatures = { ...config.enabled_features, [feature]: false };
      const hasAnyEnabled = Object.values(newEnabledFeatures).some((v) => v === true);

      if (!hasAnyEnabled) {
        const { error } = await supabase
          .from("team_integrations")
          .delete()
          .eq("team_id", teamId)
          .eq("integration_type", "google");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("team_integrations")
          .update({
            config: { ...config, enabled_features: newEnabledFeatures },
          })
          .eq("team_id", teamId)
          .eq("integration_type", "google");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-integration", teamId] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "google");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-integration", teamId] });
      onUpdate();
      toast({
        title: "Disconnected",
        description: "Google account has been disconnected.",
      });
      setDisconnectDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeFeatureCount = Object.values(enabledFeatures).filter(Boolean).length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <img
              src="/google-icon.svg"
              alt="Google"
              className="h-6 w-6"
            />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Google Account</CardTitle>
          </div>
          {isConnected && (
            <Badge variant="secondary" className="bg-success/10 text-success border-0">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            {/* Connected Account Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">{connectedEmail}</span>
                </div>
                {connectedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connected {new Date(connectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDisconnectDialogOpen(true)}
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Feature Toggles */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground mb-3">Features</p>
              {GOOGLE_FEATURES.map((featureConfig) => {
                const isEnabled = enabledFeatures[featureConfig.feature] === true;
                const isLoading = connectingFeature === featureConfig.feature;

                return (
                  <div
                    key={featureConfig.feature}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <img
                      src={featureConfig.logo}
                      alt={featureConfig.name}
                      className="h-8 w-8 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{featureConfig.name}</p>
                      <p className="text-xs text-muted-foreground">{featureConfig.description}</p>
                    </div>
                    {featureConfig.available ? (
                      isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => {
                            toggleFeatureMutation.mutate({
                              feature: featureConfig.feature,
                              enabled: checked,
                            });
                          }}
                          disabled={toggleFeatureMutation.isPending || connecting}
                        />
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Soon
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Add Another Account */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleConnect("sheets")}
                disabled={connecting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another account
              </Button>
            </div>
          </>
        ) : (
          /* Not Connected State */
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Google account to enable integrations with Sheets, Calendar, Drive, and more.
            </p>

            <Button
              onClick={() => handleConnect("sheets")}
              disabled={connecting}
              className="w-full"
              size="lg"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <img src="/google-icon.svg" alt="" className="h-5 w-5 mr-2" />
                  Sign in with Google
                </>
              )}
            </Button>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Available features:</p>
              <div className="grid grid-cols-2 gap-2">
                {GOOGLE_FEATURES.filter((f) => f.available).map((feature) => (
                  <div
                    key={feature.feature}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <img src={feature.logo} alt="" className="h-4 w-4" />
                    {feature.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect your Google account and disable all Google features (
              {activeFeatureCount} currently active). Any automations using these features will
              stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
