// supabase/functions/ingest-funnel-event/index.ts
// Minimal edge function to ingest funnel events for dev use.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method must be POST" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const funnel_id = body.funnel_id;
    const step_id = body.step_id;
    const intent = body.intent;
    const occurred_at = body.occurred_at;

    if (!funnel_id || !step_id || !intent || !occurred_at) {
      return new Response(JSON.stringify({ error: "Missing required fields: funnel_id, step_id, intent, occurred_at" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log received payload for debugging/dev inspection
    try {
      console.log("[ingest-funnel-event] received:", JSON.stringify(body));
    } catch (e) {
      console.log("[ingest-funnel-event] received (non-serializable)", body);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ingest-funnel-event] error:", err);
    return new Response(JSON.stringify({ error: "Invalid JSON or internal error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
