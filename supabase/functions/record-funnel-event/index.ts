// supabase/functions/record-funnel-event/index.ts
// Edge function to insert funnel events idempotently using dedupe_key

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const body = await req.json();

    const event_type: string = body.event_type;
    const funnel_id: string = body.funnel_id;
    const step_id: string = body.step_id;
    const element_id: string | null = body.element_id ?? null;
    const lead_id: string | null = body.lead_id ?? null;
    const session_id: string = body.session_id;
    const dedupe_key: string = body.dedupe_key;
    const payload = body.payload ?? {};

    if (!event_type || !funnel_id || !step_id || !session_id || !dedupe_key) {
      return new Response(JSON.stringify({ error: "Missing required fields: event_type, funnel_id, step_id, session_id, dedupe_key" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const record = {
      event_type,
      funnel_id,
      step_id,
      element_id,
      lead_id,
      session_id,
      dedupe_key,
      payload,
    };

    // Attempt insert. If duplicate key violation occurs, treat as success (inserted: false).
    const { data, error } = await supabase.from("events").insert(record).select().single();

    if (error) {
      const msg = (error?.message || "").toString().toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique")) {
        // Already exists - idempotent
        return new Response(JSON.stringify({ inserted: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("record-funnel-event insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to insert event" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ inserted: true, event: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("record-funnel-event unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
