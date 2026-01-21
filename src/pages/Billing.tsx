import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WalletCard } from "@/components/billing/WalletCard";
import { PaymentMethodCard } from "@/components/billing/PaymentMethodCard";
import { AutoRechargeSettings } from "@/components/billing/AutoRechargeSettings";
import { PricingTable } from "@/components/billing/PricingTable";
import { TransactionHistory } from "@/components/billing/TransactionHistory";
import { Skeleton } from "@/components/ui/skeleton";

export default function Billing() {
  const { teamId } = useParams<{ teamId: string }>();

  const { data: billing, isLoading, refetch } = useQuery({
    queryKey: ["team-billing", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      
      const { data, error } = await supabase
        .from("team_billing")
        .select("*")
        .eq("team_id", teamId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const { data: pricing } = useQuery({
    queryKey: ["channel-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channel_pricing")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-muted-foreground">
          Manage your wallet balance, payment methods, and auto-recharge settings
        </p>
      </div>

      {/* Hero Cards - 3 column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WalletCard 
          teamId={teamId!} 
          billing={billing} 
          onUpdate={refetch} 
        />
        <PaymentMethodCard 
          teamId={teamId!} 
          billing={billing} 
          onUpdate={refetch} 
        />
        <AutoRechargeSettings 
          teamId={teamId!} 
          billing={billing} 
          onUpdate={refetch} 
        />
      </div>

      <PricingTable pricing={pricing || []} />

      <TransactionHistory teamId={teamId!} />
    </div>
  );
}
