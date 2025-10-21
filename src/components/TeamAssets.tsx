import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeamRole } from '@/hooks/useTeamRole';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Video, Link as LinkIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AssetUploadDialog from './AssetUploadDialog';

interface TeamAsset {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string | null;
  file_type: string | null;
  loom_url: string | null;
  external_url: string | null;
  created_at: string;
}

interface TeamAssetsProps {
  teamId: string;
}

export default function TeamAssets({ teamId }: TeamAssetsProps) {
  const { user } = useAuth();
  const { isOwner } = useTeamRole(teamId);
  const [assets, setAssets] = useState<TeamAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('team_assets')
        .select('*')
        .eq('team_id', teamId)
        .order('category')
        .order('order_index');

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load team assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [teamId]);

  const handleDelete = async (assetId: string, filePath: string | null) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('team-assets')
          .remove([filePath]);

        if (storageError) throw storageError;
      }

      const { error } = await supabase
        .from('team_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      toast.success('Asset deleted');
      loadAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const handleDownload = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('team-assets')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const offerAssets = assets.filter((a) => a.category === 'offer');
  const scriptAssets = assets.filter((a) => a.category === 'scripts');
  const onboardingAssets = assets.filter((a) => a.category === 'onboarding');
  const trackingAssets = assets.filter((a) => a.category === 'tracking');
  const trainingAssets = assets.filter((a) => a.category === 'training');

  const handleAssetClick = (asset: TeamAsset) => {
    if (asset.file_path) {
      handleDownload(asset.file_path, asset.title);
    } else if (asset.loom_url) {
      window.open(asset.loom_url, '_blank');
    } else if (asset.external_url) {
      window.open(asset.external_url, '_blank');
    }
  };

  return (
    <div className="space-y-12 max-w-5xl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-8">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <span className="text-4xl">👋</span>
            Welcome to your team!
          </h2>
          {isOwner && (
            <Button
              onClick={() => setUploadDialogOpen(true)}
              variant="outline"
              className="mt-4 bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Asset
            </Button>
          )}
        </div>
      </div>

      {/* Complete Offer Section */}
      {(offerAssets.length > 0 || isOwner) && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-muted/30 border border-border">
            <h3 className="text-xl font-bold mb-4 uppercase tracking-wide">
              Complete Offer (Click Below)
            </h3>
            <div className="space-y-2">
              {offerAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleAssetClick(asset)}
                  className="group w-full text-left px-4 py-3 rounded-lg hover:bg-primary/10 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-lg text-primary hover:underline">
                      {asset.title}
                    </span>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset.id, asset.file_path);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </button>
              ))}
              {offerAssets.length === 0 && isOwner && (
                <p className="text-sm text-muted-foreground px-4">No assets yet. Click "Add New Asset" above.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout for other sections */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Scripts Section */}
        {(scriptAssets.length > 0 || isOwner) && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold uppercase tracking-wide underline decoration-primary/30 underline-offset-8">
              Scripts
            </h3>
            <div className="space-y-3">
              {scriptAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleAssetClick(asset)}
                  className="group w-full text-left block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-primary/80 hover:text-primary hover:underline uppercase tracking-wide transition-colors">
                      {asset.title} (Click Here)
                    </span>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.id, asset.file_path);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </button>
              ))}
              {scriptAssets.length === 0 && isOwner && (
                <p className="text-sm text-muted-foreground">No scripts yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Onboarding Section */}
        {(onboardingAssets.length > 0 || isOwner) && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold uppercase tracking-wide underline decoration-primary/30 underline-offset-8">
              Onboarding
            </h3>
            <div className="space-y-3">
              {onboardingAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleAssetClick(asset)}
                  className="group w-full text-left block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-primary/80 hover:text-primary hover:underline uppercase tracking-wide transition-colors">
                      {asset.title} (Click Here)
                    </span>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.id, asset.file_path);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </button>
              ))}
              {onboardingAssets.length === 0 && isOwner && (
                <p className="text-sm text-muted-foreground">No onboarding materials yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tracking Sheets Section */}
        {(trackingAssets.length > 0 || isOwner) && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold uppercase tracking-wide underline decoration-primary/30 underline-offset-8">
              Tracking Sheets
            </h3>
            <div className="space-y-3">
              {trackingAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleAssetClick(asset)}
                  className="group w-full text-left block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-primary/80 hover:text-primary hover:underline uppercase tracking-wide transition-colors">
                      {asset.title} (Click Here)
                    </span>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.id, asset.file_path);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </button>
              ))}
              {trackingAssets.length === 0 && isOwner && (
                <p className="text-sm text-muted-foreground">No tracking sheets yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Training Section */}
        {(trainingAssets.length > 0 || isOwner) && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold uppercase tracking-wide underline decoration-primary/30 underline-offset-8">
              Training
            </h3>
            <div className="space-y-3">
              {trainingAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleAssetClick(asset)}
                  className="group w-full text-left block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-primary/80 hover:text-primary hover:underline uppercase tracking-wide transition-colors">
                      {asset.title} (Click Here)
                    </span>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.id, asset.file_path);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </button>
              ))}
              {trainingAssets.length === 0 && isOwner && (
                <p className="text-sm text-muted-foreground">No training materials yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <AssetUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        teamId={teamId}
        onSuccess={loadAssets}
      />
    </div>
  );
}
