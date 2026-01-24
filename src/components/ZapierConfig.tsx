import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ExternalLink, Copy, Zap, RefreshCw, Unplug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ZapierConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

export function ZapierConfig({ teamId, onUpdate }: ZapierConfigProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: integration, isLoading } = useQuery({
    queryKey: ["zapier-integration", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("*")
        .eq("team_id", teamId)
        .eq("integration_type", "zapier")
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as { is_connected: boolean; config: Record<string, any> | null } | null;
    },
    enabled: !!teamId,
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations" as any)
        .update({
          is_connected: false,
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
        })
        .eq("team_id", teamId)
        .eq("integration_type", "zapier");
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Zapier integration has been disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ["zapier-integration", teamId] });
      onUpdate?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to disconnect integration.",
        variant: "destructive",
      });
      console.error("Disconnect error:", error);
    },
  });

  const isConnected = integration?.is_connected;
  const config = integration?.config as Record<string, any> | null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied",
      description: `${field} copied to clipboard`,
    });
  };

  const endpoints = {
    authorize: "https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-oauth-authorize",
    token: "https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-oauth-token",
    refresh: "https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-oauth-refresh",
    triggers: "https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-triggers",
    actions: "https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-actions",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isConnected ? "bg-primary/10" : "bg-muted"}`}>
            <Zap className={`h-5 w-5 ${isConnected ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="font-medium">Zapier Integration</p>
            <p className="text-sm text-muted-foreground">
              {isConnected 
                ? `Connected ${config?.connected_at ? `on ${new Date(config.connected_at).toLocaleDateString()}` : ""}`
                : "Not connected"}
            </p>
          </div>
        </div>
        {isConnected ? (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
            <Check className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        ) : (
          <Badge variant="outline">Not Connected</Badge>
        )}
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup in Zapier Developer Platform</CardTitle>
          <CardDescription>
            Use these URLs when creating your private Zapier integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to <a href="https://developer.zapier.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                Zapier Developer Platform <ExternalLink className="h-3 w-3" />
              </a></li>
              <li>Create a new Integration → Choose "API Integration"</li>
              <li>Select "OAuth 2.0" as authentication type</li>
              <li>Use the URLs below for your OAuth configuration</li>
            </ol>
          </div>

          <div className="space-y-3">
            {Object.entries(endpoints).map(([key, url]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground capitalize mb-1">
                    {key.replace("_", " ")} URL
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                    {url}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(url, key)}
                  className="shrink-0"
                >
                  {copiedField === key ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Triggers & Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Triggers (From Infostack)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                New Lead Created
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                New Appointment Booked
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Lead Status Changed
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Actions (To Infostack)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Create Lead/Contact
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Update Lead/Contact
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                Add Note to Lead
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Disconnect Button */}
      {isConnected && (
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
          >
            <Unplug className="h-4 w-4 mr-2" />
            {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect Zapier"}
          </Button>
        </div>
      )}
    </div>
  );
}
