import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { checkParentAccountIdExists, isParentAccountIdColumnError } from "@/lib/db/checkColumnExists";

interface CreateSubaccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  parentAccountId: string;
}

export function CreateSubaccountDialog({
  open,
  onOpenChange,
  onCreated,
  parentAccountId,
}: CreateSubaccountDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [columnExists, setColumnExists] = useState<boolean | null>(null);
  const isSubmitting = useRef(false);

  // Check if column exists when dialog opens
  useEffect(() => {
    if (open) {
      checkParentAccountIdExists().then(setColumnExists);
    }
  }, [open]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting.current || creating) return;
    if (!name.trim() || !user || !parentAccountId) return;

    // Check if column exists before proceeding
    const columnAvailable = await checkParentAccountIdExists();
    if (!columnAvailable) {
      toast.error('Subaccount feature requires database migration. Please contact support or run the migration.');
      return;
    }

    isSubmitting.current = true;
    setCreating(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Create subaccount (team with parent_account_id set)
      // Column exists check passed, safe to insert
      const insertData: any = {
        name: name.trim(),
        created_by: currentUser.id,
        parent_account_id: parentAccountId, // Set parent
      };

      const { data: subaccount, error: teamError } = await supabase
        .from('teams')
        .insert(insertData)
        .select()
        .single();

      if (teamError) {
        // Check if error is related to missing column
        if (isParentAccountIdColumnError(teamError)) {
          toast.error('Subaccount feature requires database migration. Please run the migration first.');
          return;
        }
        throw teamError;
      }

      // Add user as admin of the subaccount using upsert to prevent duplicate key errors
      const { error: memberError } = await supabase
        .from('team_members')
        .upsert({
          team_id: subaccount.id,
          user_id: currentUser.id,
          role: 'admin'
        }, {
          onConflict: 'team_id,user_id',
          ignoreDuplicates: false
        });

      if (memberError) throw memberError;

      toast.success('Subaccount created successfully!');
      setName("");
      onOpenChange(false);
      
      if (onCreated) {
        onCreated();
      }
      
      // Optionally navigate to the new subaccount
      // navigate(`/team/${subaccount.id}`);
    } catch (error: any) {
      console.error('Error creating subaccount:', error);
      toast.error(error.message || 'Failed to create subaccount');
    } finally {
      setCreating(false);
      isSubmitting.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Subaccount</DialogTitle>
          <DialogDescription>
            {columnExists === false ? (
              <span className="text-destructive">
                Subaccount feature requires database migration. Please run the migration to enable this feature.
              </span>
            ) : (
              "Create a new workspace (subaccount) under your main account. You'll be able to switch between workspaces."
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subaccount-name">Subaccount Name</Label>
            <Input
              id="subaccount-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Client A, Location 1"
              disabled={creating || columnExists === false}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setName("");
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={creating || !name.trim() || columnExists === false}
            >
              {creating ? 'Creating...' : 'Create Subaccount'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
