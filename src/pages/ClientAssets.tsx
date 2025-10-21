import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeamRole } from '@/hooks/useTeamRole';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FolderKey, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ClientAssetsDashboard } from '@/components/client-assets/ClientAssetsDashboard';
import { ClientAssetsList } from '@/components/client-assets/ClientAssetsList';
import { NewClientAssetDialog } from '@/components/client-assets/NewClientAssetDialog';

export default function ClientAssets() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const { role, isOwner, loading: roleLoading } = useTeamRole(teamId);
  const [teamName, setTeamName] = useState<string>('');
  const [showNewDialog, setShowNewDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user has permission (offer_owner, admin, or owner)
    if (!roleLoading && role !== 'offer_owner' && role !== 'admin' && !isOwner) {
      toast.error('Access denied. Only offer owners and admins can access client assets.');
      navigate(`/team/${teamId}`);
      return;
    }

    const loadTeam = async () => {
      if (!teamId) return;

      const { data, error } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();

      if (error) {
        console.error('Error loading team:', error);
        toast.error('Failed to load team');
        return;
      }

      setTeamName(data.name);
    };

    loadTeam();
  }, [user, teamId, navigate, role, isOwner, roleLoading]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/team/${teamId}`)}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales Dashboard
          </Button>

          <div className="bg-card/50 backdrop-blur-sm border-2 border-primary/20 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FolderKey className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Client Assets Management
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Securely collect and manage client onboarding information for {teamName}
                  </p>
                </div>
              </div>

              <Button onClick={() => setShowNewDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Client
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Active Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ClientAssetsDashboard teamId={teamId!} />
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <ClientAssetsList teamId={teamId!} />
          </TabsContent>
        </Tabs>
      </div>

      <NewClientAssetDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        teamId={teamId!}
      />
    </div>
  );
}
