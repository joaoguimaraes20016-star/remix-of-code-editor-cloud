import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, CheckCircle2, AlertCircle, Video } from "lucide-react";
import { toast } from "sonner";

interface FathomConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

interface FathomIntegrationPublic {
  integration_type: string;
  is_connected: boolean;
  config: {
    user_email?: string;
    user_name?: string;
    connected_at?: string;
  } | null;
}

const POPUP_LOADING_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Connecting to Fathom...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #5636D3 0%, #7C4DFF 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { font-size: 20px; font-weight: 500; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Connecting to Fathom...</h2>
  </div>
</body>
</html>
`;

export function FathomConfig({ teamId, onUpdate }: FathomConfigProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);

  // Fetch Fathom integration status
  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ["fathom-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("integration_type, is_connected, config")
        .eq("team_id", teamId)
        .eq("integration_type", "fathom")
        .maybeSingle();

      if (error) throw error;
      return data as unknown as FathomIntegrationPublic | null;
    },
    enabled: !!teamId,
  });

  const isConnected = integration?.is_connected ?? false;
  const userEmail = integration?.config?.user_email;
  const userName = integration?.config?.user_name;
  const connectedAt = integration?.config?.connected_at;

  // Handle postMessage from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "fathom-oauth-callback") {
        setConnecting(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (watchdogRef.current) {
          clearTimeout(watchdogRef.current);
          watchdogRef.current = null;
        }

        if (event.data.success) {
          toast.success("Fathom connected successfully!");
          refetch();
          onUpdate?.();
        } else {
          toast.error(`Failed to connect Fathom: ${event.data.error || "Unknown error"}`);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch, onUpdate]);

  // Polling fallback for postMessage failures
  useEffect(() => {
    if (connecting && !pollIntervalRef.current) {
      pollIntervalRef.current = window.setInterval(async () => {
        const { data } = await supabase
          .from("team_integrations_public" as any)
          .select("is_connected")
          .eq("team_id", teamId)
          .eq("integration_type", "fathom")
          .maybeSingle();

        const integrationData = data as unknown as { is_connected: boolean } | null;

        if (integrationData?.is_connected) {
          setConnecting(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
          }
          toast.success("Fathom connected successfully!");
          refetch();
          onUpdate?.();
        }
      }, 2500);

      // Watchdog timer to detect popup closed without completion
      watchdogRef.current = window.setTimeout(() => {
        if (connecting && popupRef.current?.closed) {
          setConnecting(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          toast.error("Connection cancelled - popup was closed");
        }
      }, 120000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
  }, [connecting, teamId, refetch, onUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      setConnecting(true);

      // Open popup immediately to avoid blockers
      const popup = window.open("about:blank", "fathom-oauth", "width=600,height=700,scrollbars=yes");
      if (!popup) {
        toast.error("Popup blocked. Please allow popups for this site.");
        setConnecting(false);
        return;
      }
      popupRef.current = popup;

      // Write loading state
      popup.document.write(POPUP_LOADING_HTML);
      popup.document.close();

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        popup.close();
        toast.error("Authentication required. Please log in again.");
        setConnecting(false);
        return;
      }

      const redirectUri = window.location.origin;

      const response = await supabase.functions.invoke("fathom-oauth-start", {
        body: { teamId, redirectUri },
      });

      if (response.error || !response.data?.authUrl) {
        popup.close();
        toast.error(response.error?.message || "Failed to start Fathom OAuth flow");
        setConnecting(false);
        return;
      }

      popup.location.href = response.data.authUrl;
    } catch (err) {
      console.error("Fathom connect error:", err);
      toast.error("Failed to connect to Fathom");
      setConnecting(false);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    }
  };

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "fathom");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fathom disconnected");
      queryClient.invalidateQueries({ queryKey: ["fathom-integration", teamId] });
      onUpdate?.();
    },
    onError: (error) => {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect Fathom");
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
            <Video className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Connect your Fathom account to import meeting recordings and transcriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  <span className="font-medium">Connected to Fathom</span>
                  {(userEmail || userName) && (
                    <span className="block text-sm mt-1">
                      {userName && <span>{userName}</span>}
                      {userName && userEmail && <span> • </span>}
                      {userEmail && <span>{userEmail}</span>}
                    </span>
                  )}
                  {connectedAt && (
                    <span className="block text-sm opacity-70 mt-1">
                      Connected on {new Date(connectedAt).toLocaleDateString()}
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Disconnect Fathom
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Fathom?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the Fathom integration from your team. You can reconnect at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => disconnectMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect your Fathom account to automatically sync meeting recordings and transcriptions.
                </AlertDescription>
              </Alert>

              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  "Connect with Fathom"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Once connected, you can:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Import meeting recordings automatically</li>
              <li>Access transcriptions for your calls</li>
              <li>Trigger automations based on meeting events</li>
              <li>Attach recordings to CRM contacts</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
