import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getTeamPaymentsInRange, sumPayments } from "@/lib/payments";

interface DashboardHeroProps {
  userName: string | null;
  teamId: string;
}

type Period = "today" | "week" | "month";

export function DashboardHero({ userName, teamId }: DashboardHeroProps) {
  const [period, setPeriod] = useState<Period>("today");
  const [isLoading, setIsLoading] = useState(true);
  const [revenue, setRevenue] = useState({ today: 0, week: 0, month: 0 });

  useEffect(() => {
    if (!teamId) return;

    async function loadRevenue() {
      try {
        const now = new Date();

        // Today
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        // Start of week (Sunday-based)
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        // Start of month
        const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

        const [todayPayments, weekPayments, monthPayments] = await Promise.all([
          getTeamPaymentsInRange(teamId, startOfToday.toISOString(), endOfToday.toISOString()),
          getTeamPaymentsInRange(teamId, startOfWeek.toISOString(), endOfToday.toISOString()),
          getTeamPaymentsInRange(teamId, startOfMonth.toISOString(), endOfToday.toISOString()),
        ]);

        // Fetch appointments with deposits for the same ranges
        const fetchAppointmentsSum = async (startIso: string, endIso: string) => {
          const { data } = await supabase
            .from("appointments")
            .select("id,cc_collected,pipeline_stage,status,updated_at")
            .eq("team_id", teamId)
            .gte("updated_at", startIso)
            .lte("updated_at", endIso);

          return (data || []).reduce((sum, apt) => {
            const stage = (apt.pipeline_stage || "").toLowerCase();
            const status = (apt.status || "").toString().toUpperCase();
            const isDepositStage = stage.includes("deposit");
            const isClosedStatus = status === "CLOSED" || status === "CLOSED_WON";
            if ((isDepositStage || isClosedStatus) && Number(apt.cc_collected || 0) > 0) {
              return sum + Number(apt.cc_collected || 0);
            }
            return sum;
          }, 0);
        };

        const [todayApt, weekApt, monthApt] = await Promise.all([
          fetchAppointmentsSum(startOfToday.toISOString(), endOfToday.toISOString()),
          fetchAppointmentsSum(startOfWeek.toISOString(), endOfToday.toISOString()),
          fetchAppointmentsSum(startOfMonth.toISOString(), endOfToday.toISOString()),
        ]);

        setRevenue({
          today: sumPayments(todayPayments) + todayApt,
          week: sumPayments(weekPayments) + weekApt,
          month: sumPayments(monthPayments) + monthApt,
        });
      } catch (err) {
        console.warn("[DashboardHero] Failed to load revenue:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRevenue();
  }, [teamId]);

  const currentRevenue = revenue[period];
  const periodLabels: Record<Period, string> = {
    today: "Total Revenue Today",
    week: "Total Revenue This Week",
    month: "Total Revenue This Month",
  };

  const firstName = userName?.split(" ")[0] || "there";

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome Back, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's your revenue performance overview
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-full p-1">
          <Button
            size="sm"
            variant={period === "today" ? "default" : "ghost"}
            className={`rounded-full px-4 text-xs font-medium ${
              period === "today" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPeriod("today")}
          >
            Daily
          </Button>
          <Button
            size="sm"
            variant={period === "week" ? "default" : "ghost"}
            className={`rounded-full px-4 text-xs font-medium ${
              period === "week" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPeriod("week")}
          >
            Weekly
          </Button>
          <Button
            size="sm"
            variant={period === "month" ? "default" : "ghost"}
            className={`rounded-full px-4 text-xs font-medium ${
              period === "month" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPeriod("month")}
          >
            Monthly
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-16 flex items-center">
            <div className="text-muted-foreground text-sm">Loading revenue...</div>
          </div>
        ) : (
          <div>
            <div className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
              ${currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {periodLabels[period]}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
