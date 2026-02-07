// supabase/functions/typeform-webhook/index.ts
// Handles incoming Typeform webhook events (form submissions)
// Creates/updates contacts and fires automation events.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, typeform-signature",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Extract contact fields from Typeform answers
function extractContactFields(answers: any[]): Record<string, any> {
  const fields: Record<string, any> = {};
  const customFields: Record<string, any> = {};

  for (const answer of answers) {
    const fieldTitle = (answer.field?.title || "").toLowerCase();
    const fieldRef = answer.field?.ref || "";

    // Try to match common field names
    let value: string | null = null;

    switch (answer.type) {
      case "text":
      case "short_text":
      case "long_text":
        value = answer.text;
        break;
      case "email":
        value = answer.email;
        break;
      case "phone_number":
        value = answer.phone_number;
        break;
      case "number":
        value = String(answer.number);
        break;
      case "choice":
        value = answer.choice?.label || answer.choice?.other;
        break;
      case "choices":
        value = (answer.choices?.labels || []).join(", ");
        break;
      case "boolean":
        value = answer.boolean ? "Yes" : "No";
        break;
      case "date":
        value = answer.date;
        break;
      case "url":
        value = answer.url;
        break;
      default:
        value = JSON.stringify(answer);
    }

    // Map to contact fields by common names
    if (answer.type === "email" || fieldTitle.includes("email")) {
      fields.email = value;
    } else if (answer.type === "phone_number" || fieldTitle.includes("phone")) {
      fields.phone = value;
    } else if (fieldTitle.includes("first name") || fieldTitle === "first_name") {
      fields.first_name = value;
    } else if (fieldTitle.includes("last name") || fieldTitle === "last_name") {
      fields.last_name = value;
    } else if (fieldTitle.includes("name") && !fieldTitle.includes("company")) {
      fields.name = value;
    } else if (fieldTitle.includes("company") || fieldTitle.includes("business")) {
      fields.company_name = value;
    } else {
      // Store as custom field
      customFields[fieldRef || fieldTitle] = value;
    }
  }

  // Build full name if we have first/last but no full name
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

  // Only accept POST requests
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

    // Verify Typeform signature if secret is available
    const signature = req.headers.get("typeform-signature");
    if (signature) {
      const supabase = getSupabaseClient();
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("config")
        .eq("team_id", teamId)
        .eq("integration_type", "typeform")
        .single();

      const webhookSecret = integration?.config?.webhook_secret;
      if (webhookSecret) {
        // Typeform requires trailing newline before signing
        const bodyWithNewline = body + "\n";
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(webhookSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyWithNewline));
        // Typeform uses BASE64 encoding, not hex
        // Use Array.from to avoid spread operator overflow for large signatures
        const expectedSig = `sha256=${btoa(Array.from(new Uint8Array(sig), b => String.fromCharCode(b)).join(""))}`;

        if (signature !== expectedSig) {
          console.error("[Typeform Webhook] Signature mismatch");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Parse the Typeform response
    const formResponse = payload.form_response;
    if (!formResponse) {
      console.error("[Typeform Webhook] No form_response in payload");
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const answers = formResponse.answers || [];
    const formId = formResponse.form_id;
    const formTitle = payload.form_response?.definition?.title || "Unknown Form";
    const submittedAt = formResponse.submitted_at || new Date().toISOString();
    const responseId = formResponse.token || formResponse.response_id;

    // Extract contact fields
    const contactData = extractContactFields(answers);
    console.log("[Typeform Webhook] Extracted contact data:", JSON.stringify(contactData));

    const supabase = getSupabaseClient();

    // Create or update contact
    let contactId: string | null = null;

    if (contactData.email) {
      // Check for existing contact by email
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("team_id", teamId)
        .eq("email", contactData.email)
        .maybeSingle();

      if (existingContact) {
        contactId = existingContact.id;
        // Update existing contact
        await supabase
          .from("contacts")
          .update({
            ...(contactData.name && { name: contactData.name }),
            ...(contactData.first_name && { first_name: contactData.first_name }),
            ...(contactData.last_name && { last_name: contactData.last_name }),
            ...(contactData.phone && { phone: contactData.phone }),
            ...(contactData.company_name && { company_name: contactData.company_name }),
          })
          .eq("id", contactId);
      } else {
        // Create new contact
        const { data: newContact } = await supabase
          .from("contacts")
          .insert({
            team_id: teamId,
            name: contactData.name || contactData.email,
            email: contactData.email,
            phone: contactData.phone || null,
            first_name: contactData.first_name || null,
            last_name: contactData.last_name || null,
            company_name: contactData.company_name || null,
            source: "typeform",
            tags: ["typeform"],
          })
          .select("id")
          .single();

        contactId = newContact?.id || null;
      }
    }

    // Fire automation event
    if (contactId) {
      try {
        await supabase.rpc("fire_automation_event", {
          p_team_id: teamId,
          p_trigger_type: "typeform_response",
          p_event_payload: {
            teamId,
            lead: {
              id: contactId,
              email: contactData.email || null,
              phone: contactData.phone || null,
              name: contactData.name || null,
              first_name: contactData.first_name || null,
              last_name: contactData.last_name || null,
              source: "typeform",
            },
            typeform: {
              form_id: formId,
              form_title: formTitle,
              response_id: responseId,
              submitted_at: submittedAt,
              answers: contactData.custom_fields,
            },
          },
          p_event_id: `typeform:${responseId || formId}:${Date.now()}`,
        });
        console.log("[Typeform Webhook] Automation event fired for contact:", contactId);
      } catch (err) {
        console.error("[Typeform Webhook] Error firing automation event:", err);
      }
    }

    console.log(`[Typeform Webhook] Processed form ${formId} for team ${teamId}, contact: ${contactId}`);

    return new Response(
      JSON.stringify({ success: true, contactId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Typeform Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
