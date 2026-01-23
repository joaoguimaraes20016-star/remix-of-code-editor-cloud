import { useState, useEffect } from "react";
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

interface SlackIntegration {
  access_token?: string;
  team_id?: string;
  team_name?: string;
  bot_user_id?: string;
  scope?: string;
  connected_at?: string;
}

export function SlackConfig({ teamId, onUpdate }: SlackConfigProps) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  // Fetch Slack integration status
  const { data: integration, isLoading, refetch } = useQuery({
    queryKey: ["slack-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations")
        .select("config")
        .eq("team_id", teamId)
        .eq("integration_type", "slack")
        .maybeSingle();

      if (error) throw error;
      return data?.config as SlackIntegration | null;
    },
    enabled: !!teamId,
  });

  const isConnected = !!integration?.access_token;

  // Handle OAuth message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "slack-oauth-success") {
        setConnecting(false);
        toast.success(`Connected to ${event.data.workspace || "Slack"}!`);
        refetch();
        onUpdate?.();
      } else if (event.data?.type === "slack-oauth-error") {
        setConnecting(false);
        toast.error(event.data.error || "Failed to connect Slack");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch, onUpdate]);

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
    try {
      setConnecting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to connect Slack");
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

      // Open popup for OAuth
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      window.open(
        authUrl,
        "slack-oauth",
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );
    } catch (error) {
      console.error("Slack OAuth error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start Slack connection");
      setConnecting(false);
    }
  };

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
                  ? `Connected to ${integration?.team_name || "Slack workspace"}`
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
                  <p className="font-medium">{integration?.team_name || "Unknown"}</p>
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
                      This will remove the connection to {integration?.team_name || "your Slack workspace"}.
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
