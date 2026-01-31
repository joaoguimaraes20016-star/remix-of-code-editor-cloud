import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ExternalLink, Unlink, Heart } from "lucide-react";
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
import { connectFanbasis, disconnectFanbasis } from "@/lib/integrations/fanbasis";

interface FanbasisConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

interface FanbasisIntegrationPublic {
  creator_id?: string;
  creator_name?: string;
  connected_at?: string;
  scope?: string;
}

export function FanbasisConfig({ teamId, onUpdate }: FanbasisConfigProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const { data: integrationData, isLoading, refetch } = useQuery({
    queryKey: ["fanbasis-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("is_connected, config_safe")
        .eq("team_id", teamId)
        .eq("integration_type", "fanbasis")
        .maybeSingle();

      if (error) throw error;
      return data as unknown as {
        is_connected: boolean;
        config_safe: FanbasisIntegrationPublic | null;
      } | null;
    },
    enabled: !!teamId,
  });

  const isConnected = integrationData?.is_connected ?? false;
  const integration = integrationData?.config_safe;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await connectFanbasis(teamId, window.location.href);
      if (result.success) {
        toast.success(
          result.creatorId
            ? `Connected to Fanbasis!`
            : "Fanbasis connected successfully!"
        );
        await queryClient.invalidateQueries({ queryKey: ["fanbasis-integration", teamId] });
        await queryClient.invalidateQueries({ queryKey: ["team-integrations", teamId] });
        refetch();
        onUpdate?.();
      } else {
        if (result.error !== "OAuth cancelled by user") {
          toast.error(result.error || "Failed to connect Fanbasis");
        }
      }
    } finally {
      setConnecting(false);
    }
  };

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const ok = await disconnectFanbasis(teamId);
      if (!ok) throw new Error("Failed to disconnect");
    },
    onSuccess: () => {
      toast.success("Fanbasis disconnected");
      queryClient.invalidateQueries({ queryKey: ["fanbasis-integration", teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-integrations", teamId] });
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Connection Status</CardTitle>
              <CardDescription>
                {isConnected
                  ? `Connected as ${integration?.creator_name || "creator"}`
                  : "Connect your Fanbasis creator account for subscriptions and tips"}
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
                  <span className="text-muted-foreground">Creator</span>
                  <p className="font-medium">
                    {integration?.creator_name || integration?.creator_id || "Unknown"}
                  </p>
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
                    Disconnect Fanbasis
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Fanbasis?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the connection to your Fanbasis account.
                      You can reconnect at any time.
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
                  Connect with Fanbasis
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
            <CardDescription>
              Use Fanbasis for creator subscriptions and tips in your funnels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Creator monetization</p>
                <p className="text-sm text-muted-foreground">
                  Accept subscriptions and tips from fans through your connected Fanbasis account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
