import { useEffect, useState } from "react";
import { useParams, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TeamSidebar } from "@/components/TeamSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamLabelsProvider } from "@/contexts/TeamLabelsContext";

export function TeamLayout() {
  const { teamId } = useParams();
  const [teamName, setTeamName] = useState("");
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("teams")
          .select("name, logo_url")
          .eq("id", teamId)
          .maybeSingle();
        
        if (error) {
          console.error('Error loading team:', error);
          // Still set loading to false so UI can render
        }
        
        if (data) {
          setTeamName(data.name || 'Workspace');
          setTeamLogo(data.logo_url);
        } else {
          // Team not found - set default name
          setTeamName('Workspace');
        }
      } catch (error) {
        console.error('Error fetching team:', error);
        setTeamName('Workspace');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-white">
        <div style={{ backgroundColor: '#1a1a2e' }} className="w-64 h-full border-r border-white/10 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  return (
    <TeamLabelsProvider>
      <div className="flex h-screen w-full bg-white">
        <TeamSidebar teamName={teamName} teamLogo={teamLogo} />
        <main className="flex-1 overflow-auto bg-white">
          <Outlet context={{ teamName, teamLogo }} />
        </main>
      </div>
    </TeamLabelsProvider>
  );
}
