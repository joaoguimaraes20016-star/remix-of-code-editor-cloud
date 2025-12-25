import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TeamSettings {
  privacy_policy_url?: string | null;
  contact_email?: string | null;
  support_email?: string | null;
  [key: string]: any;
}

interface TeamRecord {
  name: string;
  settings?: TeamSettings | null;
}

export default function PrivacyPolicy() {
  const [teamName, setTeamName] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeamFromDomain = async () => {
      try {
        if (typeof window === "undefined") {
          setLoading(false);
          return;
        }

        const hostname = window.location.hostname;

        // Reuse the domain resolution logic used by PublicFunnel to
        // discover the associated funnel and team for custom domains.
        const { data, error } = await supabase.functions.invoke("resolve-domain", {
          body: { domain: hostname },
        });

        if (error || !data?.success || !data?.funnel?.team_id) {
          setLoading(false);
          return;
        }

        const teamId: string = data.funnel.team_id;

        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("name, settings")
          .eq("id", teamId)
          .single<TeamRecord>();

        if (teamError || !team) {
          setLoading(false);
          return;
        }

        setTeamName(team.name || null);

        const settings = (team.settings || {}) as TeamSettings;
        const email = settings.contact_email || settings.support_email || null;
        if (email) {
          setContactEmail(email);
        }
      } catch (err) {
        // Fail open with generic content if anything goes wrong.
        console.error("Failed to load team info for privacy policy page", err);
      } finally {
        setLoading(false);
      }
    };

    loadTeamFromDomain();
  }, []);

  const displayName = teamName || "Your Company Name";
  const displayEmail = contactEmail || "support@example.com";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            This is a generic privacy policy template. Replace this text with your own
            legal copy to reflect how you collect and use customer data.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : (
          <main className="space-y-6 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Who we are</h2>
              <p>
                This page applies to <span className="font-medium">{displayName}</span> ("we",
                "us", or "our"). We are responsible for the information collected through the
                funnels and forms you access on this domain.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">What we collect</h2>
              <p>
                As part of our funnels and lead forms, we may collect personal information such
                as your name, contact details, and any other information you choose to share
                with us when submitting a form or booking an appointment.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">How we use your information</h2>
              <p>
                We use the information you provide to contact you, deliver the services you
                request, and improve our offers and customer experience. We may also use this
                information for analytics and communication related to our services.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Contact</h2>
              <p>
                If you have any questions about this policy or how your data is handled, you
                can contact us at {" "}
                <a href={`mailto:${displayEmail}`} className="underline">
                  {displayEmail}
                </a>
                .
              </p>
            </section>

            <section className="space-y-2 text-xs text-muted-foreground">
              <p>
                This page is provided as a starting point only and does not constitute legal
                advice. You should replace this template with a privacy policy reviewed by your
                legal counsel to ensure compliance with all applicable laws and regulations.
              </p>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
