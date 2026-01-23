import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, AlertCircle, ExternalLink, ChevronRight, FileText, BarChart3, Zap, Target } from "lucide-react";
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
import { MetaAssetSelector } from "./meta/MetaAssetSelector";

interface MetaConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

interface MetaIntegrationPublic {
  integration_type: string;
  is_connected: boolean;
  config_safe: {
    phase?: string;
    name?: string;
    email?: string;
    connected_at?: string;
    enabled_features?: {
      lead_forms?: boolean;
      ads_reporting?: boolean;
      ads_management?: boolean;
      capi?: boolean;
    };
    selected_pages?: { id: string; name: string }[];
  } | null;
}

type MetaFeature = "lead_forms" | "ads_reporting" | "ads_management" | "capi";

const FEATURES: { id: MetaFeature; name: string; description: string; icon: any; scopes: string }[] = [
  {
    id: "lead_forms",
    name: "Lead Forms",
    description: "Sync Facebook Lead Ads directly to your CRM",
    icon: FileText,
    scopes: "leads_retrieval, pages_read_engagement",
  },
  {
    id: "ads_reporting",
    name: "Ads Reporting",
    description: "View campaign performance, spend, and ROI metrics",
    icon: BarChart3,
    scopes: "ads_read",
  },
  {
    id: "ads_management",
    name: "Ads Management",
    description: "Create and manage ad campaigns (coming soon)",
    icon: Target,
    scopes: "ads_management, ads_read",
  },
  {
    id: "capi",
    name: "Conversions API",
    description: "Send conversion events for better attribution",
    icon: Zap,
    scopes: "ads_management",
  },
];

