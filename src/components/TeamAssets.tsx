import { useState, useEffect } from "react";
import { useTeamRole } from "@/hooks/useTeamRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Plus, GraduationCap, Users, FileSpreadsheet, BookOpen, Briefcase, 
  Loader2, Play, Link as LinkIcon, Pencil, Trash2, X, Video, FileText
} from "lucide-react";
import AssetUploadDialog from "./AssetUploadDialog";
import EditAssetDialog from "./EditAssetDialog";
import { toast } from "sonner";

interface TeamAsset {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string | null;
  file_type: string | null;
  loom_url: string | null;
  external_url: string | null;
  order_index?: number;
  created_at: string;
}

interface TeamAssetsProps {
  teamId: string;
}

const ASSET_CATEGORIES = [
  { id: "training", label: "TRAINING", icon: Video, color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { id: "resources", label: "SCRIPTS", icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500/20" },
  { id: "team_onboarding", label: "ONBOARDING", icon: Users, color: "text-emerald-500", bgColor: "bg-emerald-500/20" },
  { id: "tracking", label: "TRACKING SHEETS", icon: FileSpreadsheet, color: "text-pink-500", bgColor: "bg-pink-500/20" },
  { id: "client_onboarding", label: "COMPLETE OFFER", icon: Briefcase, color: "text-primary", bgColor: "bg-primary/20" },
];

// Helper to extract video embed URL
const getVideoEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  if (url.includes('loom.com')) {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match) return `https://www.loom.com/embed/${match[1]}`;
  }
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  
  if (url.includes('vimeo.com')) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }
  
  if (url.includes('wistia.com') || url.includes('wi.st')) {
    const match = url.match(/(?:wistia\.com\/medias\/|wi\.st\/medias\/)([a-zA-Z0-9]+)/);
    if (match) return `https://fast.wistia.net/embed/iframe/${match[1]}`;
  }
  
  return null;
};

