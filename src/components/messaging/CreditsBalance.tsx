import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Phone, MessagesSquare, Mail, Plus, Sparkles } from "lucide-react";
import { BuyCreditsModal } from "./BuyCreditsModal";

interface TeamCredits {
  id: string;
  team_id: string;
  sms_balance: number;
  voice_minutes_balance: number;
  whatsapp_balance: number;
  email_balance: number;
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
  onBuy?: () => void;
}

function CreditCard({ icon: Icon, label, balance, unit = "", color, maxForProgress = 1000, onBuy }: CreditCardProps) {
  const progressPercent = Math.min((balance / maxForProgress) * 100, 100);
  
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            {balance === 0 && (
              <Badge variant="outline" className="text-destructive border-destructive/30">
                Empty
              </Badge>
            )}
            {balance > 0 && balance < 100 && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                Low
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-3xl font-bold text-foreground">
            {balance.toLocaleString()}
            {unit && <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
        
        <Progress value={progressPercent} className="mt-4 h-2" />
        
        {onBuy && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-3 w-full text-primary hover:text-primary hover:bg-primary/10"
            onClick={onBuy}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Credits
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function CreditsBalance({ teamId, credits, isLoading, onCreditsUpdated }: CreditsBalanceProps) {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<"sms" | "voice" | "whatsapp" | "email">("sms");

  const handleBuyCredits = (channel: "sms" | "voice" | "whatsapp" | "email") => {
    setSelectedChannel(channel);
    setBuyModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 h-44" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasNoCredits = !credits || (
    credits.sms_balance === 0 && 
    credits.voice_minutes_balance === 0 && 
    credits.whatsapp_balance === 0 &&
    credits.email_balance === 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Credits & Usage</h2>
          <p className="text-muted-foreground">Manage your messaging credits across all channels</p>
        </div>
        <Button onClick={() => handleBuyCredits("email")}>
          <Plus className="mr-2 h-4 w-4" />
          Buy Credits
        </Button>
      </div>

      {hasNoCredits && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Get Started with Messaging</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Purchase credits to send emails, SMS, make calls, and WhatsApp messages to your leads and customers.
            </p>
            <Button className="mt-4" onClick={() => handleBuyCredits("email")}>
              <Plus className="mr-2 h-4 w-4" />
              Buy Credits
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CreditCard
          icon={Mail}
          label="Email Credits"
          balance={credits?.email_balance || 0}
          color="bg-violet-500"
          onBuy={() => handleBuyCredits("email")}
        />
        <CreditCard
          icon={MessageSquare}
          label="SMS Credits"
          balance={credits?.sms_balance || 0}
          color="bg-blue-500"
          onBuy={() => handleBuyCredits("sms")}
        />
        <CreditCard
          icon={Phone}
          label="Voice Minutes"
          balance={credits?.voice_minutes_balance || 0}
          unit="min"
          color="bg-green-500"
          onBuy={() => handleBuyCredits("voice")}
        />
        <CreditCard
          icon={MessagesSquare}
          label="WhatsApp Credits"
          balance={credits?.whatsapp_balance || 0}
          color="bg-emerald-500"
          onBuy={() => handleBuyCredits("whatsapp")}
        />
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