export function MetaConfig({ teamId, onUpdate }: MetaConfigProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [enablingFeature, setEnablingFeature] = useState<MetaFeature | null>(null);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Meta integration status
  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ["meta-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("integration_type, is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "meta")
        .maybeSingle();

      if (error) throw error;
      return (data as unknown) as MetaIntegrationPublic | null;
    },
    enabled: !!teamId,
  });

  const isConnected = integration?.is_connected ?? false;
  const config = integration?.config_safe;
  const enabledFeatures = config?.enabled_features ?? {};

  // Handle OAuth popup message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "meta-oauth-success") {
        setConnecting(false);
        clearPolling();
        toast.success("Meta account connected successfully");
        refetch();
        onUpdate?.();
      } else if (event.data?.type === "meta-oauth-error") {
        setConnecting(false);
        clearPolling();
        toast.error(event.data.error || "Failed to connect Meta account");
      } else if (event.data?.type === "meta-feature-success") {
        setEnablingFeature(null);
        clearPolling();
        toast.success(`${event.data.feature} enabled successfully`);
        refetch();
        onUpdate?.();
      } else if (event.data?.type === "meta-feature-error") {
        setEnablingFeature(null);
        clearPolling();
        toast.error(event.data.error || "Failed to enable feature");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch, onUpdate]);

  const clearPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearPolling();
  }, []);

  const openPopup = () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    popupRef.current = window.open(
      "about:blank",
      "meta_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    return popupRef.current;
  };

  const handleConnect = async () => {
    setConnecting(true);

    const popup = openPopup();
    if (!popup) {
      setConnecting(false);
      toast.error("Please allow popups for this site");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        popup.close();
        setConnecting(false);
        toast.error("Please sign in first");
        return;
      }

      const response = await supabase.functions.invoke("meta-oauth-start", {
        body: {
          teamId,
          redirectUri: window.location.origin,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { authUrl } = response.data;
      popup.location.href = authUrl;

      // Poll for connection status as fallback
      pollIntervalRef.current = setInterval(async () => {
        const { data } = await supabase
          .from("team_integrations_public" as any)
          .select("is_connected")
          .eq("team_id", teamId)
          .eq("integration_type", "meta")
          .maybeSingle();

        if ((data as any)?.is_connected) {
          setConnecting(false);
          clearPolling();
          toast.success("Meta account connected");
          refetch();
          onUpdate?.();
        }
      }, 2500);

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearPolling();
        setConnecting(false);
      }, 300000);
    } catch (error: any) {
      console.error("Error starting Meta OAuth:", error);
      popupRef.current?.close();
      setConnecting(false);
      toast.error(error.message || "Failed to start connection");
    }
  };

  const handleEnableFeature = async (feature: MetaFeature) => {
    if (feature === "ads_management") {
      toast.info("Ads Management is coming soon!");
      return;
    }

    setEnablingFeature(feature);

    const popup = openPopup();
    if (!popup) {
      setEnablingFeature(null);
      toast.error("Please allow popups for this site");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        popup.close();
        setEnablingFeature(null);
        toast.error("Please sign in first");
        return;
      }

      const response = await supabase.functions.invoke("meta-connect-feature", {
        body: {
          teamId,
          feature,
          redirectUri: window.location.origin,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { authUrl } = response.data;
      popup.location.href = authUrl;

      // Poll for feature enablement as fallback
      pollIntervalRef.current = setInterval(async () => {
        const { data } = await supabase
          .from("team_integrations_public" as any)
          .select("config_safe")
          .eq("team_id", teamId)
          .eq("integration_type", "meta")
          .maybeSingle();

        const currentConfig = (data as any)?.config_safe;
        if (currentConfig?.enabled_features?.[feature]) {
          setEnablingFeature(null);
          clearPolling();
          toast.success(`${feature} enabled`);
          refetch();
          onUpdate?.();
        }
      }, 2500);

      setTimeout(() => {
        clearPolling();
        setEnablingFeature(null);
      }, 300000);
    } catch (error: any) {
      console.error("Error enabling feature:", error);
      popupRef.current?.close();
      setEnablingFeature(null);
      toast.error(error.message || "Failed to enable feature");
    }
  };

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "meta");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meta account disconnected");
      queryClient.invalidateQueries({ queryKey: ["meta-integration", teamId] });
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
        {/* Connection Status */}
        <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
          <Check className="h-5 w-5 text-success" />
          <div className="flex-1">
            <p className="font-medium text-success">Connected to Meta</p>
            {config?.name && (
              <p className="text-sm text-muted-foreground">
                {config.name}
                {config.email && ` (${config.email})`}
              </p>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3">
          <h4 className="font-medium">Enable Features</h4>
          <p className="text-sm text-muted-foreground">
            Each feature requires specific permissions. Enable only what you need.
          </p>
          
          <div className="grid gap-3">
            {FEATURES.map((feature) => {
              const isEnabled = enabledFeatures[feature.id];
              const isLoading = enablingFeature === feature.id;
              const Icon = feature.icon;

              return (
                <Card 
                  key={feature.id} 
                  className={`transition-colors ${isEnabled ? 'border-success/50 bg-success/5' : ''}`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isEnabled ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{feature.name}</CardTitle>
                          <CardDescription className="text-xs">{feature.description}</CardDescription>
                        </div>
                      </div>
                      {isEnabled ? (
                        <div className="flex items-center gap-2 text-success text-sm">
                          <Check className="h-4 w-4" />
                          Enabled
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant={feature.id === "ads_management" ? "outline" : "default"}
                          onClick={() => handleEnableFeature(feature.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : feature.id === "ads_management" ? (
                            "Coming Soon"
                          ) : (
                            <>
                              Enable
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground">
                      Requires: {feature.scopes}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Asset Selection (if lead_forms enabled) */}
        {enabledFeatures.lead_forms && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Page & Form Selection</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAssetSelector(!showAssetSelector)}
              >
                {showAssetSelector ? "Hide" : "Configure"}
              </Button>
            </div>
            {showAssetSelector && (
              <MetaAssetSelector 
                teamId={teamId} 
                onUpdate={() => {
                  refetch();
                  onUpdate?.();
                }}
              />
            )}
            {config?.selected_pages && config.selected_pages.length > 0 && !showAssetSelector && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {config.selected_pages.length} page(s) subscribed for lead sync
                </p>
              </div>
            )}
          </div>
        )}

        {/* Disconnect */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              Disconnect Meta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Meta?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the connection to your Meta Business account.
                Any automations using Meta will stop working.
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

  // Not connected - show connect button
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Connect your Meta Business account</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start with basic profile access, then enable specific features as needed.
          </p>
        </div>
      </div>

      <div className="p-4 border rounded-lg space-y-3">
        <h4 className="font-medium">Available Features</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {feature.name} - {feature.description}
              </li>
            );
          })}
        </ul>
      </div>

      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full bg-[#1877F2] hover:bg-[#0E5FC0]"
      >
        {connecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <ExternalLink className="h-4 w-4 mr-2" />
            Connect with Meta
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Only basic profile permissions are requested initially
      </p>
    </div>
  );
}
