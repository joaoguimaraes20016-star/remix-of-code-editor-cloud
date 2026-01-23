import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Webhook, 
  Video, 
  BarChart3,
  Zap,
  Check,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendlyConfig } from "./CalendlyConfig";
import { SlackConfig } from "./SlackConfig";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "scheduling" | "automation" | "analytics" | "video";
  status: "connected" | "available" | "coming_soon";
  configurable?: boolean;
}

const integrations: Integration[] = [
  {
    id: "calendly",
    name: "Calendly",
    description: "Sync appointments and booking links",
    icon: Calendar,
    category: "scheduling",
    status: "available",
    configurable: true,
  },
  {
    id: "ghl",
    name: "GoHighLevel",
    description: "CRM and automation webhooks",
    icon: Webhook,
    category: "automation",
    status: "available",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to 5,000+ apps",
    icon: Zap,
    category: "automation",
    status: "available",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Team messaging and notifications",
    icon: MessageSquare,
    category: "automation",
    status: "available",
    configurable: true,
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Video conferencing",
    icon: Video,
    category: "video",
    status: "coming_soon",
  },
  {
    id: "google_meet",
    name: "Google Meet",
    description: "Video meetings",
    icon: Video,
    category: "video",
    status: "coming_soon",
  },
  {
    id: "meta_pixel",
    name: "Meta Pixel",
    description: "Facebook & Instagram tracking",
    icon: BarChart3,
    category: "analytics",
    status: "available",
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    description: "Website analytics",
    icon: BarChart3,
    category: "analytics",
    status: "available",
  },
];

const categoryLabels: Record<string, string> = {
  scheduling: "Scheduling",
  automation: "Automation",
  analytics: "Analytics",
  video: "Video Conferencing",
};

export function IntegrationsPortal() {
  const { teamId } = useParams();
  const [calendlyDialogOpen, setCalendlyDialogOpen] = useState(false);
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);

  const { data: teamData, refetch } = useQuery({
    queryKey: ["team-integrations-portal", teamId],
    queryFn: async () => {
      const [teamsResult, integrationsResult] = await Promise.all([
        supabase
          .from("teams")
          .select("calendly_access_token, calendly_organization_uri, calendly_webhook_id, calendly_event_types, calendly_enabled_for_funnels, calendly_enabled_for_crm")
          .eq("id", teamId)
          .single(),
        supabase
          .from("team_integrations_public" as any)
          .select("integration_type, is_connected")
          .eq("team_id", teamId),
      ]);
      
      if (teamsResult.error) throw teamsResult.error;
      
      const integrations = ((integrationsResult.data || []) as unknown) as Array<{
        integration_type: string;
        is_connected: boolean;
      }>;
      
      const slackIntegration = integrations.find(i => i.integration_type === "slack");
      
      return {
        ...teamsResult.data,
        slack_connected: slackIntegration?.is_connected ?? false,
      };
    },
    enabled: !!teamId,
  });

  const isCalendlyConnected = !!teamData?.calendly_access_token;
  const isSlackConnected = !!teamData?.slack_connected;

  const getIntegrationStatus = (integration: Integration) => {
    if (integration.id === "calendly" && isCalendlyConnected) {
      return "connected";
    }
    if (integration.id === "slack" && isSlackConnected) {
      return "connected";
    }
    return integration.status;
  };

  const handleIntegrationClick = (integration: Integration) => {
    if (integration.id === "calendly") {
      setCalendlyDialogOpen(true);
    }
    if (integration.id === "slack") {
      setSlackDialogOpen(true);
    }
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect your favorite tools and services
        </p>
      </div>

      {Object.entries(groupedIntegrations).map(([category, items]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {categoryLabels[category]}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((integration) => {
              const status = getIntegrationStatus(integration);
              const Icon = integration.icon;
              
              return (
                <Card
                  key={integration.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-border/50",
                    status === "connected" && "border-primary/30 bg-primary/5",
                    status === "coming_soon" && "opacity-60 cursor-not-allowed"
                  )}
                  onClick={() => status !== "coming_soon" && handleIntegrationClick(integration)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          status === "connected" ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5",
                            status === "connected" ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                        </div>
                      </div>
                      {status === "connected" && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {status === "coming_soon" && (
                        <Badge variant="outline" className="text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                    {status !== "coming_soon" && (
                      <div className="flex items-center gap-1 mt-3 text-sm text-primary">
                        <span>{status === "connected" ? "Manage" : "Connect"}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Calendly Configuration Dialog */}
      <Dialog open={calendlyDialogOpen} onOpenChange={setCalendlyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calendly Integration</DialogTitle>
          </DialogHeader>
          {teamId && (
            <CalendlyConfig 
              teamId={teamId} 
              currentAccessToken={teamData?.calendly_access_token}
              currentOrgUri={teamData?.calendly_organization_uri}
              currentWebhookId={teamData?.calendly_webhook_id}
              currentEventTypes={teamData?.calendly_event_types}
              calendlyEnabledForFunnels={teamData?.calendly_enabled_for_funnels ?? false}
              calendlyEnabledForCrm={teamData?.calendly_enabled_for_crm ?? false}
              onUpdate={() => refetch()}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Slack Configuration Dialog */}
      <Dialog open={slackDialogOpen} onOpenChange={setSlackDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Slack Integration</DialogTitle>
          </DialogHeader>
          {teamId && (
            <SlackConfig 
              teamId={teamId}
              onUpdate={() => refetch()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
