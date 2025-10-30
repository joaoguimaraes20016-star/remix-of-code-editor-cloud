import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SetterEODReport } from "./SetterEODReport";
import { CloserEODReport } from "./CloserEODReport";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EODDashboardProps {
  teamId: string;
  userRole: string;
  currentUserId: string;
  currentUserName: string;
}

export function EODDashboard({ teamId, userRole, currentUserId, currentUserName }: EODDashboardProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);

  useEffect(() => {
    loadTeamMembers();
  }, [teamId]);

  const loadTeamMembers = async () => {
    const { data: members } = await supabase
      .from('team_members')
      .select('user_id, role')
      .eq('team_id', teamId)
      .eq('is_active', true);

    if (members) {
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profiles) {
        setTeamMembers(profiles.map(p => ({
          id: p.id,
          name: p.full_name,
          role: members.find(m => m.user_id === p.id)?.role
        })));
      }
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'offer_owner';
  const setters = teamMembers.filter(m => m.role === 'setter');
  const closers = teamMembers.filter(m => m.role === 'closer' || m.role === 'offer_owner');

  const selectedUser = teamMembers.find(m => m.id === selectedUserId) || { 
    id: currentUserId, 
    name: currentUserName, 
    role: userRole 
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {isAdmin && (
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentUserId}>Myself</SelectItem>
              {setters.length > 0 && (
                <>
                  <Separator className="my-1" />
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Setters</div>
                  {setters.map(setter => (
                    <SelectItem key={setter.id} value={setter.id}>
                      {setter.name}
                    </SelectItem>
                  ))}
                </>
              )}
              {closers.length > 0 && (
                <>
                  <Separator className="my-1" />
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Closers</div>
                  {closers.map(closer => (
                    <SelectItem key={closer.id} value={closer.id}>
                      {closer.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Show selected person's report */}
      {selectedUser.role === 'setter' ? (
        <SetterEODReport
          teamId={teamId}
          userId={selectedUser.id}
          userName={selectedUser.name}
          date={selectedDate}
        />
      ) : (
        <CloserEODReport
          teamId={teamId}
          userId={selectedUser.id}
          userName={selectedUser.name}
          date={selectedDate}
        />
      )}
    </div>
  );
}
