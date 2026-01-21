// supabase/functions/release-phone-number/index.ts
// Release a phone number from Twilio

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReleaseRequest {
  teamId: string;
  phoneNumberId: string; // Our DB ID
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
    const requestData: ReleaseRequest = await req.json();
    const { teamId, phoneNumberId } = requestData;

    if (!teamId || !phoneNumberId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: teamId, phoneNumberId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get the phone number record
    const { data: phoneRecord, error: fetchError } = await supabase
      .from("team_phone_numbers")
      .select("*")
      .eq("id", phoneNumberId)
      .eq("team_id", teamId)
      .eq("is_active", true)
      .single();

    if (fetchError || !phoneRecord) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Phone number not found or not owned by this team",
          code: "NUMBER_NOT_FOUND"
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

    // Delete from Twilio
    const deleteUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAuth.accountSid}/IncomingPhoneNumbers/${phoneRecord.phone_number_sid}.json`;

    console.log("[release-phone-number] Releasing:", phoneRecord.phone_number);

    const twilioResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        "Authorization": `Basic ${twilioAuth.credentials}`,
      },
    });

    if (!twilioResponse.ok && twilioResponse.status !== 404) {
      const result = await twilioResponse.json();
      console.error("[release-phone-number] Twilio error:", result);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.message || "Failed to release phone number from Twilio",
          code: result.code
        }),
        { status: twilioResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mark as released in our database
    const { error: updateError } = await supabase
      .from("team_phone_numbers")
      .update({ 
        is_active: false, 
        is_default: false,
        released_at: new Date().toISOString() 
      })
      .eq("id", phoneNumberId);

    if (updateError) {
      console.error("[release-phone-number] DB update error:", updateError);
    }

    // Log the release
    await supabase.from("credit_transactions").insert({
      team_id: teamId,
      transaction_type: "number_rental",
      channel: "number",
      amount: 0,
      balance_after: 0,
      reference_id: phoneRecord.phone_number_sid,
      description: `Released phone number ${phoneRecord.phone_number}`,
    });

    console.log("[release-phone-number] Success:", phoneRecord.phone_number);

    return new Response(
      JSON.stringify({
        success: true,
        releasedNumber: phoneRecord.phone_number,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("[release-phone-number] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
