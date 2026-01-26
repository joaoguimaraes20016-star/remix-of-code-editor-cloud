import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Calendar, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  teamId: string;
}

interface ActivityItem {
  id: string;
  type: "deposit" | "close" | "booking";
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

export function RecentActivity({ teamId }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivities = async () => {
    try {
      // Fetch recent appointments with deposits or closes
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, lead_name, cc_collected, pipeline_stage, status, updated_at, created_at")
        .eq("team_id", teamId)
        .order("updated_at", { ascending: false })
        .limit(20);

      const recentActivities: ActivityItem[] = [];

      (appointments || []).forEach((apt) => {
        const stage = (apt.pipeline_stage || "").toLowerCase();
        const status = (apt.status || "").toString().toUpperCase();
        const hasDeposit = stage.includes("deposit") && Number(apt.cc_collected || 0) > 0;
        const isClosed = status === "CLOSED" && Number(apt.cc_collected || 0) > 0;

        if (hasDeposit || isClosed) {
          recentActivities.push({
            id: apt.id,
            type: isClosed ? "close" : "deposit",
            title: isClosed ? "Deal Closed" : "Deposit Collected",
            description: `$${Number(apt.cc_collected || 0).toLocaleString()} from ${apt.lead_name}`,
            timestamp: apt.updated_at || apt.created_at,
            amount: Number(apt.cc_collected || 0),
          });
        } else if (apt.created_at && new Date(apt.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
          // New bookings in the last 24 hours
          recentActivities.push({
            id: apt.id + "-booking",
            type: "booking",
            title: "New Appointment",
            description: `${apt.lead_name} booked a call`,
            timestamp: apt.created_at,
          });
        }
      });

      // Sort by timestamp and take top 10
      recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(recentActivities.slice(0, 10));
    } catch (err) {
      console.warn("[RecentActivity] Failed to load:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!teamId) return;
    loadActivities();

    // Set up real-time subscription
    const channel = supabase
      .channel(`activity-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "close":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "deposit":
        return <DollarSign className="h-4 w-4 text-violet-500" />;
      case "booking":
        return <Calendar className="h-4 w-4 text-blue-500" />;
    }
  };

  const getIconBg = (type: ActivityItem["type"]) => {
    switch (type) {
      case "close":
        return "bg-emerald-500/10";
      case "deposit":
        return "bg-violet-500/10";
      case "booking":
        return "bg-blue-500/10";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">LIVE</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No recent activity yet
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getIconBg(activity.type)}`}>
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
