import { forwardRef } from "react";
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

export const PricingTable = forwardRef<HTMLDivElement, PricingTableProps>(
  function PricingTable({ pricing }, ref) {
  const formatPrice = (cents: number) => {
    // Convert cents to dollars
    const dollars = cents / 100;
    
    // For very small amounts (fractional cents), show more precision
    if (cents < 1) {
      // Show 4-5 decimal places for sub-cent pricing
      return `$${dollars.toFixed(5).replace(/0+$/, '').replace(/\.$/, '')}`;
    }
    // For amounts less than $0.01, show 4 decimals
    if (dollars < 0.01) {
      return `$${dollars.toFixed(4)}`;
    }
    // Standard 2 decimal places for normal prices
    return `$${dollars.toFixed(2)}`;
  };

  // Calculate cost per 1000 for context
  const formatPer1000 = (cents: number) => {
    const per1000 = (cents * 1000) / 100;
    return `$${per1000.toFixed(2)}/1K`;
  };

  if (!pricing.length) return null;

  return (
    <Card ref={ref} className="border-border/50">
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
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      {formatPer1000(item.unit_price_cents)}
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
});
