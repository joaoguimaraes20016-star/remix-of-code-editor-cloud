import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamRole } from "@/hooks/useTeamRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Layers, 
  Users, 
  FileText,
  ExternalLink,
  Play,
  ChevronRight,
  Loader2,
  Plus,
  Video,
  FileSpreadsheet,
  Briefcase,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { useState } from "react";
import AssetUploadDialog from "@/components/AssetUploadDialog";

interface TeamContext {
  teamName: string;
  teamLogo: string | null;
}

// Category configs with colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  training: { label: "Training", color: "text-orange-500", bgColor: "bg-orange-500/20", icon: Video },
  resources: { label: "Scripts", color: "text-blue-500", bgColor: "bg-blue-500/20", icon: BookOpen },
  team_onboarding: { label: "Onboarding", color: "text-emerald-500", bgColor: "bg-emerald-500/20", icon: Users },
  tracking: { label: "Tracking", color: "text-pink-500", bgColor: "bg-pink-500/20", icon: FileSpreadsheet },
  client_onboarding: { label: "Offer", color: "text-primary", bgColor: "bg-primary/20", icon: Briefcase },
};

export function TeamHubOverview() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { role, isAdmin } = useTeamRole(teamId || "");
  const { teamName, teamLogo } = useOutletContext<TeamContext>() || { teamName: "", teamLogo: null };
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Fetch team stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["team-hub-stats", teamId],
    queryFn: async () => {
      const [membersResult, assetsResult, appointmentsResult] = await Promise.all([
        supabase.from("team_members").select("id", { count: "exact" }).eq("team_id", teamId),
        supabase.from("team_assets").select("id", { count: "exact" }).eq("team_id", teamId),
        supabase.from("appointments").select("id", { count: "exact" }).eq("team_id", teamId).eq("status", "CLOSED"),
      ]);
      
      return {
        members: membersResult.count || 0,
        assets: assetsResult.count || 0,
        closedDeals: appointmentsResult.count || 0,
      };
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch team assets
  const { data: assets, isLoading: loadingAssets, refetch: refetchAssets } = useQuery({
    queryKey: ["team-hub-assets", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_assets")
        .select("*")
        .eq("team_id", teamId)
        .order("order_index", { ascending: true })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });

  const quickActions = [
    {
      title: "Sales CRM",
      description: "Pipeline & revenue tracking",
      icon: TrendingUp,
      path: `/team/${teamId}/crm`,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Funnels",
      description: "Lead capture forms",
      icon: Layers,
      path: `/team/${teamId}/funnels`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || { 
      label: category, 
      color: "text-muted-foreground", 
      bgColor: "bg-muted",
      icon: ExternalLink
    };
  };

  const isVideo = (asset: any) => {
    const url = asset.loom_url || asset.external_url || "";
    return url.includes('loom.com') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('wistia.com');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 rounded-lg">
            <AvatarImage src={teamLogo || undefined} className="object-cover" />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-lg font-semibold">
              {getInitials(teamName || "Team")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{teamName}</h1>
            <p className="text-muted-foreground">Team Overview</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {role || "Member"}
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold text-foreground">
                  {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.members}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Assets</p>
                <p className="text-2xl font-bold text-foreground">
                  {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.assets}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed Deals</p>
                <p className="text-2xl font-bold text-foreground">
                  {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.closedDeals}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.title}
            className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-primary/30"
            onClick={() => navigate(action.path)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg ${action.bgColor} flex items-center justify-center`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Assets */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Assets</CardTitle>
            <CardDescription>Training materials and resources</CardDescription>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setUploadDialogOpen(true)} 
              className="gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingAssets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : assets && assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => {
                const config = getCategoryConfig(asset.category);
                const CategoryIcon = config.icon;
                const videoAsset = isVideo(asset);
                
                return (
                  <Card 
                    key={asset.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-all border-border/50 hover:border-border group"
                    onClick={() => {
                      if (asset.loom_url) window.open(asset.loom_url, "_blank");
                      else if (asset.external_url) window.open(asset.external_url, "_blank");
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                          {videoAsset ? (
                            <Play className={`h-4 w-4 ${config.color}`} />
                          ) : (
                            <ExternalLink className={`h-4 w-4 ${config.color}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {asset.title}
                          </h4>
                          {asset.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{asset.description}</p>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`mt-2 text-xs border-0 ${config.bgColor} ${config.color}`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No assets yet</p>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assets
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      {teamId && (
        <AssetUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          teamId={teamId}
          onSuccess={() => refetchAssets()}
        />
      )}
    </div>
  );
}
