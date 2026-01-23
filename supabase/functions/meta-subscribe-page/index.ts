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

    const { teamId, pageId, action } = await req.json();

    if (!teamId || !pageId) {
      return new Response(
        JSON.stringify({ error: "Missing teamId or pageId" }),
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
    
    // Get page access token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();
    
    const page = (pagesData.data || []).find((p: any) => p.id === pageId);
    if (!page?.access_token) {
      return new Response(
        JSON.stringify({ error: "Page not found or no access" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pageAccessToken = page.access_token;

    if (action === "subscribe") {
      // Subscribe page to leadgen webhooks
      const subscribeUrl = new URL(`https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`);
      subscribeUrl.searchParams.set("subscribed_fields", "leadgen");
      subscribeUrl.searchParams.set("access_token", pageAccessToken);

      const subscribeResponse = await fetch(subscribeUrl.toString(), {
        method: "POST",
      });
      const subscribeData = await subscribeResponse.json();

      if (subscribeData.error) {
        console.error("Error subscribing page:", subscribeData.error);
        return new Response(
          JSON.stringify({ error: subscribeData.error.message || "Failed to subscribe page" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update config with selected page
      const config = (integration.config as Record<string, any>) || {};
      const selectedPages = config.selected_pages || [];
      
      // Add page if not already in list
      const existingIndex = selectedPages.findIndex((p: any) => p.id === pageId);
      if (existingIndex === -1) {
        selectedPages.push({
          id: pageId,
          name: page.name,
          access_token: pageAccessToken,
          subscribed_at: new Date().toISOString(),
        });
      } else {
        // Update existing entry
        selectedPages[existingIndex] = {
          ...selectedPages[existingIndex],
          access_token: pageAccessToken,
          subscribed_at: new Date().toISOString(),
        };
      }

      await supabase
        .from("team_integrations")
        .update({
          config: {
            ...config,
            selected_pages: selectedPages,
          },
        })
        .eq("team_id", teamId)
        .eq("integration_type", "meta");

      return new Response(
        JSON.stringify({ success: true, message: "Page subscribed to lead notifications" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "unsubscribe") {
      // Unsubscribe page from webhooks
      const unsubscribeUrl = new URL(`https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`);
      unsubscribeUrl.searchParams.set("access_token", pageAccessToken);

      const unsubscribeResponse = await fetch(unsubscribeUrl.toString(), {
        method: "DELETE",
      });
      const unsubscribeData = await unsubscribeResponse.json();

      if (unsubscribeData.error) {
        console.error("Error unsubscribing page:", unsubscribeData.error);
        return new Response(
          JSON.stringify({ error: unsubscribeData.error.message || "Failed to unsubscribe page" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Remove page from config
      const config = (integration.config as Record<string, any>) || {};
      const selectedPages = (config.selected_pages || []).filter((p: any) => p.id !== pageId);

      await supabase
        .from("team_integrations")
        .update({
          config: {
            ...config,
            selected_pages: selectedPages,
          },
        })
        .eq("team_id", teamId)
        .eq("integration_type", "meta");

      return new Response(
        JSON.stringify({ success: true, message: "Page unsubscribed from lead notifications" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'subscribe' or 'unsubscribe'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in meta-subscribe-page:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
