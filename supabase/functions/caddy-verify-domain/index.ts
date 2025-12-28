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
    return new Response("missing domain", { status: 400 });
  }

  // 🔓 AUTO-ALLOW + AUTO-CREATE
  await supabase
    .from("funnel_domains")
    .upsert(
      {
        domain,
        status: "pending",
      },
      { onConflict: "domain" },
    );

  // ✅ ALWAYS ALLOW TLS
  return new Response("ok", { status: 200 });
});
