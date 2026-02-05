import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import { CreateSubaccountDialog } from "./CreateSubaccountDialog";
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
import { toast } from "sonner";

interface Subaccount {
  id: string;
  name: string;
  logo_url?: string | null;
  created_at: string;
}

interface SubaccountsListProps {
  parentAccountId: string;
  canCreate: boolean;
}

export function SubaccountsList({ parentAccountId, canCreate }: SubaccountsListProps) {
  const navigate = useNavigate();
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [columnExists, setColumnExists] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if column exists first
    checkParentAccountIdExists().then(exists => {
      setColumnExists(exists);
      if (exists) {
        loadSubaccounts();
      } else {
        setLoading(false);
      }
    });
  }, [parentAccountId]);

  const loadSubaccounts = async () => {
    try {
      // Try to load subaccounts (only works if parent_account_id column exists)
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, logo_url, created_at')
        .eq('parent_account_id', parentAccountId)
        .order('created_at', { ascending: false });

      if (error) {
        // If column doesn't exist, return empty array (no subaccounts yet)
        if (isParentAccountIdColumnError(error)) {
          setSubaccounts([]);
          setLoading(false);
          return;
        }
        throw error;
      }
      setSubaccounts(data || []);
    } catch (error: any) {
      // If column doesn't exist, just return empty array
      if (isParentAccountIdColumnError(error)) {
        setSubaccounts([]);
      } else {
        console.error('Error loading subaccounts:', error);
        toast.error('Failed to load subaccounts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subaccountId: string, subaccountName: string) => {
    setDeletingId(subaccountId);
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', subaccountId);

      if (error) throw error;

      toast.success(`Subaccount "${subaccountName}" deleted successfully`);
      loadSubaccounts();
    } catch (error: any) {
      console.error('Error deleting subaccount:', error);
      toast.error(error.message || 'Failed to delete subaccount');
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show message if column doesn't exist
  if (columnExists === false) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Subaccount Feature Not Available</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            The subaccount feature requires a database migration to be run. Please run the migration to enable this feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Subaccounts</h2>
            <p className="text-sm text-muted-foreground">
              Manage additional workspaces under your main account
            </p>
          </div>
          {canCreate && columnExists && (
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Subaccount
            </Button>
          )}
        </div>

        {/* Subaccounts Grid */}
        {subaccounts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No subaccounts yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create subaccounts to organize different clients, locations, or projects
              </p>
              {canCreate && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Subaccount
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {subaccounts.map((subaccount) => (
              <Card
                key={subaccount.id}
                className="group hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 rounded-xl">
                      <AvatarImage src={subaccount.logo_url || undefined} />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/5 text-blue-600 font-semibold">
                        {getInitials(subaccount.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {subaccount.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Subaccount workspace
                      </p>
                    </div>
                    {canCreate && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            disabled={deletingId === subaccount.id}
                          >
                            {deletingId === subaccount.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subaccount</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{subaccount.name}" and all its data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(subaccount.id, subaccount.name)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 h-8 text-xs"
                      onClick={() => navigate(`/team/${subaccount.id}`)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open Workspace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateSubaccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={loadSubaccounts}
        parentAccountId={parentAccountId}
      />
    </>
  );
}
