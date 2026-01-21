import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCw, 
  RotateCcw,
  Mail,
  MessageSquare,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface TransactionHistoryProps {
  teamId: string;
}

interface WalletTransaction {
  id: string;
  team_id: string;
  transaction_type: string;
  amount_cents: number;
  balance_after_cents: number;
  channel: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

const typeConfig: Record<string, { 
  icon: typeof ArrowDownCircle; 
  label: string; 
  color: string;
  badgeVariant: "default" | "secondary" | "outline";
}> = {
  deposit: { 
    icon: ArrowDownCircle, 
    label: "Deposit", 
    color: "text-green-500",
    badgeVariant: "default",
  },
  usage: { 
    icon: ArrowUpCircle, 
    label: "Usage", 
    color: "text-orange-500",
    badgeVariant: "secondary",
  },
  auto_recharge: { 
    icon: RefreshCw, 
    label: "Auto-Recharge", 
    color: "text-blue-500",
    badgeVariant: "default",
  },
  refund: { 
    icon: RotateCcw, 
    label: "Refund", 
    color: "text-purple-500",
    badgeVariant: "outline",
  },
};

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  voice: Phone,
  whatsapp: MessageCircle,
};

export function TransactionHistory({ teamId }: TransactionHistoryProps) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["wallet-transactions", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!teamId,
  });

  const formatAmount = (cents: number) => {
    const dollars = Math.abs(cents) / 100;
    const sign = cents >= 0 ? "+" : "-";
    return `${sign}$${dollars.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          Recent wallet deposits, usage, and auto-recharges
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!transactions?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const config = typeConfig[tx.transaction_type] || typeConfig.usage;
                const Icon = config.icon;
                const ChannelIcon = tx.channel ? channelIcons[tx.channel] : null;

                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.badgeVariant} className="gap-1">
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ChannelIcon && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <ChannelIcon className="h-4 w-4" />
                          <span className="capitalize">{tx.channel}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {tx.description || "-"}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${tx.amount_cents >= 0 ? "text-green-500" : "text-orange-500"}`}>
                      {formatAmount(tx.amount_cents)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${(tx.balance_after_cents / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
