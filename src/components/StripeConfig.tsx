import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Check,
  ExternalLink,
  Copy,
  Loader2,
  Zap,
  Settings,
  LayoutDashboard,
  Package,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface StripeConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

const AUTOMATION_TRIGGERS = [
  { id: "payment_received", label: "Payment Received", color: "bg-emerald-500" },
  { id: "subscription_created", label: "Subscription Created", color: "bg-blue-500" },
  { id: "subscription_cancelled", label: "Subscription Cancelled", color: "bg-orange-500" },
  { id: "invoice_paid", label: "Invoice Paid", color: "bg-violet-500" },
  { id: "refund_issued", label: "Refund Issued", color: "bg-red-500" },
];

const QUICK_ACTIONS = [
  {
    id: "dashboard",
    label: "Stripe Dashboard",
    description: "View your full Stripe account",
    icon: LayoutDashboard,
    url: "https://dashboard.stripe.com",
  },
  {
    id: "products",
    label: "Manage Products",
    description: "Create & edit products",
    icon: Package,
    url: "https://dashboard.stripe.com/products",
  },
  {
    id: "payments",
    label: "View Payments",
    description: "See recent transactions",
    icon: Zap,
    url: "https://dashboard.stripe.com/payments",
  },
  {
    id: "settings",
    label: "Account Settings",
    description: "Configure your account",
    icon: Settings,
    url: "https://dashboard.stripe.com/settings",
  },
];

export function StripeConfig({ teamId, onUpdate }: StripeConfigProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);

  const { data: integration, isLoading } = useQuery({
    queryKey: ["stripe-integration-config", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations_public" as any)
        .select("id, team_id, integration_type, is_connected, config_safe, created_at, updated_at")
        .eq("team_id", teamId)
        .eq("integration_type", "stripe")
        .maybeSingle();

      if (error) throw error;
      return data as unknown as {
        id: string;
        team_id: string;
        integration_type: string;
        is_connected: boolean;
        config_safe: Record<string, any> | null;
        created_at: string;
        updated_at: string;
      } | null;
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
    toast.success("Webhook URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const config = integration?.config_safe;
  const stripeAccountId = config?.stripe_account_id;
  const livemode = config?.livemode;

  return (
    <div className="space-y-6">
      {/* Connection Status Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-5 text-white">
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg">Stripe Connected</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                <Check className="h-3 w-3" />
                Active
              </span>
              {livemode !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  livemode ? "bg-emerald-500/80" : "bg-amber-500/80"
                }`}>
                  {livemode ? "Live" : "Test"}
                </span>
              )}
            </div>
            <p className="text-sm text-white/70 font-mono">
              {stripeAccountId || "Account connected"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.id}
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <action.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{action.label}</p>
                <p className="text-xs text-muted-foreground truncate">{action.description}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </div>

      {/* Webhook Configuration - Collapsible */}
      <Collapsible open={webhookOpen} onOpenChange={setWebhookOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Webhook Setup</p>
                <p className="text-xs text-muted-foreground">Configure event notifications</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${webhookOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Add this webhook URL to your Stripe Dashboard to receive payment events and trigger automations.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 bg-muted rounded-lg text-xs font-mono text-foreground truncate">
              {webhookUrl}
            </code>
            <Button variant="outline" size="icon" onClick={copyWebhookUrl} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="link" className="px-0 h-auto text-sm" asChild>
            <a
              href="https://dashboard.stripe.com/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary"
            >
              Open Stripe Webhooks Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Available Automation Triggers */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Automation Triggers</h4>
        <p className="text-xs text-muted-foreground mb-3">
          These events can trigger your automations when payments occur.
        </p>
        <div className="flex flex-wrap gap-2">
          {AUTOMATION_TRIGGERS.map((trigger) => (
            <div
              key={trigger.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm"
            >
              <span className={`w-2 h-2 rounded-full ${trigger.color}`} />
              <span className="text-foreground">{trigger.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disconnect - Minimal */}
      <div className="pt-2 border-t border-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="text-sm text-destructive hover:underline">
              Disconnect Stripe Account
            </button>
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
                {disconnectMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
