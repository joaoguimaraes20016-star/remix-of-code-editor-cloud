import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, MessageSquare, Phone, MessagesSquare, CreditCard, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditTransaction {
  id: string;
  team_id: string;
  transaction_type: string;
  channel: string;
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

interface UsageHistoryProps {
  teamId: string;
}

export function UsageHistory({ teamId }: UsageHistoryProps) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["credit-transactions", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!teamId,
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "sms":
        return MessageSquare;
      case "voice":
        return Phone;
      case "whatsapp":
        return MessagesSquare;
      case "email":
        return CreditCard;
      default:
        return CreditCard;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "sms":
        return "text-blue-500";
      case "voice":
        return "text-green-500";
      case "whatsapp":
        return "text-emerald-500";
      case "email":
        return "text-violet-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "purchase":
        return { label: "Purchase", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
      case "usage":
        return { label: "Usage", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
      case "refund":
        return { label: "Refund", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
      case "bonus":
        return { label: "Bonus", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" };
      case "number_rental":
        return { label: "Number", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" };
      default:
        return { label: type, color: "bg-gray-500/10 text-gray-600 border-gray-500/20" };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <History className="h-8 w-8 text-purple-500" />
          </div>
          <h3 className="font-semibold text-foreground">No Transaction History</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your credit transactions will appear here once you start using messaging.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Usage History</h2>
        <p className="text-muted-foreground">View your credit transactions and usage</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">Transaction History</CardTitle>
              <CardDescription className="text-white/70">
                Recent credit purchases and usage
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
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
                const ChannelIcon = getChannelIcon(tx.channel);
                const typeInfo = getTransactionTypeLabel(tx.transaction_type);
                const isPositive = tx.amount > 0;

                return (
                  <TableRow key={tx.id} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ChannelIcon className={cn("h-4 w-4", getChannelColor(tx.channel))} />
                        <span className="capitalize">{tx.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tx.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "flex items-center justify-end gap-1 font-medium",
                        isPositive ? "text-emerald-600" : "text-muted-foreground"
                      )}>
                        {isPositive ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {isPositive ? "+" : ""}{tx.amount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {tx.balance_after}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
