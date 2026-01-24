import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Check, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface TikTokConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

interface TikTokIntegrationPublic {
  integration_type: string;
  is_connected: boolean;
  config_safe: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
    connected_at?: string;
  } | null;
}

const POPUP_LOADING_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Connecting to TikTok...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
      color: white;
    }
    .container { text-align: center; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #FE2C55;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 1.2rem; margin-bottom: 0.5rem; }
    p { color: #a3a3a3; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Connecting to TikTok</h2>
    <p>Please wait while we redirect you...</p>
  </div>
</body>
</html>
`;

export function TikTokConfig({ teamId, onUpdate }: TikTokConfigProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);

  // Fetch TikTok integration status
  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ["tiktok-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("integration_type, is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "tiktok")
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as TikTokIntegrationPublic | null;
    },
    enabled: !!teamId,
  });

  // Handle OAuth messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "tiktok-oauth-success") {
        setConnecting(false);
        toast.success("TikTok connected successfully!");
        refetch();
        onUpdate?.();
        if (popupRef.current) {
          popupRef.current.close();
          popupRef.current = null;
        }
      } else if (event.data?.type === "tiktok-oauth-error") {
        setConnecting(false);
        toast.error(event.data.error || "Failed to connect TikTok");
        if (popupRef.current) {
          popupRef.current.close();
          popupRef.current = null;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch, onUpdate]);

  // Polling fallback for postMessage issues
  useEffect(() => {
    if (connecting && !pollIntervalRef.current) {
      pollIntervalRef.current = window.setInterval(async () => {
        const { data } = await supabase
          .from("team_integrations")
          .select("access_token")
          .eq("team_id", teamId)
          .eq("integration_type", "tiktok")
          .maybeSingle();
        
        const tokenData = data as { access_token?: string } | null;
        if (tokenData?.access_token) {
          setConnecting(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
          }
          toast.success("TikTok connected successfully!");
          refetch();
          onUpdate?.();
          if (popupRef.current) {
            popupRef.current.close();
            popupRef.current = null;
          }
        }
      }, 2500);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [connecting, teamId, refetch, onUpdate]);

  // Watchdog timer
  useEffect(() => {
    if (connecting && !watchdogRef.current) {
      watchdogRef.current = window.setTimeout(() => {
        if (popupRef.current?.closed) {
          setConnecting(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }, 120000); // 2 minute timeout
    }

    return () => {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
  }, [connecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      if (popupRef.current) popupRef.current.close();
    };
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      setConnecting(true);

      // Open popup immediately (sync) to avoid blockers
      const popup = window.open(
        "about:blank",
        "tiktok-oauth",
        "width=600,height=700,left=200,top=100"
      );

      if (!popup) {
        toast.error("Please allow popups for this site");
        setConnecting(false);
        return;
      }

      popupRef.current = popup;
      popup.document.write(POPUP_LOADING_HTML);

      // Get auth URL from edge function
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        popup.close();
        toast.error("Please sign in first");
        setConnecting(false);
        return;
      }

      const response = await supabase.functions.invoke("tiktok-oauth-start", {
        body: {
          teamId,
          redirectUri: window.location.origin,
        },
      });

      if (response.error || !response.data?.authUrl) {
        popup.close();
        toast.error(response.error?.message || "Failed to start TikTok connection");
        setConnecting(false);
        return;
      }

      // Redirect popup to TikTok
      popup.location.href = response.data.authUrl;
    } catch (error) {
      console.error("TikTok connect error:", error);
      toast.error("Failed to connect to TikTok");
      setConnecting(false);
      if (popupRef.current) {
        popupRef.current.close();
        popupRef.current = null;
      }
    }
  }, [teamId]);

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "tiktok");
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("TikTok disconnected");
      queryClient.invalidateQueries({ queryKey: ["tiktok-integration", teamId] });
      onUpdate?.();
    },
    onError: (error) => {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect TikTok");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConnected = integration?.is_connected;
  const displayName = integration?.config_safe?.display_name;
  const username = integration?.config_safe?.username;
  const connectedAt = integration?.config_safe?.connected_at;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connection Status</CardTitle>
          <CardDescription>
            Connect your TikTok account to use it in automations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <Alert className="bg-success/10 border-success/30">
                <Check className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Connected to TikTok
                  {(username || displayName) && (
                    <span className="font-medium ml-1">
                      ({username ? `@${username}` : displayName})
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {connectedAt && (
                <p className="text-sm text-muted-foreground">
                  Connected on {new Date(connectedAt).toLocaleDateString()}
                </p>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Disconnect TikTok
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect TikTok?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove your TikTok connection. Any automations using 
                      TikTok will stop working until you reconnect.
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect your TikTok account to send content and access analytics
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect with TikTok
                    <ExternalLink className="h-4 w-4 ml-2" />
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
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to Automations and create a new workflow</li>
              <li>Add a TikTok action from the actions menu</li>
              <li>Configure your content and posting settings</li>
              <li>Test the automation to verify it works</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
