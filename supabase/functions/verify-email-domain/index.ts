// supabase/functions/verify-email-domain/index.ts
// Verify a custom sending domain's DNS records via Mailgun

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyDomainRequest {
  domainId: string;
  teamId: string;
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
    const { domainId, teamId }: VerifyDomainRequest = await req.json();

    if (!domainId || !teamId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing domainId or teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch domain from database
    const { data: domainRecord, error: fetchError } = await supabase
      .from("team_sending_domains")
      .select("*")
      .eq("id", domainId)
      .eq("team_id", teamId)
      .single();

    if (fetchError || !domainRecord) {
      return new Response(
        JSON.stringify({ success: false, error: "Domain not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullDomain = domainRecord.full_domain;
    console.log(`[verify-email-domain] Verifying domain: ${fullDomain}`);

    // Update status to verifying
    await supabase
      .from("team_sending_domains")
      .update({ status: "verifying" })
      .eq("id", domainId);

    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
    const mailgunBaseUrl = Deno.env.get("MAILGUN_BASE_URL") || "https://api.mailgun.net/v3";

    let verified = false;
    let verificationError: string | null = null;
    let updatedDnsRecords = domainRecord.dns_records;

    if (mailgunApiKey) {
      // Real Mailgun verification
      console.log("[verify-email-domain] Calling Mailgun verify API...");

      // First trigger verification
      const verifyResponse = await fetch(`${mailgunBaseUrl}/domains/${fullDomain}/verify`, {
        method: "PUT",
        headers: {
          "Authorization": `Basic ${btoa(`api:${mailgunApiKey}`)}`,
        },
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error("[verify-email-domain] Mailgun verify error:", errorText);
      }

      // Then fetch domain status
      const statusResponse = await fetch(`${mailgunBaseUrl}/domains/${fullDomain}`, {
        headers: {
          "Authorization": `Basic ${btoa(`api:${mailgunApiKey}`)}`,
        },
      });

      if (statusResponse.ok) {
        const domainData = await statusResponse.json();
        console.log("[verify-email-domain] Mailgun domain status:", JSON.stringify(domainData));

        // Check verification status
        verified = domainData.domain?.state === "active";
        
        // Update DNS records with verification status
        if (domainData.sending_dns_records) {
          updatedDnsRecords = domainData.sending_dns_records.map((record: any) => ({
            type: record.record_type,
            host: record.name,
            value: record.value,
            verified: record.valid === "valid" || record.valid === true,
            priority: record.priority,
          }));

          // Add receiving records if present
          if (domainData.receiving_dns_records) {
            for (const record of domainData.receiving_dns_records) {
              updatedDnsRecords.push({
                type: record.record_type,
                host: record.name,
                value: record.value,
                verified: record.valid === "valid" || record.valid === true,
                priority: record.priority,
              });
            }
          }
        }

        if (!verified) {
          // Find which records are not verified
          const unverifiedRecords = updatedDnsRecords
            .filter((r: any) => !r.verified)
            .map((r: any) => r.host);
          
          if (unverifiedRecords.length > 0) {
            verificationError = `Records not verified: ${unverifiedRecords.join(", ")}`;
          }
        }
      } else {
        verificationError = "Failed to fetch domain status from Mailgun";
      }
    } else {
      // Stub mode - simulate verification after some time
      console.log("[verify-email-domain] Stub mode - simulating verification");
      
      // Randomly verify or fail for demo purposes
      const createdAt = new Date(domainRecord.created_at);
      const minutesSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60);
      
      // Verify after 2 minutes in stub mode
      verified = minutesSinceCreation > 2;
      
      if (!verified) {
        verificationError = "DNS records not yet propagated. Please wait a few minutes.";
      }
      
      // Update mock records with verification status
      updatedDnsRecords = (domainRecord.dns_records || []).map((record: any) => ({
        ...record,
        verified,
      }));
    }

    // Update database
    const { error: updateError } = await supabase
      .from("team_sending_domains")
      .update({
        status: verified ? "verified" : "pending",
        verified_at: verified ? new Date().toISOString() : null,
        verification_error: verificationError,
        dns_records: updatedDnsRecords,
      })
      .eq("id", domainId);

    if (updateError) {
      console.error("[verify-email-domain] Update error:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified,
        error: verificationError,
        dnsRecords: updatedDnsRecords,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[verify-email-domain] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