// Video Player Modal
function VideoModal({ asset, onClose }: { asset: TeamAsset; onClose: () => void }) {
  const videoUrl = asset.loom_url || asset.external_url;
  const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null;

  if (!embedUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/10"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="bg-card rounded-2xl overflow-hidden shadow-2xl border border-border/50">
          <div className="p-4 border-b border-border/50 bg-card/80 backdrop-blur">
            <h3 className="font-semibold text-lg">{asset.title}</h3>
            {asset.description && (
              <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>
            )}
          </div>
          <div className="aspect-video bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Asset Item Component
function AssetItem({ 
  asset, 
  canManage, 
  onEdit, 
  onDelete, 
  onDownload,
  onPlayVideo
}: { 
  asset: TeamAsset; 
  canManage: boolean; 
  onEdit: (asset: TeamAsset) => void;
  onDelete: (asset: TeamAsset) => void;
  onDownload: (filePath: string, title: string) => void;
  onPlayVideo: (asset: TeamAsset) => void;
}) {
  const videoUrl = asset.loom_url || asset.external_url;
  const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null;
  const isVideo = !!embedUrl;

  const handleClick = () => {
    if (isVideo) {
      onPlayVideo(asset);
    } else if (asset.file_path) {
      onDownload(asset.file_path, asset.title);
    } else if (asset.external_url) {
      window.open(asset.external_url, "_blank");
    }
  };

  return (
    <div 
      className="group flex items-center gap-3 py-3 px-1 cursor-pointer hover:bg-muted/30 rounded-lg transition-all duration-200"
      onClick={handleClick}
    >
      {isVideo ? (
        <Play className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <LinkIcon className="h-4 w-4 text-primary shrink-0" />
      )}
      <span className="flex-1 text-sm font-medium group-hover:text-primary transition-colors truncate">
        {asset.title}
      </span>
      {canManage && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(asset);
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(asset);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Category Card Component
function CategoryCard({
  category,
  assets,
  canManage,
  onEdit,
  onDelete,
  onDownload,
  onPlayVideo,
  onAddAsset,
  isLarge = false,
}: {
  category: typeof ASSET_CATEGORIES[0];
  assets: TeamAsset[];
  canManage: boolean;
  onEdit: (asset: TeamAsset) => void;
  onDelete: (asset: TeamAsset) => void;
  onDownload: (filePath: string, title: string) => void;
  onPlayVideo: (asset: TeamAsset) => void;
  onAddAsset: () => void;
  isLarge?: boolean;
}) {
  const Icon = category.icon;
  const videoCount = assets.filter(a => getVideoEmbedUrl(a.loom_url || a.external_url || '')).length;
  const assetCount = assets.length;

  return (
    <div className={`rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-border hover:shadow-lg ${isLarge ? 'col-span-full' : ''}`}>
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${category.bgColor}`}>
              <Icon className={`h-5 w-5 ${category.color}`} />
            </div>
            <h3 className="font-bold text-base tracking-wide">{category.label}</h3>
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={onAddAsset}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </div>
        
        {/* Stats badges for larger cards */}
        {isLarge && assetCount > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm">
              <FileText className="h-4 w-4" />
              {assetCount} Assets
            </div>
            {videoCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm">
                <Video className="h-4 w-4" />
                {videoCount} Videos
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Assets List */}
      <div className="px-5 pb-5">
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No {category.label.toLowerCase()} materials yet.
          </p>
        ) : (
          <div className="space-y-0.5">
            {assets.map((asset) => (
              <AssetItem
                key={asset.id}
                asset={asset}
                canManage={canManage}
                onEdit={onEdit}
                onDelete={onDelete}
                onDownload={onDownload}
                onPlayVideo={onPlayVideo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamAssets({ teamId }: TeamAssetsProps) {
  const { isAdmin, role } = useTeamRole(teamId);
  const canManage = isAdmin || role === 'offer_owner' || role === 'admin';
  const [assets, setAssets] = useState<TeamAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<TeamAsset | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("training");
  const [videoModal, setVideoModal] = useState<TeamAsset | null>(null);

  useEffect(() => {
    loadAssets();
  }, [teamId]);

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("team_assets")
        .select("*")
        .eq("team_id", teamId)
        .order("category")
        .order("order_index");

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Error loading assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (asset: TeamAsset) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      if (asset.file_path) {
        await supabase.storage.from("team-assets").remove([asset.file_path]);
      }

      const { error } = await supabase
        .from("team_assets")
        .delete()
        .eq("id", asset.id);

      if (error) throw error;
      toast.success("Asset deleted");
      loadAssets();
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const handleDownload = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("team-assets")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const getAssetsByCategory = (categoryId: string) => {
    return assets.filter((asset) => asset.category === categoryId);
  };

  const openUploadWithCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setUploadDialogOpen(true);
  };

  // Calculate totals for hero section
  const totalAssets = assets.length;
  const totalVideos = assets.filter(a => getVideoEmbedUrl(a.loom_url || a.external_url || '')).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-background border border-primary/20 p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Team Assets</h2>
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Everything you need to succeed, all in one place
            </p>
            
            {/* Stats */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/50">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{totalAssets} Assets</span>
              </div>
              {totalVideos > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/50">
                  <Video className="h-4 w-4" />
                  <span className="text-sm font-medium">{totalVideos} Videos</span>
                </div>
              )}
            </div>
          </div>
          
          {canManage && (
            <Button 
              onClick={() => setUploadDialogOpen(true)} 
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Complete Offer - Full Width */}
      <CategoryCard
        category={ASSET_CATEGORIES.find(c => c.id === 'client_onboarding')!}
        assets={getAssetsByCategory('client_onboarding')}
        canManage={canManage}
        onEdit={(asset) => setEditAsset(asset)}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onPlayVideo={(asset) => setVideoModal(asset)}
        onAddAsset={() => openUploadWithCategory('client_onboarding')}
        isLarge
      />

      {/* 2x2 Grid for other categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ASSET_CATEGORIES.filter(c => c.id !== 'client_onboarding').map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            assets={getAssetsByCategory(category.id)}
            canManage={canManage}
            onEdit={(asset) => setEditAsset(asset)}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onPlayVideo={(asset) => setVideoModal(asset)}
            onAddAsset={() => openUploadWithCategory(category.id)}
          />
        ))}
      </div>

      {/* Video Modal */}
      {videoModal && (
        <VideoModal asset={videoModal} onClose={() => setVideoModal(null)} />
      )}

      {/* Dialogs */}
      <AssetUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        teamId={teamId}
        defaultCategory={selectedCategory}
        onSuccess={loadAssets}
      />

      {editAsset && (
        <EditAssetDialog
          open={!!editAsset}
          onOpenChange={(open) => !open && setEditAsset(null)}
          asset={editAsset}
          onSuccess={loadAssets}
        />
      )}
    </div>
  );
}
