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

    const { teamId, adAccountId, datePreset, level } = await req.json();

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Missing teamId" }),
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

    const config = integration.config as Record<string, any>;
    
    // Check if ads_reporting is enabled
    if (!config?.enabled_features?.ads_reporting) {
      return new Response(
        JSON.stringify({ error: "Ads reporting is not enabled. Please enable it first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = integration.access_token;
    
    // Use provided ad account or the selected one from config
    const accountId = adAccountId || config?.selected_ad_account?.id;
    
    if (!accountId) {
      return new Response(
        JSON.stringify({ error: "No ad account selected. Please select an ad account first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build insights request
    const insightsUrl = new URL(`https://graph.facebook.com/v18.0/${accountId}/insights`);
    
    // Fields to fetch
    insightsUrl.searchParams.set("fields", [
      "campaign_name",
      "campaign_id",
      "adset_name",
      "adset_id",
      "impressions",
      "clicks",
      "spend",
      "cpc",
      "cpm",
      "ctr",
      "reach",
      "frequency",
      "actions",
      "cost_per_action_type",
      "conversions",
      "cost_per_conversion",
    ].join(","));
    
    // Date range
    insightsUrl.searchParams.set("date_preset", datePreset || "last_30d");
    
    // Breakdown level
    insightsUrl.searchParams.set("level", level || "campaign");
    
    insightsUrl.searchParams.set("access_token", accessToken);

    const insightsResponse = await fetch(insightsUrl.toString());
    const insightsData = await insightsResponse.json();

    if (insightsData.error) {
      console.error("Error fetching insights:", insightsData.error);
      return new Response(
        JSON.stringify({ error: insightsData.error.message || "Failed to fetch insights" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process and format insights
    const insights = (insightsData.data || []).map((row: any) => {
      // Extract lead-related actions
      const leadActions = (row.actions || []).filter((a: any) => 
        a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
      );
      const totalLeads = leadActions.reduce((sum: number, a: any) => sum + parseInt(a.value || 0), 0);
      
      // Find cost per lead
      const costPerLeadData = (row.cost_per_action_type || []).find((c: any) => 
        c.action_type === "lead" || c.action_type === "onsite_conversion.lead_grouped"
      );
      const costPerLead = costPerLeadData ? parseFloat(costPerLeadData.value) : null;

      return {
        campaign_name: row.campaign_name,
        campaign_id: row.campaign_id,
        adset_name: row.adset_name,
        adset_id: row.adset_id,
        impressions: parseInt(row.impressions || 0),
        clicks: parseInt(row.clicks || 0),
        spend: parseFloat(row.spend || 0),
        cpc: parseFloat(row.cpc || 0),
        cpm: parseFloat(row.cpm || 0),
        ctr: parseFloat(row.ctr || 0),
        reach: parseInt(row.reach || 0),
        frequency: parseFloat(row.frequency || 0),
        leads: totalLeads,
        cost_per_lead: costPerLead,
      };
    });

    // Calculate totals
    const totals = insights.reduce((acc: any, row: any) => {
      acc.impressions += row.impressions;
      acc.clicks += row.clicks;
      acc.spend += row.spend;
      acc.reach += row.reach;
      acc.leads += row.leads;
      return acc;
    }, {
      impressions: 0,
      clicks: 0,
      spend: 0,
      reach: 0,
      leads: 0,
    });

    // Calculate derived totals
    totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    totals.cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
    totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    totals.cost_per_lead = totals.leads > 0 ? totals.spend / totals.leads : null;

    return new Response(
      JSON.stringify({ 
        insights,
        totals,
        date_preset: datePreset || "last_30d",
        level: level || "campaign",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in meta-ads-insights:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
