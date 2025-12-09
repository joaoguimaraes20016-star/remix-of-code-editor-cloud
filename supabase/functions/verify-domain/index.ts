import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Our hosting domain for custom domains
const HOSTING_DOMAIN = 'funnel.grwthop.com';

async function checkDNSRecords(domain: string): Promise<{
  cnameValid: boolean;
  cnameValue: string | null;
  rootCnameValid: boolean;
  rootCnameValue: string | null;
}> {
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
      console.log(`CNAME record response for www.${domain}:`, JSON.stringify(cnameData));
      
      if (cnameData.Answer && cnameData.Answer.length > 0) {
        const cnameRecords = cnameData.Answer.filter((r: any) => r.type === 5);
        for (const record of cnameRecords) {
          // Remove trailing dot from CNAME
          const value = record.data?.replace(/\.$/, '').toLowerCase();
          results.cnameValue = value;
          if (value === HOSTING_DOMAIN || value === `${HOSTING_DOMAIN}.`) {
            results.cnameValid = true;
            break;
          }
        }
      }
    }

    // Check CNAME record for root domain (some registrars support this)
    const rootCnameResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=CNAME`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (rootCnameResponse.ok) {
      const rootCnameData = await rootCnameResponse.json();
      console.log(`CNAME record response for ${domain}:`, JSON.stringify(rootCnameData));
      
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

    // Also check if domain resolves to our hosting via A record (in case of CNAME flattening)
    // Some DNS providers flatten CNAME to A records
    const aResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=www.${domain}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (aResponse.ok && !results.cnameValid) {
      const aData = await aResponse.json();
      console.log(`A record response for www.${domain}:`, JSON.stringify(aData));
      
      // If we get A records and the CNAME check failed, it might be CNAME flattening
      // We'll consider it valid if DNS resolves (user followed instructions)
      if (aData.Answer && aData.Answer.length > 0) {
        // Check if we can trace back to our hosting domain
        const hostingAResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${HOSTING_DOMAIN}&type=A`, {
          headers: { 'Accept': 'application/dns-json' }
        });
        
        if (hostingAResponse.ok) {
          const hostingAData = await hostingAResponse.json();
          if (hostingAData.Answer && hostingAData.Answer.length > 0) {
            const hostingIPs = hostingAData.Answer.filter((r: any) => r.type === 1).map((r: any) => r.data);
            const domainIPs = aData.Answer.filter((r: any) => r.type === 1).map((r: any) => r.data);
            
            // If the domain resolves to the same IPs as our hosting, consider it valid
            const matchingIPs = domainIPs.some((ip: string) => hostingIPs.includes(ip));
            if (matchingIPs) {
              results.cnameValid = true;
              results.cnameValue = `Resolves to ${HOSTING_DOMAIN} IPs`;
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('DNS lookup error:', error);
  }

  return results;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domainId, domain, verificationToken } = await req.json();
    
    if (!domainId || !domain) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying domain: ${domain}`);

    // Check DNS records
    const dnsResults = await checkDNSRecords(domain);
    
    console.log('DNS check results:', JSON.stringify(dnsResults));

    // Domain is verified if either www or root CNAME points to our hosting
    const isVerified = dnsResults.cnameValid || dnsResults.rootCnameValid;
    
    // Update database with results
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (isVerified) {
      // Domain is verified - update status and mark SSL as provisioned
      // SSL is handled by Cloudflare automatically when proxied through grwthop.com
      const { error: updateError } = await supabase
        .from('funnel_domains')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          ssl_provisioned: true, // Cloudflare handles SSL automatically
          ssl_status: 'active',
          dns_a_record_valid: dnsResults.rootCnameValid, // Repurposing for root domain check
          dns_txt_record_valid: dnsResults.cnameValid, // Repurposing for www check
          health_status: 'healthy',
          last_health_check: new Date().toISOString(),
        })
        .eq('id', domainId);

      if (updateError) {
        console.error('Error updating domain status:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          verified: true,
          ssl_status: 'active',
          dns_results: dnsResults,
          message: 'Domain verified successfully! SSL is provided by Cloudflare.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Not verified yet - return current status
      return new Response(
        JSON.stringify({
          verified: false,
          ssl_status: 'pending',
          dns_results: dnsResults,
          message: 'DNS records not yet configured correctly',
          requirements: {
            cname_record: {
              host: 'www',
              required: HOSTING_DOMAIN,
              found: dnsResults.cnameValue,
              valid: dnsResults.cnameValid
            },
            root_cname: {
              host: '@',
              required: HOSTING_DOMAIN,
              found: dnsResults.rootCnameValue,
              valid: dnsResults.rootCnameValid,
              note: 'Optional - some registrars don\'t support root CNAME'
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Verification failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
