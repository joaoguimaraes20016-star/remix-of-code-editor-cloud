import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

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

// Verify Meta webhook signature
function verifySignature(payload: string, signature: string, appSecret: string): boolean {
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }
  
  const expectedSignature = signature.substring(7);
  const hmac = createHmac("sha256", appSecret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest("hex");
  
  return expectedSignature === calculatedSignature;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle webhook verification (GET request from Meta)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    
    console.log("[Meta Webhook] Verification request received", {
      mode,
      hasToken: !!token,
      hasChallenge: !!challenge,
    });
    
    const verifyToken = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN");
    
    if (mode === "subscribe" && token === verifyToken) {
      console.log("[Meta Webhook] Verification successful");
      return new Response(challenge, { status: 200 });
    } else {
      console.error("[Meta Webhook] Verification failed - token mismatch");
      return new Response("Forbidden", { status: 403 });
    }
  }

  // Handle webhook events (POST request)
  if (req.method === "POST") {
    try {
      const rawBody = await req.text();
      const appSecret = Deno.env.get("META_CLIENT_SECRET");
      
      // Verify signature
      const signature = req.headers.get("X-Hub-Signature-256");
      if (appSecret && signature) {
        if (!verifySignature(rawBody, signature, appSecret)) {
          console.error("Invalid webhook signature");
          return new Response("Invalid signature", { status: 401 });
        }
      }

      const body = JSON.parse(rawBody);
      console.log("Received Meta webhook:", JSON.stringify(body, null, 2));

      const supabase = getSupabaseClient();

      // Handle leadgen events
      if (body.object === "page") {
        for (const entry of body.entry || []) {
          const pageId = entry.id;
          
          for (const change of entry.changes || []) {
            if (change.field === "leadgen") {
              const leadgenId = change.value.leadgen_id;
              const formId = change.value.form_id;
              const createdTime = change.value.created_time;
              
              console.log("[Meta Webhook] Lead received", {
                leadgenId,
                formId,
                pageId,
                createdTime,
              });
              
              // Find team by page subscription
              const { data: integrations, error: integrationError } = await supabase
                .from("team_integrations")
                .select("team_id, access_token, config")
                .eq("integration_type", "meta")
                .eq("is_connected", true);
              
              if (integrationError) {
                console.error("Error finding integrations:", integrationError);
                continue;
              }
              
              // Find the team that has this page subscribed
              let matchedIntegration = null;
              for (const integration of integrations || []) {
                const config = integration.config as Record<string, any>;
                const selectedPages = config?.selected_pages || [];
                const subscribedForms = config?.subscribed_forms || [];
                
                // Check if page is subscribed
                if (selectedPages.some((p: any) => p.id === pageId)) {
                  matchedIntegration = integration;
                  break;
                }
                
                // Or check if form is subscribed
                if (subscribedForms.some((f: any) => f.form_id === formId)) {
                  matchedIntegration = integration;
                  break;
                }
              }
              
              if (!matchedIntegration) {
                console.log(`No team found for page ${pageId} or form ${formId}`);
                continue;
              }
              
              const teamId = matchedIntegration.team_id;
              const accessToken = matchedIntegration.access_token;
              const config = matchedIntegration.config as Record<string, any>;
              
              // Get page access token
              const selectedPage = (config?.selected_pages || []).find((p: any) => p.id === pageId);
              const pageAccessToken = selectedPage?.access_token || accessToken;
              
              // Fetch full lead data from Meta
              const leadResponse = await fetch(
                `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${pageAccessToken}`
              );
              const leadData = await leadResponse.json();
              
              if (leadData.error) {
                console.error("Error fetching lead:", leadData.error);
                continue;
              }
              
              console.log("Lead data:", JSON.stringify(leadData, null, 2));
              
              // Parse lead field data
              const fieldData = leadData.field_data || [];
              const leadInfo: Record<string, string> = {};
              
              for (const field of fieldData) {
                const name = field.name?.toLowerCase();
                const value = Array.isArray(field.values) ? field.values[0] : field.values;
                
                if (name.includes("email")) {
                  leadInfo.email = value;
                } else if (name.includes("phone") || name.includes("tel")) {
                  leadInfo.phone = value;
                } else if (name.includes("name") && !name.includes("last")) {
                  if (name.includes("full")) {
                    leadInfo.name = value;
                  } else if (name.includes("first")) {
                    leadInfo.first_name = value;
                  }
                } else if (name.includes("last") && name.includes("name")) {
                  leadInfo.last_name = value;
                } else {
                  // Store other fields as custom data
                  leadInfo[name] = value;
                }
              }
              
              // Build full name if we have parts
              if (!leadInfo.name && (leadInfo.first_name || leadInfo.last_name)) {
                leadInfo.name = [leadInfo.first_name, leadInfo.last_name].filter(Boolean).join(" ");
              }
              
              // Create contact in CRM
              const contactData = {
                team_id: teamId,
                email: leadInfo.email || null,
                phone: leadInfo.phone || null,
                name: leadInfo.name || null,
                first_name: leadInfo.first_name || null,
                last_name: leadInfo.last_name || null,
                source: "facebook_lead_form",
                custom_fields: {
                  facebook_lead_id: leadgenId,
                  facebook_form_id: formId,
                  facebook_page_id: pageId,
                  lead_created_at: new Date(createdTime * 1000).toISOString(),
                  ...Object.fromEntries(
                    Object.entries(leadInfo).filter(([k]) => !["email", "phone", "name", "first_name", "last_name"].includes(k))
                  ),
                },
              };
              
              // Check if contact already exists
              let contactId: string | null = null;
              
              if (leadInfo.email) {
                const { data: existingContact } = await supabase
                  .from("contacts")
                  .select("id")
                  .eq("team_id", teamId)
                  .eq("email", leadInfo.email)
                  .single();
                
                if (existingContact) {
                  contactId = existingContact.id;
                  // Update existing contact
                  await supabase
                    .from("contacts")
                    .update({
                      phone: leadInfo.phone || undefined,
                      name: leadInfo.name || undefined,
                      custom_fields: contactData.custom_fields,
                      last_activity_at: new Date().toISOString(),
                    })
                    .eq("id", contactId);
                }
              }
              
              if (!contactId) {
                // Create new contact
                const { data: newContact, error: contactError } = await supabase
                  .from("contacts")
                  .insert(contactData)
                  .select("id")
                  .single();
                
                if (contactError) {
                  console.error("Error creating contact:", contactError);
                } else {
                  contactId = newContact.id;
                }
              }
              
              console.log("[Meta Webhook] Contact saved", {
                leadgenId,
                teamId,
                contactId,
                email: leadInfo.email,
              });
              
              // Trigger automation for facebook_lead_form trigger type
              if (contactId) {
                try {
                  await supabase.rpc("fire_automation_event", {
                    p_team_id: teamId,
                    p_trigger_type: "facebook_lead_form",
                    p_event_payload: {
                      teamId,
                      lead: {
                        id: contactId,
                        email: leadInfo.email || null,
                        phone: leadInfo.phone || null,
                        name: leadInfo.name || null,
                        first_name: leadInfo.first_name || null,
                        last_name: leadInfo.last_name || null,
                        source: "facebook_lead_form",
                      },
                      meta: {
                        facebook_lead_id: leadgenId,
                        facebook_form_id: formId,
                        facebook_page_id: pageId,
                        lead_created_at: new Date(createdTime * 1000).toISOString(),
                      },
                    },
                    p_event_id: `fb_lead:${leadgenId}`,
                  });
                  console.log("[Meta Webhook] Automation triggered", { leadgenId, teamId });
                } catch (automationError) {
                  console.error("[Meta Webhook] Failed to trigger automation:", automationError);
                  // Don't fail the webhook - lead is already saved
                }
              }
            }
          }
        }
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
