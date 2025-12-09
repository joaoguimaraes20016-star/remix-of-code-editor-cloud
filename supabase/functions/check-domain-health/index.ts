import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPECTED_IP = '185.158.133.1';

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

async function checkDNSHealth(domain: string, verificationToken: string) {
  const results = {
    aRecordValid: false,
    txtRecordValid: false,
    aRecordValue: null as string | null,
    txtRecordValue: null as string | null,
  };

  try {
    // Check A record
    const aResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (aResponse.ok) {
      const aData = await aResponse.json();
      if (aData.Answer && aData.Answer.length > 0) {
        const aRecords = aData.Answer.filter((r: any) => r.type === 1);
        for (const record of aRecords) {
          results.aRecordValue = record.data;
          if (record.data === EXPECTED_IP) {
            results.aRecordValid = true;
            break;
          }
        }
      }
    }

    // Check TXT record
    const txtResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=_lovable.${domain}&type=TXT`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (txtResponse.ok) {
      const txtData = await txtResponse.json();
      if (txtData.Answer && txtData.Answer.length > 0) {
        const txtRecords = txtData.Answer.filter((r: any) => r.type === 16);
        for (const record of txtRecords) {
          const value = record.data?.replace(/"/g, '');
          results.txtRecordValue = value;
          if (value === `lovable_verify=${verificationToken}`) {
            results.txtRecordValid = true;
            break;
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
  aRecordValid: boolean, 
  txtRecordValid: boolean, 
  currentStatus: string
): string {
  if (aRecordValid && txtRecordValid) {
    return 'healthy';
  } else if (aRecordValid || txtRecordValid) {
    return 'degraded';
  } else if (currentStatus === 'verified') {
    // Was verified but now DNS is gone
    return 'offline';
  }
  return 'unknown';
}

function determineSSLStatus(
  healthStatus: string,
  currentSSLStatus: string,
  sslExpiresAt: string | null
): string {
  // If domain is offline, SSL is invalid
  if (healthStatus === 'offline') {
    return 'failed';
  }
  
  // Check if SSL is expired
  if (sslExpiresAt && new Date(sslExpiresAt) < new Date()) {
    return 'expired';
  }
  
  // If healthy and was pending, start provisioning
  if (healthStatus === 'healthy' && currentSSLStatus === 'pending') {
    return 'provisioning';
  }
  
  // If healthy and provisioning, mark as active (simulate provisioning completion)
  if (healthStatus === 'healthy' && currentSSLStatus === 'provisioning') {
    return 'active';
  }
  
  return currentSSLStatus;
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
      
      const dnsResults = await checkDNSHealth(domain.domain, domain.verification_token);
      const healthStatus = determineHealthStatus(
        dnsResults.aRecordValid, 
        dnsResults.txtRecordValid,
        domain.status
      );
      
      const sslStatus = determineSSLStatus(
        healthStatus,
        domain.ssl_status,
        null // Would pass ssl_expires_at here
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
        dns_a_record_valid: dnsResults.aRecordValid,
        dns_txt_record_valid: dnsResults.txtRecordValid,
        ssl_status: sslStatus,
      };

      // Set SSL provisioned timestamp if just became active
      if (sslStatus === 'active' && domain.ssl_status !== 'active') {
        updateData.ssl_provisioned_at = new Date().toISOString();
        // Set expiry to 90 days (Let's Encrypt standard)
        updateData.ssl_expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Mark domain as offline if DNS completely gone
      if (healthStatus === 'offline') {
        updateData.status = 'offline';
        updateData.ssl_provisioned = false;
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

        // Mark alert as sent
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
        sslStatus,
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
