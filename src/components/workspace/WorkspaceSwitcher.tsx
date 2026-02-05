import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamRole } from "@/hooks/useTeamRole";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateSubaccountDialog } from "./CreateSubaccountDialog";
import { checkParentAccountIdExists } from "@/lib/db/checkColumnExists";

interface Workspace {
  id: string;
  name: string;
  logo_url?: string | null;
  parent_account_id: string | null;
}

interface WorkspaceSwitcherProps {
  currentTeamName: string;
  currentTeamLogo?: string | null;
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ 
  currentTeamName, 
  currentTeamLogo,
  collapsed = false 
}: WorkspaceSwitcherProps) {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isMainAccount, canCreateSubaccounts } = useTeamRole(teamId);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [columnExists, setColumnExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || !teamId) return;
    loadWorkspaces();
    // Check if column exists for feature detection
    checkParentAccountIdExists().then(setColumnExists);
  }, [user, teamId]);

  const loadWorkspaces = async () => {
    if (!user || !teamId) {
      setLoading(false);
      return;
    }

    try {

      // Get all teams user is a member of
      const { data: memberships, error } = await supabase
        .from('team_members')
        .select('team_id, teams(id, name, logo_url)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading memberships:', error);
        setLoading(false);
        return;
      }

      const allWorkspaces = memberships?.map(item => ({
        id: item.teams.id,
        name: item.teams.name,
        logo_url: item.teams.logo_url,
        parent_account_id: null, // Default to null (main account) if column doesn't exist
      } as Workspace)) || [];

      // Sort: main account first, then subaccounts
      const sortedWorkspaces = allWorkspaces.sort((a, b) => {
        if (a.parent_account_id === null && b.parent_account_id !== null) return -1;
        if (a.parent_account_id !== null && b.parent_account_id === null) return 1;
        return a.name.localeCompare(b.name);
      });

      setWorkspaces(sortedWorkspaces);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      // Set empty workspaces on error so UI doesn't break
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    if (workspaceId === teamId) return;
    navigate(`/team/${workspaceId}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Use props for display, with fallbacks
  const displayName = currentTeamName || 'Workspace';
  const displayLogo = currentTeamLogo || null;

  if (collapsed) {
    return (
      <div className="p-4 border-b border-sidebar-border flex justify-center">
        <Avatar className="h-10 w-10 shrink-0 rounded-xl">
          <AvatarImage src={displayLogo || undefined} alt={displayName} className="rounded-xl" />
          <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between gap-2 h-auto p-3 hover:bg-sidebar-accent rounded-xl border-0",
              "text-sidebar-foreground hover:text-white"
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 shrink-0 rounded-xl">
                <AvatarImage src={displayLogo || undefined} alt={displayName} className="rounded-xl" />
                <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <h2 className="font-semibold text-sidebar-foreground truncate text-sm">{displayName}</h2>
                <p className="text-xs text-sidebar-foreground/60">
                  {isMainAccount ? 'Main Workspace' : 'Subaccount'}
                </p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>MY WORKSPACES</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          ) : (
            <>
              {workspaces.length > 0 ? (
                workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => handleSwitchWorkspace(workspace.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={workspace.logo_url || undefined} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                        {getInitials(workspace.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{workspace.name}</span>
                        {workspace.id === teamId && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      {workspace.parent_account_id === null && (
                        <span className="text-xs text-muted-foreground">Main</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  <span className="text-sm text-muted-foreground">No workspaces found</span>
                </DropdownMenuItem>
              )}
              {canCreateSubaccounts && columnExists && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setCreateDialogOpen(true)}
                    className="flex items-center gap-2 cursor-pointer text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Subaccount</span>
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateSubaccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={loadWorkspaces}
        parentAccountId={teamId || ''}
      />
    </>
  );
}
