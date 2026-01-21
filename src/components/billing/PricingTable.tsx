import { Mail, MessageSquare, Phone, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ChannelPricing {
  id: string;
  channel: string;
  unit_price_cents: number;
  unit_label: string;
  is_active: boolean;
}

interface PricingTableProps {
  pricing: ChannelPricing[];
}

const channelInfo: Record<string, { icon: typeof Mail; label: string; color: string }> = {
  email: { icon: Mail, label: "Email", color: "text-blue-500" },
  sms: { icon: MessageSquare, label: "SMS", color: "text-green-500" },
  voice: { icon: Phone, label: "Voice", color: "text-purple-500" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-emerald-500" },
};

export function PricingTable({ pricing }: PricingTableProps) {
  const formatPrice = (cents: number) => {
    if (cents < 1) {
      return `$${cents.toFixed(3)}`;
    }
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Pricing</CardTitle>
        <CardDescription>
          Cost per message or minute for each channel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricing.map((item) => {
              const info = channelInfo[item.channel] || { 
                icon: MessageSquare, 
                label: item.channel, 
                color: "text-muted-foreground" 
              };
              const Icon = info.icon;

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${info.color}`} />
                      <span className="font-medium">{info.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatPrice(item.unit_price_cents)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    per {item.unit_label}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
