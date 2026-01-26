import { useState } from "react";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Mail, History, Megaphone, Phone } from "lucide-react";

// Import marketing components
import { EmailSettings } from "@/components/messaging/EmailSettings";
import { PhoneSettings } from "@/components/messaging/PhoneSettings";
import { UsageHistory } from "@/components/messaging/UsageHistory";

type MarketingSection = "email" | "phone" | "history";

const sections = [
  { id: "email" as const, label: "Email Services", icon: Mail, description: "Configure sending domains" },
  { id: "phone" as const, label: "Phone Services", icon: Phone, description: "Manage phone numbers" },
  { id: "history" as const, label: "Usage History", icon: History, description: "View transactions" },
];

export default function Marketing() {
  const { teamId } = useParams<{ teamId: string }>();
  const [activeSection, setActiveSection] = useState<MarketingSection>("email");

  const renderContent = () => {
    switch (activeSection) {
      case "email":
        return <EmailSettings teamId={teamId!} />;
      case "phone":
        return <PhoneSettings teamId={teamId!} />;
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Marketing</h2>
          </div>
          <p className="text-sm text-muted-foreground">Communication infrastructure</p>
        </div>
        
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-3 rounded-lg text-sm transition-all text-left",
                activeSection === section.id
                  ? "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-foreground border border-purple-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <section.icon className={cn(
                "h-5 w-5 mt-0.5 shrink-0",
                activeSection === section.id ? "text-purple-500" : ""
              )} />
              <div>
                <div className="font-medium">{section.label}</div>
                <div className={cn(
                  "text-xs mt-0.5",
                  activeSection === section.id 
                    ? "text-muted-foreground" 
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
