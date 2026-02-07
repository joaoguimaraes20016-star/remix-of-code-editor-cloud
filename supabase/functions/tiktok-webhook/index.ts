// supabase/functions/tiktok-webhook/index.ts
// Handles TikTok Lead Gen webhooks.
// Fetches full lead data, creates/updates contacts, fires automation events.

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

// Verify TikTok webhook signature using HMAC-SHA256
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return signature === expectedSig;
  } catch {
    return false;
  }
}

// Extract contact data from TikTok lead fields
function extractLeadData(leadFields: any[]): Record<string, any> {
  const fields: Record<string, any> = {};
  const customFields: Record<string, any> = {};

  for (const field of leadFields) {
    const name = (field.field_name || field.name || "").toLowerCase();
    const value = field.value || field.field_value || "";

    if (name.includes("email")) {
      fields.email = value;
    } else if (name.includes("phone") || name.includes("tel")) {
      fields.phone = value;
    } else if (name.includes("first_name") || name === "first name") {
      fields.first_name = value;
    } else if (name.includes("last_name") || name === "last name") {
      fields.last_name = value;
    } else if (name.includes("name") && !name.includes("company")) {
      fields.name = value;
    } else if (name.includes("company") || name.includes("business")) {
      fields.company_name = value;
    } else if (name.includes("city")) {
      fields.city = value;
    } else {
      customFields[name] = value;
    }
  }

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

    const body = await req.text();
    const payload = JSON.parse(body);

    console.log("[TikTok Webhook] Received event for team:", teamId);

    const supabase = getSupabaseClient();

    // Fetch integration once (for both signature verification and lead fetch)
    const { data: integration } = await supabase
      .from("team_integrations")
      .select("access_token, config")
      .eq("team_id", teamId)
      .eq("integration_type", "tiktok")
      .single();

    // Verify signature if available
    const signature = req.headers.get("x-tiktok-signature") || req.headers.get("x-signature");
    if (signature) {
      const appSecret = integration?.config?.app_secret;
      if (appSecret) {
        const isValid = await verifySignature(body, signature, appSecret);
        if (!isValid) {
          console.error("[TikTok Webhook] Signature verification failed");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Parse TikTok lead data
    // TikTok sends lead form data in different formats depending on the webhook version
    const leadData = payload.lead || payload.data?.lead || payload;
    const leadFields = leadData.fields || leadData.lead_fields || leadData.user_data || [];
    const formId = leadData.form_id || payload.form_id || null;
    const adId = leadData.ad_id || payload.ad_id || null;
    const campaignId = leadData.campaign_id || payload.campaign_id || null;
    const leadId = leadData.lead_id || payload.lead_id || null;
    const submittedAt = leadData.create_time || payload.timestamp || new Date().toISOString();

    // If we got a lead_id but no fields, try to fetch full data from TikTok API
    let contactData: Record<string, any>;
    if (leadId && leadFields.length === 0) {
      // Attempt to fetch full lead data from TikTok (reuse integration from above)
      const accessToken = integration?.access_token;
      if (accessToken) {
        try {
          const tiktokResp = await fetch(
            `https://business-api.tiktok.com/open_api/v1.3/lead/get/?lead_id=${leadId}`,
            {
              headers: {
                "Access-Token": accessToken,
                "Content-Type": "application/json",
              },
            }
          );
          const tiktokData = await tiktokResp.json();
          const fullFields = tiktokData.data?.lead_info?.fields || [];
          contactData = extractLeadData(fullFields);
        } catch (err) {
          console.error("[TikTok Webhook] Error fetching lead data:", err);
          contactData = extractLeadData(leadFields);
        }
      } else {
        contactData = extractLeadData(leadFields);
      }
    } else {
      contactData = extractLeadData(leadFields);
    }

    console.log("[TikTok Webhook] Extracted contact data:", JSON.stringify(contactData));

    if (!contactData.email && !contactData.phone) {
      console.warn("[TikTok Webhook] No identifiable contact data found");
      return new Response(
        JSON.stringify({ success: true, message: "No identifiable contact data" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
          name: contactData.name || contactData.email || contactData.phone || "TikTok Lead",
          email: contactData.email || null,
          phone: contactData.phone || null,
          first_name: contactData.first_name || null,
          last_name: contactData.last_name || null,
          company_name: contactData.company_name || null,
          source: "tiktok",
          tags: ["tiktok"],
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
          p_trigger_type: "tiktok_form_submitted",
          p_event_payload: {
            teamId,
            lead: {
              id: contactId,
              email: contactData.email || null,
              phone: contactData.phone || null,
              name: contactData.name || null,
              first_name: contactData.first_name || null,
              last_name: contactData.last_name || null,
              source: "tiktok",
            },
            tiktok: {
              lead_id: leadId,
              form_id: formId,
              ad_id: adId,
              campaign_id: campaignId,
              submitted_at: submittedAt,
              custom_fields: contactData.custom_fields,
            },
          },
          p_event_id: `tiktok:${leadId || formId || "lead"}:${Date.now()}`,
        });
        console.log("[TikTok Webhook] Automation event fired for contact:", contactId);
      } catch (err) {
        console.error("[TikTok Webhook] Error firing automation event:", err);
      }
    }

    console.log(`[TikTok Webhook] Processed lead for team ${teamId}, contact: ${contactId}`);

    return new Response(
      JSON.stringify({ success: true, contactId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[TikTok Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
