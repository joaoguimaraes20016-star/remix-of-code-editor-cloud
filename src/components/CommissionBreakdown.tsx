import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from "./SalesTable";
import { User, UserCheck, Calendar, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CommissionBreakdownProps {
  sales: Sale[];
  teamId?: string;
}

interface MRRCommission {
  team_member_name: string;
  role: string;
  commission_amount: number;
  month_date: string;
}

export function CommissionBreakdown({ sales, teamId }: CommissionBreakdownProps) {
  const [upcomingMRR, setUpcomingMRR] = useState<MRRCommission[]>([]);
  const [loadingMRR, setLoadingMRR] = useState(false);

  // Load upcoming MRR commissions
  useEffect(() => {
    if (!teamId) return;
    
    const loadUpcomingMRR = async () => {
      setLoadingMRR(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('mrr_commissions')
          .select('team_member_name, role, commission_amount, month_date')
          .eq('team_id', teamId)
          .gte('month_date', today)
          .order('month_date', { ascending: true });

        if (error) throw error;
        setUpcomingMRR(data || []);
      } catch (error) {
        console.error('Error loading MRR commissions:', error);
      } finally {
        setLoadingMRR(false);
      }
    };

    loadUpcomingMRR();
  }, [teamId]);

  // Calculate closer CC commission totals (from cash collected only)
  const closerCommissions = sales
    .filter(s => s.status === 'closed' && s.commission > 0 && s.salesRep !== s.offerOwner)
    .reduce((acc, sale) => {
      if (!acc[sale.salesRep]) {
        acc[sale.salesRep] = {
          totalCommission: 0,
          totalRevenue: 0,
          salesCount: 0,
        };
      }
      acc[sale.salesRep].totalCommission += sale.commission;
      acc[sale.salesRep].totalRevenue += sale.revenue;
      acc[sale.salesRep].salesCount += 1;
      return acc;
    }, {} as Record<string, { totalCommission: number; totalRevenue: number; salesCount: number }>);

  // Calculate setter CC commission totals (from cash collected only)
  const setterCommissions = sales
    .filter(s => s.status === 'closed' && s.setterCommission > 0 && s.setter && s.setter.trim() !== '' && s.setter !== s.offerOwner)
    .reduce((acc, sale) => {
      if (!acc[sale.setter]) {
        acc[sale.setter] = {
          totalCommission: 0,
          totalRevenue: 0,
          salesCount: 0,
        };
      }
      acc[sale.setter].totalCommission += sale.setterCommission;
      acc[sale.setter].totalRevenue += sale.revenue;
      acc[sale.setter].salesCount += 1;
      return acc;
    }, {} as Record<string, { totalCommission: number; totalRevenue: number; salesCount: number }>);

  // Calculate upcoming MRR commissions by person
  const upcomingMRRByPerson = upcomingMRR.reduce((acc, mrr) => {
    const key = `${mrr.team_member_name}-${mrr.role}`;
    if (!acc[key]) {
      acc[key] = {
        name: mrr.team_member_name,
        role: mrr.role,
        totalUpcoming: 0,
        monthsCount: 0,
      };
    }
    acc[key].totalUpcoming += mrr.commission_amount;
    acc[key].monthsCount += 1;
    return acc;
  }, {} as Record<string, { name: string; role: string; totalUpcoming: number; monthsCount: number }>);

  const sortedClosers = Object.entries(closerCommissions).sort(
    ([, a], [, b]) => b.totalCommission - a.totalCommission
  );

  const sortedSetters = Object.entries(setterCommissions).sort(
    ([, a], [, b]) => b.totalCommission - a.totalCommission
  );

  const sortedUpcomingMRR = Object.values(upcomingMRRByPerson).sort(
    (a, b) => b.totalUpcoming - a.totalUpcoming
  );

  const totalUpcomingMRR = sortedUpcomingMRR.reduce((sum, p) => sum + p.totalUpcoming, 0);

  const renderCommissionList = (
    data: [string, { totalCommission: number; totalRevenue: number; salesCount: number }][],
    icon: typeof User,
    emptyMessage: string
  ) => {
    const Icon = icon;
    
    if (data.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-8">
          {emptyMessage}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {data.map(([name, stats]) => (
          <div 
            key={name} 
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.salesCount} closed {stats.salesCount === 1 ? 'deal' : 'deals'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-accent">
                ${stats.totalCommission.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                from ${stats.totalRevenue.toLocaleString()} CC
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderUpcomingMRR = () => {
    if (loadingMRR) {
      return <p className="text-muted-foreground text-center py-8">Loading...</p>;
    }

    if (sortedUpcomingMRR.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-8">
          No upcoming MRR commissions
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">Total Upcoming MRR Commissions</span>
            </div>
            <span className="text-xl font-bold text-primary">
              ${totalUpcomingMRR.toLocaleString()}
            </span>
          </div>
        </div>
        
        {sortedUpcomingMRR.map((person) => (
          <div 
            key={`${person.name}-${person.role}`} 
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {person.role === 'closer' ? (
                  <UserCheck className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold">{person.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {person.role} • {person.monthsCount} {person.monthsCount === 1 ? 'month' : 'months'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">
                ${person.totalUpcoming.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                upcoming
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Commission Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="closers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="closers">Closers (CC)</TabsTrigger>
            <TabsTrigger value="setters">Setters (CC)</TabsTrigger>
            <TabsTrigger value="mrr">Upcoming MRR</TabsTrigger>
          </TabsList>
          <TabsContent value="closers" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Commissions from cash collected only
            </p>
            {renderCommissionList(
              sortedClosers,
              UserCheck,
              "No closed deals with commissions yet"
            )}
          </TabsContent>
          <TabsContent value="setters" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Commissions from cash collected only
            </p>
            {renderCommissionList(
              sortedSetters,
              User,
              "No closed deals with commissions yet"
            )}
          </TabsContent>
          <TabsContent value="mrr" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Future MRR commissions (paid when confirmed)
            </p>
            {renderUpcomingMRR()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
