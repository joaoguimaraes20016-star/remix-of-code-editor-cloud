import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  const url = new URL(req.url);
  const domain = url.searchParams.get("domain")?.toLowerCase();

  if (!domain) {
    console.log("[caddy-verify-domain] Missing domain parameter");
    return new Response("missing domain", { status: 400 });
  }

  console.log(`[caddy-verify-domain] Checking domain: ${domain}`);

  // Only allow TLS for domains that are registered in our system with a team
  const { data: existingDomain, error } = await supabase
    .from("funnel_domains")
    .select("id, status, team_id")
    .eq("domain", domain)
    .single();

  if (error || !existingDomain) {
    console.log(`[caddy-verify-domain] Domain not registered: ${domain}`);
    return new Response("domain not registered", { status: 404 });
  }

  if (!existingDomain.team_id) {
    console.log(`[caddy-verify-domain] Domain has no team: ${domain}`);
    return new Response("domain not configured", { status: 404 });
  }

  console.log(`[caddy-verify-domain] Allowing TLS for: ${domain} (status: ${existingDomain.status})`);
  return new Response("ok", { status: 200 });
});
