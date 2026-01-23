import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, MessageSquare, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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

interface DiscordConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

interface DiscordIntegrationPublic {
  integration_type: string;
  is_connected: boolean;
  config_safe: {
    guild_id?: string;
    guild_name?: string;
    connected_at?: string;
  } | null;
}

const POPUP_LOADING_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: -apple-system, system-ui, sans-serif;
      display: flex; 
      flex-direction: column;
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      margin: 0;
      background: linear-gradient(135deg, #5865F2 0%, #3C45A5 100%);
      color: white;
    }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 18px; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Connecting to Discord...</p>
</body>
</html>
`;

export function DiscordConfig({ teamId, onUpdate }: DiscordConfigProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Discord integration status
  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ["discord-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("integration_type, is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "discord")
        .maybeSingle();

      if (error) throw error;
      return data as unknown as DiscordIntegrationPublic | null;
    },
    enabled: !!teamId,
  });

  const isConnected = integration?.is_connected ?? false;

  // Handle postMessage from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "discord-oauth-callback") {
        setConnecting(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (watchdogRef.current) clearTimeout(watchdogRef.current);

        if (event.data.success) {
          toast.success("Discord connected successfully!");
          refetch();
          onUpdate?.();
        } else {
          toast.error(event.data.error || "Failed to connect Discord");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch, onUpdate]);

  // Polling fallback for postMessage failures
  useEffect(() => {
    if (connecting) {
      pollIntervalRef.current = setInterval(async () => {
        const { data } = await supabase
          .from("team_integrations_public" as any)
          .select("is_connected")
          .eq("team_id", teamId)
          .eq("integration_type", "discord")
          .maybeSingle();

        if ((data as any)?.is_connected) {
          setConnecting(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (watchdogRef.current) clearTimeout(watchdogRef.current);
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
          toast.success("Discord connected successfully!");
          refetch();
          onUpdate?.();
        }
      }, 2500);

      // Watchdog timer
      watchdogRef.current = setTimeout(() => {
        if (connecting) {
          setConnecting(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (popupRef.current?.closed) {
            toast.error("Connection cancelled");
          }
        }
      }, 120000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, [connecting, teamId, refetch, onUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      setConnecting(true);

      // Open popup synchronously
      const popup = window.open(
        "about:blank",
        "discord-oauth",
        "width=600,height=700,left=200,top=100"
      );

      if (!popup) {
        toast.error("Popup blocked. Please allow popups for this site.");
        setConnecting(false);
        return;
      }

      popupRef.current = popup;
      popup.document.write(POPUP_LOADING_HTML);

      const redirectUri = window.location.origin;

      // Get auth URL from edge function
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        popup.close();
        toast.error("Please sign in to connect Discord");
        setConnecting(false);
        return;
      }

      const response = await supabase.functions.invoke("discord-oauth-start", {
        body: { teamId, redirectUri },
      });

      if (response.error) {
        popup.close();
        toast.error(response.error.message || "Failed to start OAuth flow");
        setConnecting(false);
        return;
      }

      const { authUrl } = response.data;
      if (!authUrl) {
        popup.close();
        toast.error("Failed to get authorization URL");
        setConnecting(false);
        return;
      }

      popup.location.href = authUrl;
    } catch (error) {
      console.error("Discord connect error:", error);
      toast.error("Failed to initiate Discord connection");
      setConnecting(false);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    }
  }, [teamId]);

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "discord");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Discord disconnected");
      queryClient.invalidateQueries({ queryKey: ["discord-integration", teamId] });
      onUpdate?.();
    },
    onError: (error) => {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect Discord");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#5865F2]" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Connect your Discord server to send notifications and messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Connected</p>
                  {integration?.config_safe?.guild_name && (
                    <p className="text-sm text-muted-foreground">
                      {integration.config_safe.guild_name}
                    </p>
                  )}
                  {integration?.config_safe?.connected_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Connected {new Date(integration.config_safe.connected_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <XCircle className="h-4 w-4 mr-2" />
                    Disconnect Discord
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Discord?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the Discord integration. You'll need to reconnect
                      and reauthorize to send messages.
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
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Discord is not connected. Connect to send notifications to your server.
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-[#5865F2] hover:bg-[#5865F2]/90"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Connect with Discord
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.</span>
                <span>Go to Automations and create a new workflow</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.</span>
                <span>Add a "Send Discord Message" action</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.</span>
                <span>Select a channel and compose your message</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
