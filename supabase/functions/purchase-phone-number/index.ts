// supabase/functions/purchase-phone-number/index.ts
// Purchase a phone number from Twilio and assign to team

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseRequest {
  teamId: string;
  phoneNumber: string;
  friendlyName?: string;
  setAsDefault?: boolean;
}

interface TwilioIncomingNumber {
  sid: string;
  phone_number: string;
  friendly_name: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
}

function getTwilioCredentials() {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const apiKeySid = Deno.env.get("TWILIO_API_KEY_SID");
  const apiKeySecret = Deno.env.get("TWILIO_API_KEY_SECRET");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  
  if (accountSid && apiKeySid && apiKeySecret) {
    return {
      accountSid,
      credentials: btoa(`${apiKeySid}:${apiKeySecret}`),
    };
  }
  
  if (accountSid && authToken) {
    return {
      accountSid,
      credentials: btoa(`${accountSid}:${authToken}`),
    };
  }
  
  return null;
}

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

  try {
    const requestData: PurchaseRequest = await req.json();
    const { teamId, phoneNumber, friendlyName, setAsDefault = true } = requestData;

    if (!teamId || !phoneNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: teamId, phoneNumber" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get Twilio credentials
    const twilioAuth = getTwilioCredentials();
    
    if (!twilioAuth) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Twilio is not configured",
          code: "TWILIO_NOT_CONFIGURED"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if phone number is already owned by this team
    const { data: existingNumber } = await supabase
      .from("team_phone_numbers")
      .select("id")
      .eq("phone_number", phoneNumber)
      .eq("is_active", true)
      .single();

    if (existingNumber) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "This phone number is already in use",
          code: "NUMBER_ALREADY_OWNED"
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Purchase the number from Twilio
    const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAuth.accountSid}/IncomingPhoneNumbers.json`;
    
    const formData = new URLSearchParams();
    formData.append("PhoneNumber", phoneNumber);
    if (friendlyName) {
      formData.append("FriendlyName", friendlyName);
    }
    
    // Set webhook URLs for inbound
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    formData.append("SmsUrl", `${supabaseUrl}/functions/v1/inbound-sms`);
    formData.append("VoiceUrl", `${supabaseUrl}/functions/v1/inbound-call`);

    console.log("[purchase-phone-number] Purchasing:", phoneNumber);

    const twilioResponse = await fetch(purchaseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth.credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("[purchase-phone-number] Twilio error:", result);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.message || "Failed to purchase phone number",
          code: result.code
        }),
        { status: twilioResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const purchasedNumber: TwilioIncomingNumber = result;

    // If this will be the default, unset any existing default
    if (setAsDefault) {
      await supabase
        .from("team_phone_numbers")
        .update({ is_default: false })
        .eq("team_id", teamId)
        .eq("is_default", true);
    }

    // Determine pricing based on number type
    const isTollFree = phoneNumber.startsWith("+1800") || 
                       phoneNumber.startsWith("+1888") || 
                       phoneNumber.startsWith("+1877") || 
                       phoneNumber.startsWith("+1866") ||
                       phoneNumber.startsWith("+1855") ||
                       phoneNumber.startsWith("+1844") ||
                       phoneNumber.startsWith("+1833");
    const monthlyPriceCents = isTollFree ? 500 : 250;

    // Insert into team_phone_numbers
    const { data: insertedNumber, error: insertError } = await supabase
      .from("team_phone_numbers")
      .insert({
        team_id: teamId,
        phone_number: purchasedNumber.phone_number,
        phone_number_sid: purchasedNumber.sid,
        friendly_name: purchasedNumber.friendly_name || friendlyName || null,
        country_code: phoneNumber.startsWith("+1") ? "US" : "INTL",
        capabilities: {
          sms: purchasedNumber.capabilities.sms,
          voice: purchasedNumber.capabilities.voice,
          mms: purchasedNumber.capabilities.mms,
          whatsapp: false,
        },
        monthly_cost_cents: monthlyPriceCents,
        is_default: setAsDefault,
        is_active: true,
        webhook_configured: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[purchase-phone-number] DB insert error:", insertError);
      // Note: Number is already purchased from Twilio at this point
      // We should still return success but note the DB error
    }

    // Log the purchase transaction
    await supabase.from("credit_transactions").insert({
      team_id: teamId,
      transaction_type: "number_rental",
      channel: "number",
      amount: 0, // Or charge credits for the number
      balance_after: 0,
      reference_id: purchasedNumber.sid,
      description: `Purchased phone number ${purchasedNumber.phone_number}`,
    });

    console.log("[purchase-phone-number] Success:", {
      sid: purchasedNumber.sid,
      number: purchasedNumber.phone_number,
      teamId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        phoneNumber: {
          id: insertedNumber?.id,
          phoneNumber: purchasedNumber.phone_number,
          phoneNumberSid: purchasedNumber.sid,
          friendlyName: purchasedNumber.friendly_name,
          capabilities: {
            sms: purchasedNumber.capabilities.sms,
            voice: purchasedNumber.capabilities.voice,
            mms: purchasedNumber.capabilities.mms,
          },
          monthlyPriceCents,
          isDefault: setAsDefault,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("[purchase-phone-number] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
