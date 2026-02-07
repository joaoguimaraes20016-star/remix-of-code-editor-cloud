// supabase/functions/google-ads-webhook/index.ts
// Handles Google Ads Lead Form Extension webhooks.
// Creates/updates contacts and fires automation events.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-goog-channel-token",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Extract contact data from Google Ads lead form submission
function extractLeadData(leadData: Record<string, any>): Record<string, any> {
  const userData = leadData.user_column_data || leadData.lead_form_submission_data || [];
  const fields: Record<string, any> = {};
  const customFields: Record<string, any> = {};

  // Google Ads lead form fields come as key-value pairs
  const dataItems = Array.isArray(userData) ? userData : [];
  for (const item of dataItems) {
    const key = (item.column_id || item.key || "").toLowerCase();
    const value = item.column_value || item.value || "";

    if (key.includes("email") || key === "email_address") {
      fields.email = value;
    } else if (key.includes("phone") || key === "phone_number") {
      fields.phone = value;
    } else if (key.includes("first_name") || key === "first_name") {
      fields.first_name = value;
    } else if (key.includes("last_name") || key === "last_name") {
      fields.last_name = value;
    } else if (key.includes("full_name") || key === "name") {
      fields.name = value;
    } else if (key.includes("company") || key.includes("business")) {
      fields.company_name = value;
    } else if (key.includes("city")) {
      fields.city = value;
    } else if (key.includes("postal") || key.includes("zip")) {
      fields.postal_code = value;
    } else {
      customFields[key] = value;
    }
  }

  // Build full name if we have parts but no full name
  if (!fields.name && (fields.first_name || fields.last_name)) {
    fields.name = `${fields.first_name || ""} ${fields.last_name || ""}`.trim();
  }

  return { ...fields, custom_fields: customFields };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("team_id");

    if (!teamId) {
      return new Response(JSON.stringify({ error: "Missing team_id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("[Google Ads Webhook] Received payload for team:", teamId);

    // Google Ads can send different payload formats depending on the integration type
    // Support both webhook-based and API-based formats
    const leadData = payload.lead_form_submit_data || payload.lead || payload;
    const campaignId = leadData.campaign_id || payload.campaign_id || null;
    const adGroupId = leadData.ad_group_id || payload.ad_group_id || null;
    const formId = leadData.form_id || payload.form_id || null;
    const gclid = leadData.gclid || leadData.google_click_id || payload.gclid || null;
    const submittedAt = leadData.submission_time || payload.submitted_at || new Date().toISOString();

    // Extract contact fields
    const contactData = extractLeadData(leadData);
    console.log("[Google Ads Webhook] Extracted contact data:", JSON.stringify(contactData));

    if (!contactData.email && !contactData.phone) {
      console.warn("[Google Ads Webhook] No email or phone found in lead data");
      return new Response(
        JSON.stringify({ success: true, message: "No identifiable contact data found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Create or update contact
    let contactId: string | null = null;
    const lookupField = contactData.email ? "email" : "phone";
    const lookupValue = contactData.email || contactData.phone;

    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("team_id", teamId)
      .eq(lookupField, lookupValue)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
      await supabase
        .from("contacts")
        .update({
          ...(contactData.name && { name: contactData.name }),
          ...(contactData.first_name && { first_name: contactData.first_name }),
          ...(contactData.last_name && { last_name: contactData.last_name }),
          ...(contactData.email && { email: contactData.email }),
          ...(contactData.phone && { phone: contactData.phone }),
          ...(contactData.company_name && { company_name: contactData.company_name }),
        })
        .eq("id", contactId);
    } else {
      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          team_id: teamId,
          name: contactData.name || contactData.email || contactData.phone || "Google Ads Lead",
          email: contactData.email || null,
          phone: contactData.phone || null,
          first_name: contactData.first_name || null,
          last_name: contactData.last_name || null,
          company_name: contactData.company_name || null,
          source: "google_ads",
          tags: ["google-ads"],
        })
        .select("id")
        .single();

      contactId = newContact?.id || null;
    }

    // Fire automation event
    if (contactId) {
      try {
        await supabase.rpc("fire_automation_event", {
          p_team_id: teamId,
          p_trigger_type: "google_lead_form",
          p_event_payload: {
            teamId,
            lead: {
              id: contactId,
              email: contactData.email || null,
              phone: contactData.phone || null,
              name: contactData.name || null,
              first_name: contactData.first_name || null,
              last_name: contactData.last_name || null,
              source: "google_ads",
            },
            google_ads: {
              campaign_id: campaignId,
              ad_group_id: adGroupId,
              form_id: formId,
              gclid,
              submitted_at: submittedAt,
              custom_fields: contactData.custom_fields,
            },
          },
          p_event_id: `google_ads:${gclid || formId || "lead"}:${Date.now()}`,
        });
        console.log("[Google Ads Webhook] Automation event fired for contact:", contactId);
      } catch (err) {
        console.error("[Google Ads Webhook] Error firing automation event:", err);
      }
    }

    console.log(`[Google Ads Webhook] Processed lead for team ${teamId}, contact: ${contactId}`);

    return new Response(
      JSON.stringify({ success: true, contactId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Google Ads Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
