import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ExternalLink, Unlink } from "lucide-react";
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

interface GoogleSheetsOAuthConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

interface GoogleSheetsIntegrationPublic {
  email?: string;
  name?: string;
  connected_at?: string;
}

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

export function GoogleSheetsOAuthConfig({ teamId, onUpdate }: GoogleSheetsOAuthConfigProps) {
  const [connecting, setConnecting] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current integration status from secure view (tokens masked)
  const { data: integrationData, isLoading, refetch } = useQuery({
    queryKey: ["google-sheets-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "google_sheets")
        .maybeSingle();

      if (error) throw error;
      return data as unknown as { is_connected: boolean; config_safe: GoogleSheetsIntegrationPublic | null } | null;
    },
    enabled: !!teamId,
  });

  const isConnected = integrationData?.is_connected ?? false;
  const integration = integrationData?.config_safe;

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "google-oauth-success") {
        setConnecting(false);
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        refetch();
        onUpdate?.();
        toast({
          title: "Google Sheets Connected",
          description: event.data.email
            ? `Connected as ${event.data.email}`
            : "Your Google account is now connected.",
        });
      } else if (event.data?.type === "google-oauth-error") {
        setConnecting(false);
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        toast({
          title: "Connection Failed",
          description: event.data.error || "Failed to connect Google Sheets",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch, onUpdate, toast]);

  // Fallback polling for popup close detection
  useEffect(() => {
    if (connecting && !pollTimerRef.current) {
      pollTimerRef.current = window.setInterval(async () => {
        // Check if popup was closed
        if (popupRef.current?.closed) {
          // Check if connection succeeded
          const { data } = await supabase
            .from("team_integrations_public" as any)
            .select("is_connected, config_safe")
            .eq("team_id", teamId)
            .eq("integration_type", "google_sheets")
            .maybeSingle();

          const result = data as unknown as { is_connected: boolean; config_safe: GoogleSheetsIntegrationPublic | null } | null;
          if (result?.is_connected) {
            setConnecting(false);
            clearInterval(pollTimerRef.current!);
            pollTimerRef.current = null;
            refetch();
            onUpdate?.();
            toast({
              title: "Google Sheets Connected",
              description: result.config_safe?.email
                ? `Connected as ${result.config_safe.email}`
                : "Your Google account is now connected.",
            });
          } else {
            setConnecting(false);
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
  }, [connecting, teamId, refetch, onUpdate, toast]);

  // Watchdog timeout
  useEffect(() => {
    if (connecting) {
      const timeout = setTimeout(() => {
        if (connecting) {
          setConnecting(false);
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
      }, 120000); // 2 minutes

      return () => clearTimeout(timeout);
    }
  }, [connecting, toast]);

  const handleConnect = async () => {
    setConnecting(true);

    // Open popup synchronously to avoid popup blockers
    const popup = window.open(
      "about:blank",
      "google-oauth",
      "width=600,height=700,menubar=no,toolbar=no"
    );

    if (!popup) {
      setConnecting(false);
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
        toast({
          title: "Not Authenticated",
          description: "Please log in and try again.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("google-oauth-start", {
        body: { teamId },
      });

      if (error || !data?.authUrl) {
        popup.close();
        setConnecting(false);
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
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "google_sheets");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-sheets-integration", teamId] });
      onUpdate?.();
      toast({
        title: "Disconnected",
        description: "Google Sheets has been disconnected from your team.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 rounded-lg border border-success/30 bg-success/5">
          <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Connected to Google Sheets</p>
            {integration?.email && (
              <p className="text-sm text-muted-foreground mt-1">
                Account: {integration.email}
              </p>
            )}
            {integration?.connected_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Connected: {new Date(integration.connected_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-foreground">How to Use</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              Create an automation with any trigger (e.g., "Appointment Booked")
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              Add a "Google Sheets: Append Row" action
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              Enter your spreadsheet URL and map columns to lead/appointment data
            </li>
          </ul>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect Google Sheets
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Google Sheets?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the Google Sheets connection. Any automations using
                Google Sheets actions will stop working until you reconnect.
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          Connect your Google account to automatically add rows to Google Sheets
          when automation events occur.
        </p>
        <p>
          After connecting, you can use the "Google Sheets: Append Row" action in
          your automations to sync lead data, appointments, and more.
        </p>
      </div>

      <Button
        onClick={handleConnect}
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
            <ExternalLink className="h-4 w-4 mr-2" />
            Connect with Google
          </>
        )}
      </Button>
    </div>
  );
}
