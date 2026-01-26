import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendlyConfig } from "@/components/CalendlyConfig";
import { SlackConfig } from "@/components/SlackConfig";
import { ZoomConfig } from "@/components/ZoomConfig";
import { TypeformConfig } from "@/components/TypeformConfig";
import { DiscordConfig } from "@/components/DiscordConfig";
import { FathomConfig } from "@/components/FathomConfig";
import { MetaConfig } from "@/components/MetaConfig";
import { GoogleAdsConfig } from "@/components/GoogleAdsConfig";
import { TikTokConfig } from "@/components/TikTokConfig";
import { GoogleFeatureCard, GoogleFeature } from "@/components/GoogleFeatureCard";
import { GoogleAccountBanner } from "@/components/GoogleAccountBanner";
import { Check, ExternalLink, Lock } from "lucide-react";

// Import logos
import calendlyLogo from "@/assets/integrations/calendly.svg";
import zoomLogo from "@/assets/integrations/zoom.svg";
import zapierLogo from "@/assets/integrations/zapier.svg";
import slackLogo from "@/assets/integrations/slack.svg";
import typeformLogo from "@/assets/integrations/typeform.svg";
import discordLogo from "@/assets/integrations/discord.svg";
import fathomLogo from "@/assets/integrations/fathom.svg";
import metaLogo from "@/assets/integrations/meta.svg";
import googleAdsLogo from "@/assets/integrations/google-ads.svg";
import tiktokLogo from "@/assets/integrations/tiktok.svg";

// Google features - excludes signin (handled by banner)
const GOOGLE_FEATURES: Array<{
  feature: GoogleFeature;
  name: string;
  description: string;
  logo: string;
  usageInstructions: string[];
}> = [
  {
    feature: "sheets",
    name: "Google Sheets",
    description: "Sync leads and data with spreadsheets",
    logo: "https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png",
    usageInstructions: [
      "Go to Automations and create a new workflow",
      "Add 'Export to Google Sheets' action",
      "Select your spreadsheet and configure mapping",
    ],
  },
  {
    feature: "calendar",
    name: "Google Calendar",
    description: "Sync appointments and create events",
    logo: "https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png",
    usageInstructions: [
      "Use in booking flows to create calendar events",
      "Calendar events include Google Meet links automatically",
      "Sync appointments with your team calendars",
    ],
  },
  {
    feature: "drive",
    name: "Google Drive",
    description: "Access and manage files",
    logo: "https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png",
    usageInstructions: [
      "Upload attachments to Google Drive",
      "Access files from automations",
      "Store documents securely in the cloud",
    ],
  },
  {
    feature: "forms",
    name: "Google Forms",
    description: "Collect form responses as leads",
    logo: "https://www.gstatic.com/images/branding/product/1x/forms_2020q4_48dp.png",
    usageInstructions: [
      "Connect your Google Forms to capture responses",
      "Automatically create leads from form submissions",
      "Trigger automations on new responses",
    ],
  },
];

interface App {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: "scheduling" | "communication" | "analytics" | "ads";
  status: "connected" | "available" | "coming_soon";
  configurable?: boolean;
}

// Non-Google apps
const apps: App[] = [
  {
    id: "calendly",
    name: "Calendly",
    description: "Scheduling and appointment booking",
    logo: calendlyLogo,
    category: "scheduling",
    status: "available",
    configurable: true,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to 5000+ apps",
    logo: zapierLogo,
    category: "communication",
    status: "available",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Team messaging and notifications",
    logo: slackLogo,
    category: "communication",
    status: "available",
    configurable: true,
  },
  {
    id: "discord",
    name: "Discord",
    description: "Server notifications and messages",
    logo: discordLogo,
    category: "communication",
    status: "available",
    configurable: true,
  },
  {
    id: "typeform",
    name: "Typeform",
    description: "Form responses and lead capture",
    logo: typeformLogo,
    category: "analytics",
    status: "available",
    configurable: true,
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Video conferencing",
    logo: zoomLogo,
    category: "scheduling",
    status: "available",
    configurable: true,
  },
  {
    id: "fathom",
    name: "Fathom",
    description: "Meeting recordings and transcriptions",
    logo: fathomLogo,
    category: "scheduling",
    status: "available",
    configurable: true,
  },
  {
    id: "meta",
    name: "Meta",
    description: "Facebook & Instagram ads and lead forms",
    logo: metaLogo,
    category: "ads",
    status: "available",
    configurable: true,
  },
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Conversion tracking and lead forms",
    logo: googleAdsLogo,
    category: "ads",
    status: "available",
    configurable: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Social media content and analytics",
    logo: tiktokLogo,
    category: "ads",
    status: "available",
    configurable: true,
  },
];

