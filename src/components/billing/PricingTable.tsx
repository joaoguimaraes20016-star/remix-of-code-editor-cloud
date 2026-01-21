import { Mail, MessageSquare, Phone, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const channelInfo: Record<string, { icon: typeof Mail; label: string; gradient: string }> = {
  email: { 
    icon: Mail, 
    label: "Email", 
    gradient: "from-blue-500 to-cyan-500" 
  },
  sms: { 
    icon: MessageSquare, 
    label: "SMS", 
    gradient: "from-green-500 to-emerald-500" 
  },
  voice: { 
    icon: Phone, 
    label: "Voice", 
    gradient: "from-purple-500 to-violet-500" 
  },
  whatsapp: { 
    icon: MessageCircle, 
    label: "WhatsApp", 
    gradient: "from-emerald-500 to-teal-500" 
  },
};

export function PricingTable({ pricing }: PricingTableProps) {
  const formatPrice = (cents: number) => {
    if (cents < 1) {
      return `$${cents.toFixed(3)}`;
    }
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (!pricing.length) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle>Channel Pricing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pricing.map((item) => {
            const info = channelInfo[item.channel] || { 
              icon: MessageSquare, 
              label: item.channel, 
              gradient: "from-gray-500 to-slate-500" 
            };
            const Icon = info.icon;

            return (
              <div 
                key={item.id}
                className="relative overflow-hidden rounded-lg p-4 bg-muted/30 border border-border/50"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${info.gradient} opacity-5`} />
                <div className="relative flex flex-col items-center text-center gap-2">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${info.gradient} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{info.label}</div>
                    <div className="text-lg font-bold text-foreground">
                      {formatPrice(item.unit_price_cents)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per {item.unit_label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
