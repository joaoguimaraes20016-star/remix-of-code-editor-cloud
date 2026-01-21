import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Mail, Phone, CreditCard, History } from "lucide-react";

// Import marketing components
import { EmailSettings } from "@/components/messaging/EmailSettings";
import { PhoneNumberList } from "@/components/messaging/PhoneNumberList";
import { CreditsBalance } from "@/components/messaging/CreditsBalance";
import { UsageHistory } from "@/components/messaging/UsageHistory";

type MarketingSection = "email" | "phone" | "credits" | "history";

const sections = [
  { id: "email" as const, label: "Email Services", icon: Mail },
  { id: "phone" as const, label: "Phone Services", icon: Phone },
  { id: "credits" as const, label: "Credits", icon: CreditCard },
  { id: "history" as const, label: "Usage History", icon: History },
];

export default function Marketing() {
  const { teamId } = useParams<{ teamId: string }>();
  const [activeSection, setActiveSection] = useState<MarketingSection>("email");

  // Fetch credits for the Credits section
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

  // Fetch phone numbers for the Phone section
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

  const renderContent = () => {
    switch (activeSection) {
      case "email":
        return <EmailSettings teamId={teamId!} />;
      case "phone":
        return (
          <PhoneNumberList
            teamId={teamId!}
            phoneNumbers={(phoneNumbers || []) as any}
            isLoading={phonesLoading}
            onNumbersChanged={refetchPhones}
          />
        );
      case "credits":
        return (
          <CreditsBalance
            teamId={teamId!}
            credits={credits}
            isLoading={creditsLoading}
            onCreditsUpdated={refetchCredits}
          />
        );
      case "history":
        return <UsageHistory teamId={teamId!} />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sub-navigation sidebar */}
      <aside className="w-56 border-r border-border bg-muted/30 p-4 space-y-1">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Marketing</h2>
          <p className="text-sm text-muted-foreground">Email & phone services</p>
        </div>
        
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeSection === section.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <section.icon className="h-4 w-4" />
            {section.label}
          </button>
        ))}
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
