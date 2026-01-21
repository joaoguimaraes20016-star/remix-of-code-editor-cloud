import { useState } from "react";
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
  Search,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}> = {
  deposit: { icon: ArrowDownCircle, label: "Deposit" },
  usage: { icon: ArrowUpCircle, label: "Usage" },
  auto_recharge: { icon: RefreshCw, label: "Auto-Recharge" },
  refund: { icon: RotateCcw, label: "Refund" },
};

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  voice: Phone,
  whatsapp: MessageCircle,
};

export function TransactionHistory({ teamId }: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredTransactions = transactions?.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.description?.toLowerCase().includes(query) ||
      tx.transaction_type.toLowerCase().includes(query) ||
      tx.channel?.toLowerCase().includes(query)
    );
  });

  const formatAmount = (cents: number) => {
    const dollars = Math.abs(cents) / 100;
    return `$${dollars.toFixed(2)}`;
  };

  const handleExport = () => {
    if (!transactions?.length) return;
    
    const csv = [
      ["Date", "Type", "Channel", "Description", "Amount", "Balance"],
      ...transactions.map(tx => [
        format(new Date(tx.created_at), "yyyy-MM-dd HH:mm"),
        tx.transaction_type,
        tx.channel || "",
        tx.description || "",
        (tx.amount_cents / 100).toFixed(2),
        (tx.balance_after_cents / 100).toFixed(2),
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
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
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={!transactions?.length}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!filteredTransactions?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No matching transactions" : "No transactions yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Detail</TableHead>
                  <TableHead className="text-right text-muted-foreground font-medium">Amount</TableHead>
                  <TableHead className="text-right text-muted-foreground font-medium">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => {
                  const config = typeConfig[tx.transaction_type] || typeConfig.usage;
                  const Icon = config.icon;
                  const ChannelIcon = tx.channel ? channelIcons[tx.channel] : null;
                  const isPositive = tx.amount_cents >= 0;

                  return (
                    <TableRow key={tx.id} className="hover:bg-muted/30">
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(tx.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center h-7 w-7 rounded-full ${
                            isPositive ? "bg-emerald-500/10" : "bg-orange-500/10"
                          }`}>
                            <Icon className={`h-3.5 w-3.5 ${
                              isPositive ? "text-emerald-500" : "text-orange-500"
                            }`} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {config.label}
                            </span>
                            {(tx.channel || tx.description) && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {ChannelIcon && <ChannelIcon className="h-3 w-3" />}
                                {tx.description || tx.channel}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isPositive 
                            ? "bg-emerald-500/10 text-emerald-600" 
                            : "bg-orange-500/10 text-orange-600"
                        }`}>
                          {isPositive ? "+" : "-"}{formatAmount(tx.amount_cents)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        ${(tx.balance_after_cents / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
