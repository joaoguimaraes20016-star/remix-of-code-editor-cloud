import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditsBalance } from "@/components/messaging/CreditsBalance";
import { PhoneNumberList } from "@/components/messaging/PhoneNumberList";
import { UsageHistory } from "@/components/messaging/UsageHistory";
import { MessageSquare, Phone, CreditCard, History } from "lucide-react";

export default function MessagingSettings() {
  const { teamId } = useParams<{ teamId: string }>();

  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = useQuery({
    queryKey: ["team-credits", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_credits")
        .select("*")
        .eq("team_id", teamId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const { data: phoneNumbers, isLoading: phonesLoading, refetch: refetchPhones } = useQuery({
    queryKey: ["team-phone-numbers", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_phone_numbers")
        .select("*")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .order("purchased_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!teamId,
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messaging</h1>
        <p className="text-muted-foreground mt-1">
          Manage your phone numbers and messaging credits
        </p>
      </div>

      <Tabs defaultValue="credits" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="credits" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Credits
          </TabsTrigger>
          <TabsTrigger value="numbers" className="gap-2">
            <Phone className="h-4 w-4" />
            Numbers
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credits">
          <CreditsBalance 
            teamId={teamId!} 
            credits={credits} 
            isLoading={creditsLoading}
            onCreditsUpdated={refetchCredits}
          />
        </TabsContent>

        <TabsContent value="numbers">
          <PhoneNumberList 
            teamId={teamId!}
            phoneNumbers={(phoneNumbers || []) as any}
            isLoading={phonesLoading}
            onNumbersChanged={refetchPhones}
          />
        </TabsContent>

        <TabsContent value="history">
          <UsageHistory teamId={teamId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
