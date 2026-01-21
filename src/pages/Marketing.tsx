import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Mail, CreditCard, History, Palette } from "lucide-react";

// Import marketing components
import { EmailSettings } from "@/components/messaging/EmailSettings";
import { CreditsBalance } from "@/components/messaging/CreditsBalance";
import { UsageHistory } from "@/components/messaging/UsageHistory";

type MarketingSection = "email" | "credits" | "history";

const sections = [
  { id: "email" as const, label: "Email Services", icon: Mail, description: "Configure sending domains" },
  { id: "credits" as const, label: "Credits & Billing", icon: CreditCard, description: "Manage your balance" },
  { id: "history" as const, label: "Usage History", icon: History, description: "View transactions" },
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

  const renderContent = () => {
    switch (activeSection) {
      case "email":
        return <EmailSettings teamId={teamId!} />;
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
      <aside className="w-64 border-r border-border bg-muted/30 p-4">
        <div className="mb-6 px-2">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Marketing</h2>
          </div>
          <p className="text-sm text-muted-foreground">Email services & billing</p>
        </div>
        
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-left",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <section.icon className={cn(
                "h-5 w-5 mt-0.5 shrink-0",
                activeSection === section.id ? "text-primary-foreground" : ""
              )} />
              <div>
                <div className="font-medium">{section.label}</div>
                <div className={cn(
                  "text-xs mt-0.5",
                  activeSection === section.id 
                    ? "text-primary-foreground/70" 
                    : "text-muted-foreground"
                )}>
                  {section.description}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
