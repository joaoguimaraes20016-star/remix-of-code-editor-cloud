import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Our hosting domain for custom domains
const HOSTING_DOMAIN = 'funnel.grwthop.com';

interface Domain {
  id: string;
  domain: string;
  team_id: string;
  verification_token: string;
  status: string;
  ssl_status: string;
  health_status: string;
  last_health_check: string | null;
  alert_sent_at: string | null;
}

async function checkDNSHealth(domain: string) {
  const results = {
    cnameValid: false,
    cnameValue: null as string | null,
    rootCnameValid: false,
    rootCnameValue: null as string | null,
  };

  try {
    // Check CNAME record for www subdomain
    const wwwCnameResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=www.${domain}&type=CNAME`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (wwwCnameResponse.ok) {
      const cnameData = await wwwCnameResponse.json();
      if (cnameData.Answer && cnameData.Answer.length > 0) {
        const cnameRecords = cnameData.Answer.filter((r: any) => r.type === 5);
        for (const record of cnameRecords) {
          const value = record.data?.replace(/\.$/, '').toLowerCase();
          results.cnameValue = value;
          if (value === HOSTING_DOMAIN || value === `${HOSTING_DOMAIN}.`) {
            results.cnameValid = true;
            break;
          }
        }
      }
    }

    // Check CNAME record for root domain
    const rootCnameResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=CNAME`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (rootCnameResponse.ok) {
      const rootCnameData = await rootCnameResponse.json();
      if (rootCnameData.Answer && rootCnameData.Answer.length > 0) {
        const cnameRecords = rootCnameData.Answer.filter((r: any) => r.type === 5);
        for (const record of cnameRecords) {
          const value = record.data?.replace(/\.$/, '').toLowerCase();
          results.rootCnameValue = value;
          if (value === HOSTING_DOMAIN || value === `${HOSTING_DOMAIN}.`) {
            results.rootCnameValid = true;
            break;
          }
        }
      }
    }

    // Also check if domain resolves to our hosting via A record (CNAME flattening)
    if (!results.cnameValid) {
      const aResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=www.${domain}&type=A`, {
        headers: { 'Accept': 'application/dns-json' }
      });
      
      if (aResponse.ok) {
        const aData = await aResponse.json();
        if (aData.Answer && aData.Answer.length > 0) {
          const hostingAResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${HOSTING_DOMAIN}&type=A`, {
            headers: { 'Accept': 'application/dns-json' }
          });
          
          if (hostingAResponse.ok) {
            const hostingAData = await hostingAResponse.json();
            if (hostingAData.Answer && hostingAData.Answer.length > 0) {
              const hostingIPs = hostingAData.Answer.filter((r: any) => r.type === 1).map((r: any) => r.data);
              const domainIPs = aData.Answer.filter((r: any) => r.type === 1).map((r: any) => r.data);
              
              const matchingIPs = domainIPs.some((ip: string) => hostingIPs.includes(ip));
              if (matchingIPs) {
                results.cnameValid = true;
                results.cnameValue = `Resolves to ${HOSTING_DOMAIN} IPs`;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`DNS check failed for ${domain}:`, error);
  }

  return results;
}

function determineHealthStatus(
  cnameValid: boolean, 
  rootCnameValid: boolean, 
  currentStatus: string
): string {
  if (cnameValid || rootCnameValid) {
    return 'healthy';
  } else if (currentStatus === 'verified') {
    // Was verified but now DNS is gone
    return 'offline';
  }
  return 'unknown';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all verified domains that need health checking
    const { data: domains, error: fetchError } = await supabase
      .from('funnel_domains')
      .select('*')
      .eq('status', 'verified');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Checking health for ${domains?.length || 0} verified domains`);

    const results: any[] = [];
    const alertsToSend: any[] = [];

    for (const domain of (domains || []) as Domain[]) {
      console.log(`Checking domain: ${domain.domain}`);
      
      const dnsResults = await checkDNSHealth(domain.domain);
      const healthStatus = determineHealthStatus(
        dnsResults.cnameValid, 
        dnsResults.rootCnameValid,
        domain.status
      );

      // Determine if we need to send an alert
      const previousHealth = domain.health_status;
      const shouldAlert = 
        (previousHealth === 'healthy' && healthStatus !== 'healthy') ||
        (previousHealth !== 'offline' && healthStatus === 'offline');

      // Update domain record
      const updateData: any = {
        last_health_check: new Date().toISOString(),
        health_status: healthStatus,
        dns_a_record_valid: dnsResults.rootCnameValid, // Repurposed for root check
        dns_txt_record_valid: dnsResults.cnameValid, // Repurposed for www check
      };

      // Mark domain as offline if DNS completely gone
      if (healthStatus === 'offline') {
        updateData.status = 'offline';
        updateData.ssl_provisioned = false;
        updateData.ssl_status = 'failed';
      }

      // If healthy, ensure SSL is active (Cloudflare handles SSL)
      if (healthStatus === 'healthy') {
        updateData.ssl_status = 'active';
        updateData.ssl_provisioned = true;
      }

      const { error: updateError } = await supabase
        .from('funnel_domains')
        .update(updateData)
        .eq('id', domain.id);

      if (updateError) {
        console.error(`Failed to update domain ${domain.domain}:`, updateError);
      }

      // Track if we should send alert
      if (shouldAlert && !domain.alert_sent_at) {
        alertsToSend.push({
          domain: domain.domain,
          team_id: domain.team_id,
          previous_status: previousHealth,
          new_status: healthStatus,
        });

        await supabase
          .from('funnel_domains')
          .update({ alert_sent_at: new Date().toISOString() })
          .eq('id', domain.id);
      }

      // Clear alert flag if domain recovered
      if (healthStatus === 'healthy' && domain.alert_sent_at) {
        await supabase
          .from('funnel_domains')
          .update({ alert_sent_at: null })
          .eq('id', domain.id);
      }

      results.push({
        domain: domain.domain,
        healthStatus,
        dnsResults,
      });
    }

    console.log(`Health check complete. ${results.length} domains checked, ${alertsToSend.length} alerts triggered`);

    return new Response(
      JSON.stringify({
        success: true,
        checked: results.length,
        alerts: alertsToSend.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Health check failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
