import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { isParentAccountIdColumnError } from '@/lib/db/checkColumnExists';

export function useTeamRole(teamId: string | undefined) {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [isMainAccount, setIsMainAccount] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setLoading(false);
      return;
    }

    const loadRole = async () => {
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberError) throw memberError;
        
        setRole(memberData?.role || null);

        // Try to check if it's a main account (parent_account_id column might not exist yet)
        try {
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('parent_account_id')
            .eq('id', teamId)
            .maybeSingle();

          if (teamError) {
            // If column doesn't exist, Supabase returns an error - treat as main account
            if (isParentAccountIdColumnError(teamError)) {
              setIsMainAccount(true);
            } else {
              // Other error - still treat as main account to be safe
              setIsMainAccount(true);
            }
          } else if (teamData) {
            setIsMainAccount(!teamData.parent_account_id); // Main account has null parent_account_id
          } else {
            // No data - treat as main account
            setIsMainAccount(true);
          }
        } catch (e: any) {
          // Column doesn't exist or any other error - treat as main account
          setIsMainAccount(true);
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        setRole(null);
        setIsMainAccount(true); // Default to true if we can't determine
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [user, teamId]);

  return { 
    role, 
    loading, 
    isAdmin: role === 'admin' || role === 'offer_owner' || role === 'owner',
    isMainAccount,
    canCreateSubaccounts: (role === 'admin' || role === 'offer_owner' || role === 'owner') && isMainAccount
  };
}
