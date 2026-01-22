// supabase/functions/stripe-oauth-start/index.ts
// Initiates Stripe Connect OAuth flow for user accounts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  try {
    const supabase = getSupabaseClient();
    
    // Get authorization header to identify the user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { teamId, redirectUri } = body;

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Missing teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a member of the team
    const { data: membership, error: memberError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: "Not a team member" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Stripe client ID from secrets
    const stripeClientId = Deno.env.get("STRIPE_CLIENT_ID");
    if (!stripeClientId) {
      return new Response(
        JSON.stringify({ error: "Stripe Connect not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate state token for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state in team_integrations for verification on callback
    const { error: stateError } = await supabase
      .from("team_integrations")
      .upsert({
        team_id: teamId,
        integration_type: "stripe",
        is_connected: false,
        config: {
          oauth_state: state,
          oauth_started_at: new Date().toISOString(),
          redirect_uri: redirectUri,
        },
      }, { onConflict: "team_id,integration_type" });

    if (stateError) {
      console.error("[stripe-oauth-start] Failed to store state:", stateError);
      return new Response(
        JSON.stringify({ error: "Failed to initialize OAuth" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Stripe Connect OAuth URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${supabaseUrl}/functions/v1/stripe-oauth-callback`;
    
    const stripeAuthUrl = new URL("https://connect.stripe.com/oauth/authorize");
    stripeAuthUrl.searchParams.set("response_type", "code");
    stripeAuthUrl.searchParams.set("client_id", stripeClientId);
    stripeAuthUrl.searchParams.set("scope", "read_write");
    stripeAuthUrl.searchParams.set("state", `${teamId}:${state}`);
    stripeAuthUrl.searchParams.set("redirect_uri", callbackUrl);
    
    // Optional: prefill email if we have it
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single();
      
    if (team?.name) {
      stripeAuthUrl.searchParams.set("stripe_user[business_name]", team.name);
    }

    console.log("[stripe-oauth-start] Generated OAuth URL for team:", teamId);

    return new Response(
      JSON.stringify({ authUrl: stripeAuthUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[stripe-oauth-start] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
