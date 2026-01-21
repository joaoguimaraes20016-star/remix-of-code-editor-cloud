// supabase/functions/add-email-domain/index.ts
// Provision a custom sending domain via Mailgun

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AddDomainRequest {
  teamId: string;
  domain: string;
  subdomain?: string | null;
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
    const { teamId, domain, subdomain }: AddDomainRequest = await req.json();

    if (!teamId || !domain) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing teamId or domain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;
    console.log(`[add-email-domain] Adding domain: ${fullDomain} for team: ${teamId}`);

    // Check if Mailgun is configured
    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
    const mailgunBaseUrl = Deno.env.get("MAILGUN_BASE_URL") || "https://api.mailgun.net/v3";

    let dnsRecords: Array<{ type: string; host: string; value: string }>;
    let providerDomainId: string | null = null;

    if (mailgunApiKey) {
      // Real Mailgun implementation
      console.log("[add-email-domain] Provisioning domain in Mailgun...");

      const mailgunResponse = await fetch(`${mailgunBaseUrl}/domains`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`api:${mailgunApiKey}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          name: fullDomain,
          spam_action: "disabled",
          force_dkim_authority: "true",
        }),
      });

      if (!mailgunResponse.ok) {
        const errorText = await mailgunResponse.text();
        console.error("[add-email-domain] Mailgun error:", errorText);
        
        // Check if domain already exists
        if (mailgunResponse.status === 400 && errorText.includes("already exists")) {
          // Fetch existing domain info
          const existingResponse = await fetch(`${mailgunBaseUrl}/domains/${fullDomain}`, {
            headers: {
              "Authorization": `Basic ${btoa(`api:${mailgunApiKey}`)}`,
            },
          });
          
          if (existingResponse.ok) {
            const existingData = await existingResponse.json();
            dnsRecords = formatMailgunDnsRecords(existingData, fullDomain);
            providerDomainId = fullDomain;
          } else {
            throw new Error("Domain already exists in another account");
          }
        } else {
          throw new Error(`Mailgun error: ${errorText}`);
        }
      } else {
        const mailgunData = await mailgunResponse.json();
        console.log("[add-email-domain] Mailgun response:", JSON.stringify(mailgunData));
        
        dnsRecords = formatMailgunDnsRecords(mailgunData, fullDomain);
        providerDomainId = fullDomain;
      }
    } else {
      // Stub mode - generate realistic-looking DNS records
      console.log("[add-email-domain] Stub mode - generating mock DNS records");
      
      dnsRecords = [
        {
          type: "TXT",
          host: fullDomain,
          value: `v=spf1 include:mailgun.org ~all`,
        },
        {
          type: "TXT",
          host: `smtp._domainkey.${fullDomain}`,
          value: `k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...`,
        },
        {
          type: "CNAME",
          host: `email.${fullDomain}`,
          value: `mailgun.org`,
        },
      ];
      providerDomainId = `stub_${Date.now()}`;
    }

    // Insert into database
    const { data: insertedDomain, error: insertError } = await supabase
      .from("team_sending_domains")
      .insert({
        team_id: teamId,
        domain,
        subdomain: subdomain || null,
        status: "pending",
        provider: "mailgun",
        provider_domain_id: providerDomainId,
        dns_records: dnsRecords,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[add-email-domain] Insert error:", insertError);
      throw new Error(insertError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        domain: insertedDomain,
        dnsRecords,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[add-email-domain] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function formatMailgunDnsRecords(mailgunData: any, fullDomain: string) {
  const records: Array<{ type: string; host: string; value: string; priority?: number }> = [];

  // SPF record
  if (mailgunData.sending_dns_records) {
    for (const record of mailgunData.sending_dns_records) {
      records.push({
        type: record.record_type,
        host: record.name || fullDomain,
        value: record.value,
        priority: record.priority,
      });
    }
  }

  // Receiving/tracking records
  if (mailgunData.receiving_dns_records) {
    for (const record of mailgunData.receiving_dns_records) {
      records.push({
        type: record.record_type,
        host: record.name || fullDomain,
        value: record.value,
        priority: record.priority,
      });
    }
  }

  // If no records from API, generate defaults
  if (records.length === 0) {
    records.push(
      { type: "TXT", host: fullDomain, value: "v=spf1 include:mailgun.org ~all" },
      { type: "TXT", host: `smtp._domainkey.${fullDomain}`, value: "k=rsa; p=..." },
      { type: "CNAME", host: `email.${fullDomain}`, value: "mailgun.org" }
    );
  }

  return records;
}
