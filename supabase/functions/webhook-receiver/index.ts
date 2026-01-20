// supabase/functions/webhook-receiver/index.ts
// Inbound webhook receiver for automation triggers

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // Expected path: /webhook-receiver/{teamId}/{webhookId}
  const teamId = pathParts[1] || url.searchParams.get("teamId");
  const webhookId = pathParts[2] || url.searchParams.get("webhookId");

  if (!teamId) {
    return new Response(
      JSON.stringify({ error: "Missing teamId in path or query parameter" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // Parse the incoming payload
    let payload: Record<string, any> = {};

    if (req.method === "POST" || req.method === "PUT") {
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        payload = await req.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        for (const [key, value] of formData.entries()) {
          payload[key] = value;
        }
      } else {
        payload = { rawBody: await req.text() };
      }
    }

    // Add query parameters
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "teamId" && key !== "webhookId") {
        payload[key] = value;
      }
    }

    // Add request metadata
    const eventPayload = {
      ...payload,
      _webhook: {
        id: webhookId,
        receivedAt: new Date().toISOString(),
        method: req.method,
        headers: Object.fromEntries(req.headers.entries()),
        path: url.pathname,
      },
    };

    console.log("[webhook-receiver] Received webhook:", { teamId, webhookId, payloadKeys: Object.keys(payload) });

    // Trigger automations with webhook_received trigger
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const triggerResponse = await fetch(`${supabaseUrl}/functions/v1/automation-trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        triggerType: "webhook_received",
        teamId,
        eventPayload: {
          teamId,
          meta: eventPayload,
          webhookId,
        },
        eventId: `webhook:${webhookId || "generic"}:${Date.now()}`,
      }),
    });

    const triggerResult = await triggerResponse.json();

    console.log("[webhook-receiver] Automation trigger result:", {
      status: triggerResult.status,
      automationsRun: triggerResult.automationsRun?.length || 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        received: true,
        automationsTriggered: triggerResult.automationsRun?.length || 0,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[webhook-receiver] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
