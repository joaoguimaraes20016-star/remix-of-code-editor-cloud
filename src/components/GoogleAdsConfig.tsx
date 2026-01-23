import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle, ExternalLink } from "lucide-react";
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

interface GoogleAdsConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

interface GoogleAdsIntegrationPublic {
  integration_type: string;
  is_connected: boolean;
  config_safe: {
    email?: string;
    name?: string;
    connected_at?: string;
  } | null;
}

export function GoogleAdsConfig({ teamId, onUpdate }: GoogleAdsConfigProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Google Ads integration status
  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ["google-ads-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("integration_type, is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "google_ads")
        .maybeSingle();

      if (error) throw error;
      return (data as unknown) as GoogleAdsIntegrationPublic | null;
    },
    enabled: !!teamId,
  });

  const isConnected = integration?.is_connected ?? false;

  // Handle OAuth popup message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "google-ads-oauth-success") {
        setConnecting(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        toast.success("Google Ads account connected successfully");
        refetch();
        onUpdate?.();
      } else if (event.data?.type === "google-ads-oauth-error") {
        setConnecting(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        toast.error(event.data.error || "Failed to connect Google Ads account");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch, onUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleConnect = async () => {
    setConnecting(true);

    // Open popup immediately to avoid popup blocker
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    popupRef.current = window.open(
      "about:blank",
      "google_ads_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    if (!popupRef.current) {
      setConnecting(false);
      toast.error("Please allow popups for this site");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        popupRef.current.close();
        setConnecting(false);
        toast.error("Please sign in first");
        return;
      }

      const response = await supabase.functions.invoke("google-ads-oauth-start", {
        body: {
          teamId,
          redirectUri: window.location.origin,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { authUrl } = response.data;
      popupRef.current.location.href = authUrl;

      // Poll for connection status as fallback
      pollIntervalRef.current = setInterval(async () => {
        const { data } = await supabase
          .from("team_integrations_public" as any)
          .select("is_connected")
          .eq("team_id", teamId)
          .eq("integration_type", "google_ads")
          .maybeSingle();

        if ((data as any)?.is_connected) {
          setConnecting(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          toast.success("Google Ads account connected");
          refetch();
          onUpdate?.();
        }
      }, 2500);

      // Stop polling after 5 minutes
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setConnecting(false);
        }
      }, 300000);
    } catch (error: any) {
      console.error("Error starting Google Ads OAuth:", error);
      popupRef.current?.close();
      setConnecting(false);
      toast.error(error.message || "Failed to start connection");
    }
  };

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "google_ads");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Google Ads account disconnected");
      queryClient.invalidateQueries({ queryKey: ["google-ads-integration", teamId] });
      onUpdate?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disconnect");
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
        <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
          <Check className="h-5 w-5 text-success" />
          <div className="flex-1">
            <p className="font-medium text-success">Connected to Google Ads</p>
            {integration?.config_safe?.email && (
              <p className="text-sm text-muted-foreground">
                {integration.config_safe.email}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Available Features</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Offline conversion tracking
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Google Lead Forms integration
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Customer Match sync (coming soon)
            </li>
          </ul>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              Disconnect Google Ads
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Google Ads?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the connection to your Google Ads account.
                Any automations using Google Ads will stop working.
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
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Connect your Google Ads account</p>
          <p className="text-sm text-muted-foreground mt-1">
            Enable offline conversion tracking, lead form imports, and audience syncing.
          </p>
        </div>
      </div>

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
            <ExternalLink className="h-4 w-4 mr-2" />
            Connect with Google Ads
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        You'll be redirected to Google to authorize the connection
      </p>
    </div>
  );
}
