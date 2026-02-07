import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileText, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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

interface TypeformConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

interface TypeformIntegrationPublic {
  integration_type: string;
  is_connected: boolean;
  config_safe: {
    email?: string;
    alias?: string;
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
      background: linear-gradient(135deg, #262627 0%, #1a1a1b 100%);
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
  <p>Connecting to Typeform...</p>
</body>
</html>
`;

export function TypeformConfig({ teamId, onUpdate }: TypeformConfigProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Typeform integration status
  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ["typeform-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("integration_type, is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "typeform")
        .maybeSingle();

      if (error) throw error;
      return data as unknown as TypeformIntegrationPublic | null;
    },
    enabled: !!teamId,
  });

  const isConnected = integration?.is_connected ?? false;

  // Handle postMessage from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "typeform-oauth-callback") {
        setConnecting(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (watchdogRef.current) clearTimeout(watchdogRef.current);

        if (event.data.success) {
          toast.success("Typeform connected successfully!");
          refetch();
          onUpdate?.();
        } else {
          toast.error(event.data.error || "Failed to connect Typeform");
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
          .eq("integration_type", "typeform")
          .maybeSingle();

        if ((data as any)?.is_connected) {
          setConnecting(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (watchdogRef.current) clearTimeout(watchdogRef.current);
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
          toast.success("Typeform connected successfully!");
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
        "typeform-oauth",
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
        toast.error("Please sign in to connect Typeform");
        setConnecting(false);
        return;
      }

      const response = await supabase.functions.invoke("typeform-oauth-start", {
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
      console.error("Typeform connect error:", error);
      toast.error("Failed to initiate Typeform connection");
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
        .eq("integration_type", "typeform");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Typeform disconnected");
      queryClient.invalidateQueries({ queryKey: ["typeform-integration", teamId] });
      onUpdate?.();
    },
    onError: (error) => {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect Typeform");
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
            <FileText className="h-5 w-5 text-primary" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Connect your Typeform account to capture form responses as leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Connected</p>
                  {integration?.config_safe?.email && (
                    <p className="text-sm text-muted-foreground">
                      {integration.config_safe.email}
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
                    Disconnect Typeform
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Typeform?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the Typeform integration. You'll need to reconnect
                      to capture form responses.
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
                  Typeform is not connected. Connect to capture form responses as leads.
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-[#262627] hover:bg-[#262627]/90"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Connect with Typeform
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
            <CardTitle>Webhook Setup</CardTitle>
            <CardDescription>
              Configure Typeform to send form responses to your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Add this URL as a webhook in your Typeform form settings:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-3 rounded-lg border overflow-x-auto">
                  {`${import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co"}/functions/v1/typeform-webhook?team_id=${teamId}`}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `${import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co"}/functions/v1/typeform-webhook?team_id=${teamId}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Webhook URL copied to clipboard");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="font-medium text-sm mb-2">How it works</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Copy the webhook URL above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>In Typeform, go to your form &gt; Connect &gt; Webhooks &gt; Add Webhook</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Paste the URL and enable the webhook</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">4.</span>
                  <span>Form responses will automatically create contacts and trigger automations</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
