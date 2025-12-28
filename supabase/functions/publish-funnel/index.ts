// supabase/functions/publish-funnel/index.ts
// Canonical Funnel Publishing Endpoint
// - Backend is the source of truth for funnels
// - Authenticated via Authorization header (user JWT)
// - Idempotent, explicit publishing (no partial writes of steps)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PublishFunnelStepInput {
  step_type: string;
  content: any;
}

interface PublishFunnelInput {
  funnel_id: string;
  name?: string;
  steps: PublishFunnelStepInput[];
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[publish-funnel] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("[publish-funnel] Auth failed", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const rawBody = (await req.json()) as PublishFunnelInput;

    const funnel_id = rawBody?.funnel_id;
    const name = rawBody?.name;
    const steps = Array.isArray(rawBody?.steps) ? rawBody.steps : [];

    if (!funnel_id || typeof funnel_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid funnel_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!Array.isArray(steps)) {
      return new Response(
        JSON.stringify({ error: "steps must be an array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Upsert canonical funnel row; backend is source of truth.
    const { error: funnelError } = await supabase
      .from("funnels")
      .upsert(
        {
          id: funnel_id,
          name: name ?? null,
          created_by: user.id,
        },
        { onConflict: "id" },
      );

    if (funnelError) {
      console.error("[publish-funnel] Error upserting funnel:", funnelError);
      return new Response(
        JSON.stringify({ error: "Failed to persist funnel" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Idempotent publish of steps: delete existing, then insert new set.
    const { error: deleteError } = await supabase
      .from("funnel_steps")
      .delete()
      .eq("funnel_id", funnel_id);

    if (deleteError) {
      console.error("[publish-funnel] Error deleting existing funnel_steps:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to reset funnel steps" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stepRows = steps.map((step, index) => {
      const step_type = step?.step_type;
      const content = step?.content ?? null;

      return {
        funnel_id,
        order_index: index,
        step_type,
        content,
      };
    });

    if (stepRows.length > 0) {
      const { error: insertError } = await supabase
        .from("funnel_steps")
        .insert(stepRows);

      if (insertError) {
        console.error("[publish-funnel] Error inserting funnel_steps:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to persist funnel steps" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[publish-funnel] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
