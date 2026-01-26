import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TrendingUp, DollarSign, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHero, DashboardMetricCard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

// Helper: check if an appointment is "closed with revenue"
const isAppointmentClosedWithRevenue = (apt: any): boolean => {
  if (!apt) return false;
  const stage = apt.pipeline_stage?.toLowerCase() ?? "";
  const status = (apt.status ?? "").toString().toUpperCase();
  const revenue = Number(apt.cc_collected ?? 0);
  const isDepositStage = stage.includes("deposit");
  const isClosedStatus = status === "CLOSED" || status === "CLOSED_WON";
  return (isDepositStage || isClosedStatus) && revenue > 0;
};

export default function Performance() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    totalCCRevenue: 0,
    totalMRR: 0,
    closeRate: "0",
    totalClosedDeals: 0,
    showedCount: 0,
  });

  useEffect(() => {
    if (!user || !teamId) return;

    async function loadData() {
      try {
        // Load user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.full_name) {
          setCurrentUserName(profile.full_name);
        }

        // Load appointments for metrics
        const { data: appointments } = await supabase
          .from("appointments")
          .select("*")
          .eq("team_id", teamId);

        const allAppointments = appointments || [];

        // Calculate metrics
        // CC Revenue: from deposits in closed appointments
        const closedWithRevenue = allAppointments.filter(isAppointmentClosedWithRevenue);
        const totalCCRevenue = closedWithRevenue.reduce(
          (sum, apt) => sum + Number(apt.cc_collected || 0),
          0
        );

        // Total MRR
        const totalMRR = closedWithRevenue.reduce(
          (sum, apt) => sum + Number(apt.mrr_amount || 0),
          0
        );

        // Close Rate
        const showedAppointments = allAppointments.filter(
          (apt) => apt.status === "SHOWED" || apt.status === "CLOSED"
        );
        const totalClosedDeals = closedWithRevenue.length;
        const closeRate =
          showedAppointments.length > 0
            ? ((totalClosedDeals / showedAppointments.length) * 100).toFixed(1)
            : "0";

        setMetrics({
          totalCCRevenue,
          totalMRR,
          closeRate,
          totalClosedDeals,
          showedCount: showedAppointments.length,
        });
      } catch (error) {
        console.error("Failed to load performance data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, teamId]);

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance</h1>
        <p className="text-muted-foreground text-sm">
          Your revenue at a glance
        </p>
      </div>

      {/* Dashboard Hero - Welcome + Revenue with period toggle */}
      {teamId && <DashboardHero userName={currentUserName} teamId={teamId} />}

      {/* Gradient Metric Cards Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <DashboardMetricCard
          title="CC Revenue"
          value={`$${metrics.totalCCRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle={`${metrics.totalClosedDeals} deals closed`}
          icon={DollarSign}
          gradient="green"
        />
        <DashboardMetricCard
          title="Total MRR"
          value={`$${metrics.totalMRR.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="All recurring revenue"
          icon={TrendingUp}
          gradient="blue"
        />
        <DashboardMetricCard
          title="Close Rate"
          value={`${metrics.closeRate}%`}
          subtitle={`${metrics.totalClosedDeals}/${metrics.showedCount} showed closed`}
          icon={Users}
          gradient="red"
        />
      </div>
    </div>
  );
}
