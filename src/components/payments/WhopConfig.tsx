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
  LayoutDashboard,
  Package,
  Users,
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


interface WhopConfigProps {
  teamId: string;
  onUpdate?: () => void;
}

const AUTOMATION_TRIGGERS = [
  { id: "payment_received", label: "Payment Received", color: "bg-emerald-500" },
  { id: "subscription_created", label: "Membership Activated", color: "bg-blue-500" },
  { id: "subscription_cancelled", label: "Membership Deactivated", color: "bg-orange-500" },
];

const QUICK_ACTIONS = [
  {
    id: "dashboard",
    label: "Whop Dashboard",
    description: "View your Whop account",
    icon: LayoutDashboard,
    url: "https://dash.whop.com",
  },
  {
    id: "products",
    label: "Manage Products",
    description: "Create & edit products",
    icon: Package,
    url: "https://dash.whop.com/products",
  },
  {
    id: "memberships",
    label: "View Members",
    description: "See active memberships",
    icon: Users,
    url: "https://dash.whop.com/memberships",
  },
  {
    id: "webhooks",
    label: "Webhooks",
    description: "Configure webhooks",
    icon: Zap,
    url: "https://dash.whop.com/settings/developer",
  },
];

export function WhopConfig({ teamId, onUpdate }: WhopConfigProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);

  const { data: integration, isLoading } = useQuery({
    queryKey: ["whop-integration-config", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_integrations")
        .select("id, team_id, integration_type, is_connected, config, created_at, updated_at")
        .eq("team_id", teamId)
        .eq("integration_type", "whop")
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
        .eq("integration_type", "whop");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whop-integration", teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-integrations", teamId] });
      toast.success("Whop disconnected successfully");
      onUpdate?.();
    },
    onError: (error) => {
      console.error("Failed to disconnect Whop:", error);
      toast.error("Failed to disconnect Whop");
    },
  });

  const webhookUrl = `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/whop-webhook?teamId=${teamId}`;

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

  const config = integration?.config as Record<string, any> | null;
  const companyId = config?.company_id;
  const companyName = config?.company_name;

  return (
    <div className="space-y-6">
      {/* Connection Status Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-5 text-white">
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 75 C15 75 25 25 35 25 C45 25 40 60 50 60 C60 60 55 25 65 25 C75 25 85 75 85 75" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg">Whop Connected</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                <Check className="h-3 w-3" />
                Active
              </span>
            </div>
            <p className="text-sm text-white/70 font-mono">
              {companyName || companyId || "Account connected"}
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
            Add this webhook URL to your Whop Developer settings to receive membership and payment events.
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
              href="https://dash.whop.com/settings/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary"
            >
              Open Whop Developer Settings
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Available Automation Triggers */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Automation Triggers</h4>
        <p className="text-xs text-muted-foreground mb-3">
          These events can trigger your automations when memberships change.
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
              Disconnect Whop Account
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Whop?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the connection to your Whop account. Any
                automations using Whop triggers or actions will stop working.
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
