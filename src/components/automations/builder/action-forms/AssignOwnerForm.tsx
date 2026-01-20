import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { AssignOwnerConfig, CrmEntity } from "@/lib/automations/types";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface AssignOwnerFormProps {
  config: AssignOwnerConfig;
  onChange: (config: AssignOwnerConfig) => void;
  teamId: string;
}

export function AssignOwnerForm({ config, onChange, teamId }: AssignOwnerFormProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeamMembers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("team_members")
          .select(`
            user_id,
            role,
            profiles!inner(full_name)
          `)
          .eq("team_id", teamId);

        if (error) throw error;

        const members = (data || []).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.full_name || "Unknown",
          role: m.role,
        }));
        setTeamMembers(members);
      } catch (err) {
        console.error("Failed to load team members:", err);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      loadTeamMembers();
    }
  }, [teamId]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Entity Type</Label>
        <Select
          value={config.entity || "lead"}
          onValueChange={(value: CrmEntity) =>
            onChange({ ...config, entity: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="deal">Deal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Assign To</Label>
        {loading ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading team members...
          </div>
        ) : (
          <Select
            value={config.ownerId || ""}
            onValueChange={(value) => onChange({ ...config, ownerId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <span>{member.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      ({member.role})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">
          The {config.entity || "lead"} will be assigned to this team member
        </p>
      </div>
    </div>
  );
}
