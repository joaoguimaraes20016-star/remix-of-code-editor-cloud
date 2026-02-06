import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, TrendingUp, Trash2, FolderKey, Layers, BarChart3, MessageSquare, Settings, ChevronRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isParentAccountIdColumnError } from "@/lib/db/checkColumnExists";

interface Team {
  id: string;
  name: string;
  created_at: string;
  logo_url?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [canCreateTeams, setCanCreateTeams] = useState(false);
  const [isGrowthOperator, setIsGrowthOperator] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Prevent multiple simultaneous loads
    if (hasRedirected) {
      return;
    }
    
    loadTeams();
    checkUserRole();
    loadUserProfile();

    const channel = supabase
      .channel('team-membership-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Don't reload if we've already redirected
          if (!hasRedirected) {
            loadTeams();
            checkUserRole();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, hasRedirected]);

  const loadUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    setUserProfile(data);
  };

  const checkUserRole = async () => {
    if (!user) return;
    
    const [{ data: userRole }, { data: profile }] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .maybeSingle()
    ]);
    
    const isCreator = userRole?.role === 'creator' || profile?.account_type === 'creator';
    setCanCreateTeams(isCreator);
    setIsGrowthOperator(isCreator);
  };

  const loadTeams = async () => {
    try {
      // First, get all teams the user is a member of with full team data
      const { data: memberships, error: membershipError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user?.id);

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        // No teams - create main account
        if (user) {
          await createMainAccount();
        }
        return;
      }

      const teamIds = memberships.map(m => m.team_id);

      // Get full team data including parent_account_id and created_by
      // Handle case where parent_account_id column might not exist yet (before migration)
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, created_at, logo_url, created_by')
        .in('id', teamIds);

      if (teamsError) {
        console.error('Error loading teams:', teamsError);
        throw teamsError;
      }

      if (!teamsData || teamsData.length === 0) {
        // Fallback: create main account
        if (user) {
          await createMainAccount();
        }
        return;
      }

      // Debug: log teams found
      if (import.meta.env.DEV) {
        console.log('[Dashboard] Teams found:', teamsData.map(t => ({ 
          id: t.id, 
          name: t.name, 
          created_by: t.created_by,
          user_id: user?.id
        })));
      }

      // For existing teams, treat all as main accounts
      // If parent_account_id column doesn't exist yet (before migration), all teams are main accounts
      // If it exists, filter for teams where parent_account_id is null/undefined
      const mainAccounts = teamsData.filter(team => {
        const parentId = (team as any).parent_account_id;
        // If column doesn't exist, parentId will be undefined - treat as main account
        return parentId === null || parentId === undefined;
      });

      let mainAccount: typeof teamsData[0] | undefined;

      if (mainAccounts.length > 0) {
        // Prefer team where user is the creator (like "AI Bootcamp")
        const userCreatedTeam = mainAccounts.find(t => t.created_by === user?.id);
        if (userCreatedTeam) {
          mainAccount = userCreatedTeam;
        } else {
          // If no user-created team, use oldest team
          mainAccount = mainAccounts.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateA - dateB;
          })[0];
        }
      } else {
        // If somehow no main accounts found, use all teams and pick the best one
        // This handles edge cases where parent_account_id might not be set correctly
        const userCreatedTeam = teamsData.find(t => t.created_by === user?.id);
        if (userCreatedTeam) {
          mainAccount = userCreatedTeam;
          // Try to ensure it's marked as main (only if column exists)
          try {
            await supabase
              .from('teams')
              .update({ parent_account_id: null } as any)
              .eq('id', mainAccount.id);
          } catch (e: any) {
            // Column doesn't exist yet - that's fine
            if (isParentAccountIdColumnError(e)) {
              // Expected - column doesn't exist yet
            } else {
              console.error('Unexpected error updating parent_account_id:', e);
            }
          }
        } else {
          // Use oldest team
          mainAccount = teamsData.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateA - dateB;
          })[0];
          // Try to ensure it's marked as main (only if column exists)
          try {
            await supabase
              .from('teams')
              .update({ parent_account_id: null } as any)
              .eq('id', mainAccount.id);
          } catch (e) {
            // Column doesn't exist yet - that's fine, team is already a main account
            console.log('parent_account_id column not available yet');
          }
        }
      }

      // Always redirect to main account - no team selection screen
      if (mainAccount && !hasRedirected) {
        if (import.meta.env.DEV) {
          console.log('[Dashboard] Redirecting to main account:', mainAccount.name, mainAccount.id);
        }
        setHasRedirected(true);
        navigate(`/team/${mainAccount.id}`, { replace: true });
      } else if (!mainAccount) {
        console.error('[Dashboard] No main account found, teams:', teamsData);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error loading teams:', error);
      toast({
        title: 'Error loading workspace',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const createMainAccount = async () => {
    if (!user) return;

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Get user's name for default team name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .maybeSingle();

      const defaultTeamName = profile?.full_name 
        ? `${profile.full_name.split(' ')[0]}'s Workspace`
        : 'My Workspace';

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ 
          name: defaultTeamName, 
          created_by: currentUser.id,
        } as any)
        .select()
        .single();

      if (teamError) throw teamError;

      // Add user as admin/owner of the team
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: currentUser.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      // Redirect to the new workspace
      navigate(`/team/${team.id}`);
    } catch (error: any) {
      console.error('Error creating main account:', error);
      toast({
        title: 'Error creating workspace',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !user) return;

    setCreating(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Get all teams user is a member of to find main account
      // Handle missing parent_account_id column gracefully
      const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id, teams(id, name, created_at, logo_url, created_by)')
        .eq('user_id', currentUser.id);

      // Filter for main accounts in JavaScript (parent_account_id is null/undefined)
      const mainAccountData = memberships?.find(m => {
        const team = m.teams as any;
        return !team?.parent_account_id; // null or undefined = main account
      });

      // Prepare insert data
      const insertData: any = {
        name: newTeamName,
        created_by: currentUser.id,
      };

      // Only add parent_account_id if column exists and we have a main account
      // Try to add it, but catch error if column doesn't exist
      if (mainAccountData?.teams?.id) {
        try {
          // Try to check if column exists by attempting a select
          const { error: testError } = await (supabase
            .from('teams')
            .select('parent_account_id') as any)
            .limit(1);
          
          if (!testError) {
            insertData.parent_account_id = mainAccountData.teams.id;
          }
        } catch {
          // Column doesn't exist - create as main account
        }
      }

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert(insertData)
        .select()
        .single();

      if (teamError) throw teamError;

      // Add user as admin of the new team/subaccount using upsert to prevent duplicate key errors
      const { error: memberError } = await supabase
        .from('team_members')
        .upsert({
          team_id: team.id,
          user_id: currentUser.id,
          role: 'admin'
        }, {
          onConflict: 'team_id,user_id',
          ignoreDuplicates: false
        });

      if (memberError) throw memberError;

      toast({
        title: 'Workspace created!',
        description: `${newTeamName} has been created successfully.`,
      });

      setNewTeamName('');
      setDialogOpen(false);
      loadTeams();
    } catch (error: any) {
      toast({
        title: 'Error creating team',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const deleteTeam = async (teamId: string, teamName: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: 'Team deleted',
        description: `${teamName} has been deleted successfully.`,
      });

      loadTeams();
    } catch (error: any) {
      toast({
        title: 'Error deleting team',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Always show loading while redirecting - users should never see the team selection screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading your workspace...</p>
      </div>
    </div>
  );
};

export default Dashboard;