const categoryLabels: Record<string, string> = {
  scheduling: "Scheduling",
  communication: "Communication",
  analytics: "Analytics",
  ads: "Ads & Marketing",
};

export default function AppsPortal() {
  const { teamId } = useParams();
  const [calendlyDialogOpen, setCalendlyDialogOpen] = useState(false);
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);
  const [typeformDialogOpen, setTypeformDialogOpen] = useState(false);
  const [discordDialogOpen, setDiscordDialogOpen] = useState(false);
  const [fathomDialogOpen, setFathomDialogOpen] = useState(false);
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [googleAdsDialogOpen, setGoogleAdsDialogOpen] = useState(false);
  const [tiktokDialogOpen, setTiktokDialogOpen] = useState(false);

  // Fetch team integrations from secure view (tokens masked)
  const { data: teamData, refetch } = useQuery({
    queryKey: ["team-integrations", teamId],
    queryFn: async () => {
      const [teamsResult, integrationsResult] = await Promise.all([
        supabase
          .from("teams")
          .select("calendly_access_token, calendly_webhook_id")
          .eq("id", teamId)
          .single(),
        supabase
          .from("team_integrations_public" as any)
          .select("integration_type, is_connected, config_safe")
          .eq("team_id", teamId),
      ]);
      
      if (teamsResult.error) throw teamsResult.error;
      
      const integrations = ((integrationsResult.data || []) as unknown) as Array<{
        integration_type: string;
        is_connected: boolean;
        config_safe: Record<string, unknown> | null;
      }>;
      
      const slackIntegration = integrations.find(i => i.integration_type === "slack");
      const zoomIntegration = integrations.find(i => i.integration_type === "zoom");
      const typeformIntegration = integrations.find(i => i.integration_type === "typeform");
      const googleIntegration = integrations.find(i => i.integration_type === "google");
      const discordIntegration = integrations.find(i => i.integration_type === "discord");
      const fathomIntegration = integrations.find(i => i.integration_type === "fathom");
      const metaIntegration = integrations.find(i => i.integration_type === "meta");
      const googleAdsIntegration = integrations.find(i => i.integration_type === "google_ads");
      const tiktokIntegration = integrations.find(i => i.integration_type === "tiktok");
      
      return {
        ...teamsResult.data,
        slack_connected: slackIntegration?.is_connected ?? false,
        zoom_connected: zoomIntegration?.is_connected ?? false,
        typeform_connected: typeformIntegration?.is_connected ?? false,
        discord_connected: discordIntegration?.is_connected ?? false,
        fathom_connected: fathomIntegration?.is_connected ?? false,
        meta_connected: metaIntegration?.is_connected ?? false,
        google_ads_connected: googleAdsIntegration?.is_connected ?? false,
        tiktok_connected: tiktokIntegration?.is_connected ?? false,
        google_connected: googleIntegration?.is_connected ?? false,
        google_email: (googleIntegration?.config_safe as any)?.email ?? null,
        google_connected_at: (googleIntegration?.config_safe as any)?.connected_at ?? null,
        google_enabled_features: (googleIntegration?.config_safe as any)?.enabled_features ?? {
          sheets: false,
          calendar: false,
          drive: false,
          forms: false,
        },
      };
    },
    enabled: !!teamId,
  });

  const getAppStatus = (app: App): App["status"] => {
    if (app.id === "calendly" && teamData?.calendly_access_token) {
      return "connected";
    }
    if (app.id === "slack" && teamData?.slack_connected) {
      return "connected";
    }
    if (app.id === "zoom" && teamData?.zoom_connected) {
      return "connected";
    }
    if (app.id === "typeform" && teamData?.typeform_connected) {
      return "connected";
    }
    if (app.id === "discord" && teamData?.discord_connected) {
      return "connected";
    }
    if (app.id === "fathom" && teamData?.fathom_connected) {
      return "connected";
    }
    if (app.id === "meta" && teamData?.meta_connected) {
      return "connected";
    }
    if (app.id === "google_ads" && teamData?.google_ads_connected) {
      return "connected";
    }
    if (app.id === "tiktok" && teamData?.tiktok_connected) {
      return "connected";
    }
    return app.status;
  };

  const handleAppClick = (app: App) => {
    if (app.id === "calendly" && app.configurable) {
      setCalendlyDialogOpen(true);
    }
    if (app.id === "slack" && app.configurable) {
      setSlackDialogOpen(true);
    }
    if (app.id === "zoom" && app.configurable) {
      setZoomDialogOpen(true);
    }
    if (app.id === "typeform" && app.configurable) {
      setTypeformDialogOpen(true);
    }
    if (app.id === "discord" && app.configurable) {
      setDiscordDialogOpen(true);
    }
    if (app.id === "fathom" && app.configurable) {
      setFathomDialogOpen(true);
    }
    if (app.id === "meta" && app.configurable) {
      setMetaDialogOpen(true);
    }
    if (app.id === "google_ads" && app.configurable) {
      setGoogleAdsDialogOpen(true);
    }
    if (app.id === "tiktok" && app.configurable) {
      setTiktokDialogOpen(true);
    }
  };

  // Group apps by category
  const groupedApps = apps.reduce((acc, app) => {
    if (!acc[app.category]) acc[app.category] = [];
    acc[app.category].push(app);
    return acc;
  }, {} as Record<string, App[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Apps</h1>
          <p className="text-muted-foreground mt-1">
            Connect your favorite tools and services
          </p>
        </div>

        <div className="space-y-10">
          {/* Google Workspace Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Google Workspace
            </h2>
            
            {/* Master Identity Banner */}
            <GoogleAccountBanner
              teamId={teamId || ""}
              isConnected={teamData?.google_connected ?? false}
              connectedEmail={teamData?.google_email}
              connectedAt={teamData?.google_connected_at}
              onUpdate={refetch}
            />

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {GOOGLE_FEATURES.map((gf) => (
                <GoogleFeatureCard
                  key={gf.feature}
                  feature={gf.feature}
                  teamId={teamId || ""}
                  name={gf.name}
                  description={gf.description}
                  logo={gf.logo}
                  isConnected={teamData?.google_connected ?? false}
                  isEnabled={teamData?.google_enabled_features?.[gf.feature] ?? false}
                  connectedEmail={teamData?.google_email}
                  connectedAt={teamData?.google_connected_at}
                  usageInstructions={gf.usageInstructions}
                  onUpdate={refetch}
                />
              ))}
            </div>
          </div>

          {/* Other App Categories */}
          {Object.entries(groupedApps).map(([category, categoryApps]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {categoryLabels[category]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryApps.map((app) => {
                  const status = getAppStatus(app);
                  const isConnected = status === "connected";
                  const isComingSoon = status === "coming_soon";

                  return (
                    <Card
                      key={app.id}
                      className={`border-border/50 transition-all ${
                        isComingSoon 
                          ? "opacity-60 cursor-not-allowed" 
                          : "hover:border-primary/30 hover:shadow-md cursor-pointer"
                      }`}
                      onClick={() => !isComingSoon && handleAppClick(app)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            <img 
                              src={app.logo} 
                              alt={app.name}
                              className="h-8 w-8 object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground truncate">
                                {app.name}
                              </h3>
                              {isConnected && (
                                <Badge variant="secondary" className="bg-success/10 text-success border-0">
                                  <Check className="h-3 w-3 mr-1" />
                                  Connected
                                </Badge>
                              )}
                              {isComingSoon && (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Soon
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {app.description}
                            </p>
                          </div>
                        </div>
                        {!isComingSoon && (
                          <Button
                            variant={isConnected ? "outline" : "default"}
                            size="sm"
                            className="w-full mt-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppClick(app);
                            }}
                          >
                            {isConnected ? "Manage" : "Connect"}
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Calendly Config Dialog */}
        <Dialog open={calendlyDialogOpen} onOpenChange={setCalendlyDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={calendlyLogo} alt="Calendly" className="h-6 w-6" />
                Calendly Configuration
              </DialogTitle>
            </DialogHeader>
            <CalendlyConfig teamId={teamId || ""} onUpdate={refetch} />
          </DialogContent>
        </Dialog>

        {/* Slack Config Dialog */}
        <Dialog open={slackDialogOpen} onOpenChange={setSlackDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={slackLogo} alt="Slack" className="h-6 w-6" />
                Slack Configuration
              </DialogTitle>
            </DialogHeader>
            <SlackConfig teamId={teamId || ""} onUpdate={refetch} />
          </DialogContent>
        </Dialog>

        {/* Zoom Config Dialog */}
        <Dialog open={zoomDialogOpen} onOpenChange={setZoomDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={zoomLogo} alt="Zoom" className="h-6 w-6" />
                Zoom Configuration
              </DialogTitle>
            </DialogHeader>
            <ZoomConfig teamId={teamId || ""} onUpdate={refetch} />
          </DialogContent>
        </Dialog>

        {/* Typeform Config Dialog */}
        <Dialog open={typeformDialogOpen} onOpenChange={setTypeformDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={typeformLogo} alt="Typeform" className="h-6 w-6" />
                Typeform Configuration
              </DialogTitle>
            </DialogHeader>
            <TypeformConfig teamId={teamId || ""} onUpdate={refetch} />
          </DialogContent>
        </Dialog>

        {/* Discord Config Dialog */}
        <Dialog open={discordDialogOpen} onOpenChange={setDiscordDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={discordLogo} alt="Discord" className="h-6 w-6" />
                Discord Configuration
              </DialogTitle>
            </DialogHeader>
            <DiscordConfig teamId={teamId || ""} onUpdate={refetch} />
          </DialogContent>
        </Dialog>

        {/* Fathom Config Dialog */}
        <Dialog open={fathomDialogOpen} onOpenChange={setFathomDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={fathomLogo} alt="Fathom" className="h-6 w-6" />
                Fathom Configuration
              </DialogTitle>
            </DialogHeader>
            <FathomConfig teamId={teamId || ""} onUpdate={refetch} />
          </DialogContent>
        </Dialog>

        {/* Meta Config Dialog */}
        <Dialog open={metaDialogOpen} onOpenChange={setMetaDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={metaLogo} alt="Meta" className="h-6 w-6" />
                Meta Configuration
              </DialogTitle>
            </DialogHeader>
            <MetaConfig teamId={teamId || ""} onUpdate={refetch} />
          </DialogContent>
        </Dialog>

        {/* Google Ads Config Dialog */}
        <Dialog open={googleAdsDialogOpen} onOpenChange={setGoogleAdsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={googleAdsLogo} alt="Google Ads" className="h-6 w-6" />
                Google Ads Configuration
              </DialogTitle>
            </DialogHeader>
            <GoogleAdsConfig teamId={teamId || ""} onUpdate={refetch} />
          </DialogContent>
        </Dialog>

        {/* TikTok Config Dialog */}
        <Dialog open={tiktokDialogOpen} onOpenChange={setTiktokDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={tiktokLogo} alt="TikTok" className="h-6 w-6" />
                TikTok Configuration
              </DialogTitle>
            </DialogHeader>
            <TikTokConfig teamId={teamId || ""} onUpdate={refetch} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
