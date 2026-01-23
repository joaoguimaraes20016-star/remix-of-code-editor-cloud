import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Check, 
  ExternalLink, 
  Unlink,
  CheckCircle2,
  Lock,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type GoogleFeature = "sheets" | "calendar" | "drive" | "forms";

interface GoogleFeatureCardProps {
  feature: GoogleFeature;
  teamId: string;
  name: string;
  description: string;
  logo: string;
  isConnected: boolean;
  isEnabled: boolean;
  connectedEmail?: string;
  connectedAt?: string;
  usageInstructions: string[];
  onUpdate: () => void;
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

export function GoogleFeatureCard({
  feature,
  teamId,
  name,
  description,
  logo,
  isConnected,
  isEnabled,
  connectedEmail,
  connectedAt,
  usageInstructions,
  onUpdate,
}: GoogleFeatureCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
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
      if (event.data?.type === "google-oauth-success" && event.data?.feature === feature) {
        setConnecting(false);
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        onUpdate();
        toast({
          title: `${name} Connected`,
          description: event.data.email
            ? `Connected as ${event.data.email}`
            : "Your Google account is now connected.",
        });
        setDialogOpen(false);
      } else if (event.data?.type === "google-oauth-error") {
        setConnecting(false);
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
  }, [feature, name, onUpdate, toast]);

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
            config_safe: { email?: string; enabled_features?: Record<string, boolean> } | null 
          } | null;

          if (result?.config_safe?.enabled_features?.[feature]) {
            setConnecting(false);
            clearInterval(pollTimerRef.current!);
            pollTimerRef.current = null;
            onUpdate();
            toast({
              title: `${name} Connected`,
              description: result.config_safe?.email
                ? `Connected as ${result.config_safe.email}`
                : "Your Google account is now connected.",
            });
            setDialogOpen(false);
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
  }, [connecting, teamId, feature, name, onUpdate, toast]);

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

      const { data, error } = await supabase.functions.invoke("google-connect-feature", {
        body: { teamId, feature },
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

  const disableFeatureMutation = useMutation({
    mutationFn: async () => {
      // Get current config
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("config")
        .eq("team_id", teamId)
        .eq("integration_type", "google")
        .single();

      if (!integration) throw new Error("Integration not found");

      const config = integration.config as Record<string, any>;
      const enabledFeatures = config.enabled_features || {};
      
      // Disable this feature
      enabledFeatures[feature] = false;

      // Check if any features are still enabled
      const hasAnyEnabled = Object.values(enabledFeatures).some(v => v === true);

      if (!hasAnyEnabled) {
        // Delete the entire integration if no features enabled
        const { error } = await supabase
          .from("team_integrations")
          .delete()
          .eq("team_id", teamId)
          .eq("integration_type", "google");

        if (error) throw error;
      } else {
        // Just update the enabled_features
        const { error } = await supabase
          .from("team_integrations")
          .update({
            config: {
              ...config,
              enabled_features: enabledFeatures,
            },
          })
          .eq("team_id", teamId)
          .eq("integration_type", "google");

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-integration", teamId] });
      onUpdate();
      toast({
        title: "Disconnected",
        description: `${name} has been disconnected.`,
      });
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Determine button state
  const buttonLabel = isEnabled ? "Manage" : isConnected ? "Enable" : "Connect";
  const buttonVariant = isEnabled ? "outline" : "default";
  const isLocked = !isConnected;

  return (
    <>
      <Card
        className={`border-border/50 transition-all ${
          isLocked 
            ? "opacity-60 cursor-not-allowed" 
            : "hover:border-primary/30 hover:shadow-md cursor-pointer"
        }`}
        onClick={() => !isLocked && setDialogOpen(true)}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
              <img 
                src={logo} 
                alt={name}
                className="h-8 w-8 object-contain"
              />
              {isLocked && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{name}</h3>
                {isEnabled && (
                  <Badge variant="secondary" className="bg-success/10 text-success border-0">
                    <Check className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          <Button
            variant={isLocked ? "secondary" : buttonVariant}
            size="sm"
            className="w-full mt-4"
            disabled={isLocked}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLocked) setDialogOpen(true);
            }}
          >
            {isLocked ? "Sign in first" : buttonLabel}
            {!isLocked && <ExternalLink className="h-3 w-3 ml-2" />}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img src={logo} alt={name} className="h-6 w-6" />
              {name}
            </DialogTitle>
          </DialogHeader>

          {isEnabled ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-success/30 bg-success/5">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Connected</p>
                  {connectedEmail && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Account: {connectedEmail}
                    </p>
                  )}
                  {connectedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Connected: {new Date(connectedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">How to Use</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {usageInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">{index + 1}.</span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Unlink className="h-4 w-4 mr-2" />
                    Disable {name}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disable {name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will disable {name} integration. Any automations using
                      this feature will stop working until you re-enable it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => disableFeatureMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Disable
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{description}</p>
                {isConnected && (
                  <p className="text-success">
                    ✓ Google account already connected as {connectedEmail}. 
                    Click below to enable {name}.
                  </p>
                )}
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
                    {isConnected ? `Enable ${name}` : `Connect ${name}`}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
