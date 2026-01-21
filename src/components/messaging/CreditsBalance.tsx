import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Phone, MessagesSquare, Plus, Sparkles } from "lucide-react";
import { BuyCreditsModal } from "./BuyCreditsModal";

interface TeamCredits {
  id: string;
  team_id: string;
  sms_balance: number;
  voice_minutes_balance: number;
  whatsapp_balance: number;
}

interface CreditsBalanceProps {
  teamId: string;
  credits: TeamCredits | null | undefined;
  isLoading: boolean;
  onCreditsUpdated: () => void;
}

interface CreditCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  balance: number;
  unit?: string;
  color: string;
  maxForProgress?: number;
}

function CreditCard({ icon: Icon, label, balance, unit = "", color, maxForProgress = 1000 }: CreditCardProps) {
  const progressPercent = Math.min((balance / maxForProgress) * 100, 100);
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {balance === 0 && (
            <Badge variant="outline" className="text-destructive border-destructive/30">
              Empty
            </Badge>
          )}
        </div>
        
        <div className="mt-4">
          <div className="text-3xl font-bold text-foreground">
            {balance.toLocaleString()}
            {unit && <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
        
        <Progress value={progressPercent} className="mt-4 h-2" />
      </CardContent>
    </Card>
  );
}

export function CreditsBalance({ teamId, credits, isLoading, onCreditsUpdated }: CreditsBalanceProps) {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<"sms" | "voice" | "whatsapp">("sms");

  const handleBuyCredits = (channel: "sms" | "voice" | "whatsapp") => {
    setSelectedChannel(channel);
    setBuyModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6 h-40" />
          </Card>
        ))}
      </div>
    );
  }

  const hasNoCredits = !credits || (
    credits.sms_balance === 0 && 
    credits.voice_minutes_balance === 0 && 
    credits.whatsapp_balance === 0
  );

  return (
    <div className="space-y-6">
      {hasNoCredits && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Get Started with Messaging</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Purchase credits to send SMS, make calls, and WhatsApp messages to your leads and customers.
            </p>
            <Button className="mt-4" onClick={() => handleBuyCredits("sms")}>
              <Plus className="mr-2 h-4 w-4" />
              Buy Credits
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CreditCard
          icon={MessageSquare}
          label="SMS Credits"
          balance={credits?.sms_balance || 0}
          color="bg-blue-500"
        />
        <CreditCard
          icon={Phone}
          label="Voice Minutes"
          balance={credits?.voice_minutes_balance || 0}
          unit="min"
          color="bg-green-500"
        />
        <CreditCard
          icon={MessagesSquare}
          label="WhatsApp Credits"
          balance={credits?.whatsapp_balance || 0}
          color="bg-emerald-500"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={() => handleBuyCredits("sms")} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add SMS Credits
        </Button>
        <Button onClick={() => handleBuyCredits("voice")} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Voice Minutes
        </Button>
        <Button onClick={() => handleBuyCredits("whatsapp")} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add WhatsApp Credits
        </Button>
      </div>

      <BuyCreditsModal
        open={buyModalOpen}
        onOpenChange={setBuyModalOpen}
        teamId={teamId}
        defaultChannel={selectedChannel}
        onPurchaseComplete={onCreditsUpdated}
      />
    </div>
  );
}
