import { useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, Clock, User, Video, CheckCircle2 } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useMySchedule, useTeamSchedule, ScheduleAppointment, ScheduleTask } from "@/hooks/useSchedule";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ViewMode = "my" | "team";
type FilterMode = "all" | "appointments" | "tasks";

interface ScheduleItem {
  id: string;
  type: "appointment" | "task";
  title: string;
  subtitle?: string;
  time: Date;
  assignee?: string;
  taskType?: string;
  status?: string;
  meetingLink?: string | null;
}

export default function Schedule() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("my");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  
  const { data: myData, isLoading: myLoading } = useMySchedule(teamId, user?.id);
  const { data: teamData, isLoading: teamLoading } = useTeamSchedule(teamId);
  
  const isLoading = viewMode === "my" ? myLoading : teamLoading;
  const data = viewMode === "my" ? myData : teamData;
  
  // Transform appointments and tasks into unified schedule items
  const getScheduleItems = (): ScheduleItem[] => {
    if (!data) return [];
    
    const items: ScheduleItem[] = [];
    
    // Add appointments (unless filtering for tasks only)
    if (filterMode !== "tasks") {
      data.appointments.forEach((apt) => {
        items.push({
          id: apt.id,
          type: "appointment",
          title: apt.lead_name,
          subtitle: apt.event_type_name || "Call",
          time: parseISO(apt.start_at_utc),
          assignee: apt.closer_name || apt.setter_name || undefined,
          status: apt.status,
          meetingLink: apt.meeting_link,
        });
      });
    }
    
    // Add tasks (unless filtering for appointments only)
    if (filterMode !== "appointments") {
      data.tasks.forEach((task) => {
        const appointment = task.appointment;
        items.push({
          id: task.id,
          type: "task",
          title: appointment?.lead_name || "Task",
          subtitle: formatTaskType(task.task_type),
          time: parseISO(task.due_at),
          assignee: task.assignee_name,
          taskType: task.task_type,
          status: task.status,
        });
      });
    }
    
    // Sort by time
    return items.sort((a, b) => a.time.getTime() - b.time.getTime());
  };
  
  const formatTaskType = (type: string): string => {
    switch (type) {
      case "call_confirmation": return "Call Confirmation";
      case "follow_up": return "Follow-up";
      case "reschedule": return "Reschedule";
      default: return type.replace(/_/g, " ");
    }
  };
  
  // Group items by date category
  const groupItems = (items: ScheduleItem[]) => {
    const today: ScheduleItem[] = [];
    const tomorrow: ScheduleItem[] = [];
    const thisWeek: ScheduleItem[] = [];
    const upcoming: ScheduleItem[] = [];
    
    items.forEach((item) => {
      if (isToday(item.time)) {
        today.push(item);
      } else if (isTomorrow(item.time)) {
        tomorrow.push(item);
      } else if (isThisWeek(item.time)) {
        thisWeek.push(item);
      } else {
        upcoming.push(item);
      }
    });
    
    return { today, tomorrow, thisWeek, upcoming };
  };
  
  const scheduleItems = getScheduleItems();
  const groupedItems = groupItems(scheduleItems);
  
  const renderItem = (item: ScheduleItem) => (
    <div
      key={item.id}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border bg-card transition-all hover:shadow-md",
        item.type === "appointment" 
          ? "border-blue-500/20 hover:border-blue-500/40" 
          : "border-emerald-500/20 hover:border-emerald-500/40"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
        item.type === "appointment" 
          ? "bg-gradient-to-br from-blue-500 to-indigo-500" 
          : "bg-gradient-to-br from-emerald-500 to-teal-500"
      )}>
        {item.type === "appointment" ? (
          <Video className="h-5 w-5 text-white" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-white" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground truncate">{item.title}</span>
          <Badge variant="secondary" className={cn(
            "text-xs shrink-0",
            item.type === "appointment" 
              ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          )}>
            {item.subtitle}
          </Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {format(item.time, "h:mm a")}
          </span>
          
          {viewMode === "team" && item.assignee && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {item.assignee}
            </span>
          )}
        </div>
      </div>
      
      {item.meetingLink && (
        <Button
          size="sm"
          className="shrink-0 bg-[#ef476f] hover:bg-[#d63d5f] text-white"
          onClick={() => window.open(item.meetingLink!, "_blank")}
        >
          Join
        </Button>
      )}
    </div>
  );
  
  const renderSection = (title: string, items: ScheduleItem[], dateLabel?: string) => {
    if (items.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {dateLabel && (
            <span className="text-sm text-muted-foreground">({dateLabel})</span>
          )}
          <Badge variant="outline" className="ml-auto bg-muted/50">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Badge>
        </div>
        <div className="space-y-2">
          {items.map(renderItem)}
        </div>
      </div>
    );
  };
  
  const hasNoItems = scheduleItems.length === 0;
  
  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
            <p className="text-muted-foreground">
              {viewMode === "my" ? "Your upcoming calls and tasks" : "All team calls and tasks"}
            </p>
          </div>
        </div>
        
        {/* Toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "my" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("my")}
              className={cn(
                "h-8",
                viewMode === "my" && "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
              )}
            >
              My Schedule
            </Button>
            <Button
              variant={viewMode === "team" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("team")}
              className={cn(
                "h-8",
                viewMode === "team" && "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
              )}
            >
              Team Schedule
            </Button>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={filterMode === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterMode("all")}
              className={cn(
                "h-8",
                filterMode === "all" && "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
              )}
            >
              All
            </Button>
            <Button
              variant={filterMode === "appointments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterMode("appointments")}
              className={cn(
                "h-8",
                filterMode === "appointments" && "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
              )}
            >
              Appointments
            </Button>
            <Button
              variant={filterMode === "tasks" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterMode("tasks")}
              className={cn(
                "h-8",
                filterMode === "tasks" && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
              )}
            >
              Tasks
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : hasNoItems ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No upcoming items</h3>
            <p className="text-sm text-muted-foreground">
              {viewMode === "my" 
                ? "You don't have any scheduled calls or tasks" 
                : "No scheduled calls or tasks for the team"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {renderSection("Today", groupedItems.today, format(new Date(), "MMM d"))}
          {renderSection("Tomorrow", groupedItems.tomorrow, format(new Date(Date.now() + 86400000), "MMM d"))}
          {renderSection("This Week", groupedItems.thisWeek)}
          {renderSection("Upcoming", groupedItems.upcoming)}
        </div>
      )}
    </div>
  );
}
