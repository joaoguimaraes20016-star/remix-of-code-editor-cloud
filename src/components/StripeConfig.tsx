import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  CreditCard, 
  Check, 
  ExternalLink, 
  Copy, 
  AlertTriangle,
  Loader2
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

interface StripeConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

export function StripeConfig({ teamId, onUpdate }: StripeConfigProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: integration, isLoading } = useQuery({
    queryKey: ["stripe-integration-config", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations")
        .select("id, team_id, integration_type, is_connected, config, created_at, updated_at")
        .eq("team_id", teamId)
        .eq("integration_type", "stripe")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "stripe");
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripe-integration", teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-integrations", teamId] });
      toast.success("Stripe disconnected successfully");
      onUpdate?.();
    },
    onError: (error) => {
      console.error("Failed to disconnect Stripe:", error);
      toast.error("Failed to disconnect Stripe");
    },
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL || "https://kqfyevdblvgxaycdvfxe.supabase.co"}/functions/v1/stripe-user-webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConnected = integration?.is_connected;
  const config = integration?.config as Record<string, any> | null;
  const stripeAccountId = config?.stripe_account_id;
  const livemode = config?.livemode;

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <CreditCard className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">Not Connected</p>
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to accept payments and trigger automations
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">Stripe Connected</p>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              <Check className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Account: {stripeAccountId || "Connected"}
          </p>
        </div>
        {livemode !== undefined && (
          <Badge variant={livemode ? "default" : "outline"}>
            {livemode ? "Live" : "Test Mode"}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Webhook Configuration */}
      <div className="space-y-3">
        <h4 className="font-medium">Webhook Configuration</h4>
        <p className="text-sm text-muted-foreground">
          Add this webhook URL to your Stripe Dashboard to receive payment events
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
            {webhookUrl}
          </code>
          <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button variant="link" className="px-0 h-auto" asChild>
          <a
            href="https://dashboard.stripe.com/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm flex items-center gap-1"
          >
            Open Stripe Webhooks Dashboard
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>

      <Separator />

      {/* Available Automation Triggers */}
      <div className="space-y-3">
        <h4 className="font-medium">Available Automation Triggers</h4>
        <p className="text-sm text-muted-foreground">
          These events can trigger your automations when payments occur
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            "payment_received",
            "subscription_created",
            "subscription_cancelled",
            "invoice_paid",
            "refund_issued",
          ].map((trigger) => (
            <div
              key={trigger}
              className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm"
            >
              <Check className="h-3 w-3 text-primary" />
              <span>{trigger.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-3">
        <h4 className="font-medium text-destructive">Danger Zone</h4>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Disconnect Stripe
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Stripe?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the connection to your Stripe account. Any
                automations using Stripe triggers or actions will stop working.
                You can reconnect at any time.
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
      </div>
    </div>
  );
}
