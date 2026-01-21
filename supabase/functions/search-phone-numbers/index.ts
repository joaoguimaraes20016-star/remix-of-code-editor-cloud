// supabase/functions/search-phone-numbers/index.ts
// Search available phone numbers from Twilio

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  teamId: string;
  country?: string; // ISO country code (default: US)
  areaCode?: string;
  contains?: string; // Number pattern to match
  type?: "local" | "toll-free" | "mobile";
  smsEnabled?: boolean;
  voiceEnabled?: boolean;
  limit?: number;
}

interface TwilioNumber {
  phone_number: string;
  friendly_name: string;
  locality: string;
  region: string;
  postal_code: string;
  iso_country: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
}

// Get Twilio auth credentials
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

  try {
    const requestData: SearchRequest = await req.json();
    const { 
      teamId,
      country = "US",
      areaCode,
      contains,
      type = "local",
      smsEnabled = true,
      voiceEnabled = true,
      limit = 20
    } = requestData;

    if (!teamId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify user is team admin
    const supabase = getSupabaseClient();
    
    // Get Twilio credentials
    const twilioAuth = getTwilioCredentials();
    
    if (!twilioAuth) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Twilio is not configured. Please contact support.",
          code: "TWILIO_NOT_CONFIGURED"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build search URL based on type
    let typeSegment = "Local";
    if (type === "toll-free") typeSegment = "TollFree";
    if (type === "mobile") typeSegment = "Mobile";
    
    const searchUrl = new URL(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAuth.accountSid}/AvailablePhoneNumbers/${country}/${typeSegment}.json`
    );
    
    // Add query params
    if (areaCode) searchUrl.searchParams.set("AreaCode", areaCode);
    if (contains) searchUrl.searchParams.set("Contains", contains);
    if (smsEnabled) searchUrl.searchParams.set("SmsEnabled", "true");
    if (voiceEnabled) searchUrl.searchParams.set("VoiceEnabled", "true");
    searchUrl.searchParams.set("PageSize", String(Math.min(limit, 50)));

    console.log("[search-phone-numbers] Searching:", searchUrl.toString());

    const response = await fetch(searchUrl.toString(), {
      headers: {
        "Authorization": `Basic ${twilioAuth.credentials}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[search-phone-numbers] Twilio error:", result);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.message || "Failed to search phone numbers",
          code: result.code
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Format response for frontend
    const availableNumbers = (result.available_phone_numbers || []).map((num: TwilioNumber) => ({
      phoneNumber: num.phone_number,
      friendlyName: num.friendly_name,
      locality: num.locality,
      region: num.region,
      postalCode: num.postal_code,
      country: num.iso_country,
      capabilities: {
        sms: num.capabilities.SMS,
        voice: num.capabilities.voice,
        mms: num.capabilities.MMS,
      },
      // Pricing (your markup)
      monthlyPriceCents: type === "toll-free" ? 500 : 250, // $5 toll-free, $2.50 local
    }));

    return new Response(
      JSON.stringify({
        success: true,
        numbers: availableNumbers,
        count: availableNumbers.length,
        type,
        country,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("[search-phone-numbers] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
