import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeamRole } from '@/hooks/useTeamRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Video, Link as LinkIcon, Trash2, Pencil, Check, X, BarChart3, TrendingUp, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AssetUploadDialog from './AssetUploadDialog';
import EditAssetDialog from './EditAssetDialog';
import { SortableAssetList } from './SortableAssetList';

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
  order_index?: number;
}

interface TeamAssetsProps {
  teamId: string;
}

export default function TeamAssets({ teamId }: TeamAssetsProps) {
  const { user } = useAuth();
  const { isAdmin, role } = useTeamRole(teamId);
  const canManageAssets = isAdmin || role === 'offer_owner' || role === 'admin';
  const navigate = useNavigate();
  const [assets, setAssets] = useState<TeamAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<TeamAsset | null>(null);
  const [teamName, setTeamName] = useState('Team Hub');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const loadTeamData = async () => {
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .maybeSingle();

      if (teamError) throw teamError;
      if (teamData) {
        setTeamName(teamData.name || 'Team Hub');
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    }
  };

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
    loadTeamData();
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

  const handleReorder = useCallback(async (category: string, reorderedAssets: TeamAsset[]) => {
    setAssets(prev => {
      const otherAssets = prev.filter(a => a.category !== category);
      return [...otherAssets, ...reorderedAssets];
    });

    try {
      const updates = reorderedAssets.map((asset, index) => 
        supabase
          .from('team_assets')
          .update({ order_index: index })
          .eq('id', asset.id)
      );
      
      await Promise.all(updates);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      loadAssets();
    }
  }, []);

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

  const handleStartEdit = () => {
    setEditedName(teamName);
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: editedName.trim() })
        .eq('id', teamId);

      if (error) throw error;

      setTeamName(editedName.trim());
      setIsEditingName(false);
      toast.success('Team name updated');
    } catch (error) {
      console.error('Error updating team name:', error);
      toast.error('Failed to update team name');
    }
  };

  const AssetSection = ({ 
    title, 
    assets, 
    category, 
    icon: Icon, 
    iconColor 
  }: { 
    title: string; 
    assets: TeamAsset[]; 
    category: string; 
    icon: any; 
    iconColor: string;
  }) => {
    if (assets.length === 0 && !canManageAssets) return null;
    
    return (
      <div className="rounded-xl bg-card border border-border/50 p-5 hover:border-primary/30 transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${iconColor} border border-border/50`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground ml-auto">{assets.length} items</span>
        </div>
        <SortableAssetList
          assets={assets}
          canManage={canManageAssets}
          colorClass={iconColor.replace('bg-', 'text-').replace('/10', '')}
          onReorder={(reordered) => handleReorder(category, reordered)}
          onEdit={(asset) => {
            setEditingAsset(asset);
            setEditDialogOpen(true);
          }}
          onDelete={handleDelete}
          onClick={handleAssetClick}
          emptyMessage={`No ${title.toLowerCase()} yet`}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl font-bold h-9 w-64 bg-background/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button onClick={handleSaveName} size="sm" variant="ghost" className="text-success">
                  <Check className="h-4 w-4" />
                </Button>
                <Button onClick={handleCancelEdit} size="sm" variant="ghost">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{teamName}</h2>
                {canManageAssets && (
                  <Button onClick={handleStartEdit} variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-muted-foreground text-sm">Team resources & materials</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span>{assets.length} Assets</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-sm">
            <Video className="h-4 w-4 text-primary" />
            <span>{assets.filter(a => a.loom_url).length} Videos</span>
          </div>
          {canManageAssets && (
            <Button onClick={() => setUploadDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Quick Access - Sales Dashboard */}
      <button
        onClick={() => navigate(`/team/${teamId}/sales`)}
        className="group w-full text-left relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-5 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 group-hover:scale-110 transition-transform">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Sales Dashboard</h3>
            <p className="text-sm text-muted-foreground">Track performance & manage your pipeline</p>
          </div>
          <TrendingUp className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* Asset Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <AssetSection 
            title="Complete Offer" 
            assets={offerAssets} 
            category="offer"
            icon={FileText}
            iconColor="bg-primary/10 text-primary"
          />
        </div>
        <AssetSection 
          title="Scripts" 
          assets={scriptAssets} 
          category="scripts"
          icon={FileText}
          iconColor="bg-blue-500/10 text-blue-500"
        />
        <AssetSection 
          title="Onboarding" 
          assets={onboardingAssets} 
          category="onboarding"
          icon={FileText}
          iconColor="bg-green-500/10 text-green-500"
        />
        <AssetSection 
          title="Tracking Sheets" 
          assets={trackingAssets} 
          category="tracking"
          icon={FileText}
          iconColor="bg-purple-500/10 text-purple-500"
        />
        <AssetSection 
          title="Training" 
          assets={trainingAssets} 
          category="training"
          icon={Video}
          iconColor="bg-orange-500/10 text-orange-500"
        />
      </div>

      {/* Dialogs */}
      {canManageAssets && (
        <>
          <AssetUploadDialog
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            teamId={teamId}
            onSuccess={loadAssets}
          />
          {editingAsset && (
            <EditAssetDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              asset={editingAsset}
              onSuccess={() => {
                loadAssets();
                setEditingAsset(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
