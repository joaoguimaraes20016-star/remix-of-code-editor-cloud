import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ExternalLink, Unlink, MessageSquare, Hash } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SlackConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

interface SlackIntegrationPublic {
  team_name?: string;
  workspace_name?: string;
  connected_at?: string;
}

// Loading HTML for the popup placeholder (opened synchronously to avoid popup blockers)
const POPUP_LOADING_HTML = () => `
<!DOCTYPE html>
<html>
<head>
  <title>Connecting to Slack...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           display: flex; justify-content: center; align-items: center;
           height: 100vh; margin: 0; background: #f8fafc; }
    .container { text-align: center; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0;
               border-top-color: #4f46e5; border-radius: 50%;
               animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { color: #1e293b; margin: 0 0 8px; font-size: 18px; }
    p { color: #64748b; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Connecting to Slack</h2>
    <p>Please wait...</p>
  </div>
</body>
</html>`;

export function SlackConfig({ teamId, onUpdate }: SlackConfigProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  // Fetch Slack integration status from secure view (tokens masked)
  const { data: integrationData, isLoading, refetch } = useQuery({
    queryKey: ["slack-integration", teamId],
    queryFn: async () => {
      // Query the secure view that masks tokens
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "slack")
        .maybeSingle();

      if (error) throw error;
      return data as unknown as { is_connected: boolean; config_safe: SlackIntegrationPublic | null } | null;
    },
    enabled: !!teamId,
  });

  const isConnected = integrationData?.is_connected ?? false;
  const integration = integrationData?.config_safe;

  // Handle OAuth message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "slack-oauth-success") {
        console.debug("[SlackConfig] Received slack-oauth-success message");
        setConnecting(false);
        toast.success(`Connected to ${event.data.workspace || "Slack"}!`);
        refetch();
        onUpdate?.();
      } else if (event.data?.type === "slack-oauth-error") {
        console.debug("[SlackConfig] Received slack-oauth-error message", event.data.error);
        setConnecting(false);
        toast.error(event.data.error || "Failed to connect Slack");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch, onUpdate]);

  // Fallback completion strategy: while connecting, poll DB for access_token
  // Also detect user closing the popup so we never stay stuck on "Connecting...".
  useEffect(() => {
    if (!connecting) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        // 1) First, check if the integration is now connected
        const result = await refetch();
        if (result.data?.is_connected) {
          console.debug("[SlackConfig] Detected connection via polling");
          try {
            popupRef.current?.close();
          } catch {
            // ignore
          }
          popupRef.current = null;
          setConnecting(false);
          const configSafe = result.data.config_safe as SlackIntegrationPublic | null;
          toast.success(`Connected to ${configSafe?.team_name || configSafe?.workspace_name || "Slack"}!`);
          onUpdate?.();
          return;
        }

        // 2) If popup was closed and we're still not connected, stop and explain
        const popup = popupRef.current;
        if (popup && popup.closed) {
          console.debug("[SlackConfig] Popup closed before connection completed");
          popupRef.current = null;
          setConnecting(false);
          toast.info("Slack window closed before authorization completed.");
        }
      } catch (e) {
        console.debug("[SlackConfig] Polling error", e);
      }
    };

    // run immediately + interval
    poll();
    pollTimerRef.current = window.setInterval(poll, 2500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [connecting, refetch, onUpdate]);

  // Watchdog timer for popup
  useEffect(() => {
    if (!connecting) return;

    const timeout = setTimeout(() => {
      setConnecting(false);
      toast.error("Connection timed out. Please try again.");
    }, 120000); // 2 minute timeout

    return () => clearTimeout(timeout);
  }, [connecting]);

  const handleConnect = async () => {
    // Open popup synchronously (prevents popup blockers in most browsers)
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "about:blank",
      "slack-oauth",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes`
    );

    if (!popup || popup.closed) {
      toast.error("Popup blocked. Please allow popups and try again.", { duration: 10000 });
      return;
    }

    popupRef.current = popup;
    try {
      popup.document.write(POPUP_LOADING_HTML());
      popup.document.close();
    } catch {
      // ignore
    }

    try {
      setConnecting(true);

      console.debug("[SlackConfig] Starting Slack OAuth", { teamId });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to connect Slack");
        try {
          popup.close();
        } catch {
          // ignore
        }
        popupRef.current = null;
        setConnecting(false);
        return;
      }

      const response = await supabase.functions.invoke("slack-oauth-start", {
        body: { teamId, redirectUri: window.location.origin },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { authUrl } = response.data;
      if (!authUrl) {
        throw new Error("No authorization URL returned");
      }

      console.debug("[SlackConfig] Received Slack authUrl, navigating popup");
      try {
        popup.location.href = authUrl;
      } catch (e) {
        console.debug("[SlackConfig] Failed to navigate popup", e);
        throw new Error("Failed to open Slack authorization window");
      }
    } catch (error) {
      console.error("Slack OAuth error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start Slack connection");
      try {
        popupRef.current?.close();
      } catch {
        // ignore
      }
      popupRef.current = null;
      setConnecting(false);
    }
  };

  // Cleanup timers/popup on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      try {
        popupRef.current?.close();
      } catch {
        // ignore
      }
      popupRef.current = null;
    };
  }, []);

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "slack");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slack disconnected");
      queryClient.invalidateQueries({ queryKey: ["slack-integration", teamId] });
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Connection Status</CardTitle>
              <CardDescription>
                {isConnected
                  ? `Connected to ${integration?.team_name || integration?.workspace_name || "Slack workspace"}`
                  : "Connect your Slack workspace to send automated messages"}
              </CardDescription>
            </div>
            {isConnected && (
              <Badge variant="secondary" className="bg-success/10 text-success border-0">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Workspace</span>
                  <p className="font-medium">{integration?.team_name || integration?.workspace_name || "Unknown"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Connected</span>
                  <p className="font-medium">
                    {integration?.connected_at
                      ? new Date(integration.connected_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect Slack
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Slack?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the connection to {integration?.team_name || integration?.workspace_name || "your Slack workspace"}.
                      Automations that use Slack will stop working until you reconnect.
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
            </div>
          ) : (
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect with Slack
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Usage Information */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
            <CardDescription>
              Send messages to Slack channels from your automations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Automation Actions</p>
                <p className="text-sm text-muted-foreground">
                  Add a "Send Slack Message" action to any automation to notify your team.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Channel IDs</p>
                <p className="text-sm text-muted-foreground">
                  Use channel IDs (e.g., C01234567) from Slack. Right-click a channel → View channel details → Copy ID.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
