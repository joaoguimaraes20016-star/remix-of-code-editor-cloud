import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

type AssetType = "businesses" | "ad_accounts" | "pages" | "lead_forms";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { teamId, assetType, parentId } = await req.json();

    if (!teamId || !assetType) {
      return new Response(
        JSON.stringify({ error: "Missing teamId or assetType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a member of the team
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userData.user.id)
      .single();

    if (!teamMember) {
      return new Response(
        JSON.stringify({ error: "Not a member of this team" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Meta integration with access token
    const { data: integration, error: integrationError } = await supabase
      .from("team_integrations")
      .select("access_token, config")
      .eq("team_id", teamId)
      .eq("integration_type", "meta")
      .eq("is_connected", true)
      .single();

    if (integrationError || !integration?.access_token) {
      return new Response(
        JSON.stringify({ error: "Meta account not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = integration.access_token;
    let assets: any[] = [];

    switch (assetType as AssetType) {
      case "businesses": {
        // Fetch businesses the user has access to
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me/businesses?fields=id,name,verification_status&access_token=${accessToken}`
        );
        const data = await response.json();
        
        if (data.error) {
          console.error("Error fetching businesses:", data.error);
          return new Response(
            JSON.stringify({ error: data.error.message || "Failed to fetch businesses" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        assets = data.data || [];
        break;
      }

      case "ad_accounts": {
        if (!parentId) {
          return new Response(
            JSON.stringify({ error: "Business ID required for ad accounts" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Fetch ad accounts for a business
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${parentId}/owned_ad_accounts?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}`
        );
        const data = await response.json();
        
        if (data.error) {
          console.error("Error fetching ad accounts:", data.error);
          return new Response(
            JSON.stringify({ error: data.error.message || "Failed to fetch ad accounts" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        assets = data.data || [];
        break;
      }

      case "pages": {
        // Fetch pages the user manages
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,picture&access_token=${accessToken}`
        );
        const data = await response.json();
        
        if (data.error) {
          console.error("Error fetching pages:", data.error);
          return new Response(
            JSON.stringify({ error: data.error.message || "Failed to fetch pages" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Return pages without exposing page access tokens to client
        assets = (data.data || []).map((page: any) => ({
          id: page.id,
          name: page.name,
          category: page.category,
          picture: page.picture?.data?.url,
          has_access_token: !!page.access_token,
        }));
        break;
      }

      case "lead_forms": {
        if (!parentId) {
          return new Response(
            JSON.stringify({ error: "Page ID required for lead forms" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // First get the page access token
        const pageResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?fields=id,access_token&access_token=${accessToken}`
        );
        const pageData = await pageResponse.json();
        
        const page = (pageData.data || []).find((p: any) => p.id === parentId);
        if (!page?.access_token) {
          return new Response(
            JSON.stringify({ error: "Page not found or no access" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Fetch lead forms for the page using page access token
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${parentId}/leadgen_forms?fields=id,name,status,leads_count,created_time&access_token=${page.access_token}`
        );
        const data = await response.json();
        
        if (data.error) {
          console.error("Error fetching lead forms:", data.error);
          return new Response(
            JSON.stringify({ error: data.error.message || "Failed to fetch lead forms" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        assets = data.data || [];
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Invalid asset type: ${assetType}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ assets }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in meta-fetch-assets:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
