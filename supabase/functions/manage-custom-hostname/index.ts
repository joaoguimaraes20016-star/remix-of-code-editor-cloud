import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLOUDFLARE_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
const CLOUDFLARE_ZONE_ID = Deno.env.get('CLOUDFLARE_ZONE_ID');
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

interface CloudflareResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result?: any;
}

async function createCustomHostname(hostname: string): Promise<CloudflareResponse> {
  console.log(`Creating custom hostname: ${hostname}`);
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostname,
        ssl: {
          method: 'http',
          type: 'dv',
          settings: {
            http2: 'on',
            min_tls_version: '1.2',
          },
        },
      }),
    }
  );
  
  const data = await response.json();
  console.log('Create hostname response:', JSON.stringify(data));
  return data;
}

async function getCustomHostname(hostnameId: string): Promise<CloudflareResponse> {
  console.log(`Getting custom hostname status: ${hostnameId}`);
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames/${hostnameId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const data = await response.json();
  console.log('Get hostname response:', JSON.stringify(data));
  return data;
}

async function deleteCustomHostname(hostnameId: string): Promise<CloudflareResponse> {
  console.log(`Deleting custom hostname: ${hostnameId}`);
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames/${hostnameId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const data = await response.json();
  console.log('Delete hostname response:', JSON.stringify(data));
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, domainId, domain, hostnameId } = await req.json();
    
    console.log(`Action: ${action}, Domain: ${domain}, DomainId: ${domainId}, HostnameId: ${hostnameId}`);
    
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
      throw new Error('Cloudflare credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'create') {
      if (!domain || !domainId) {
        throw new Error('Domain and domainId are required for create action');
      }
      
      // Create the custom hostname in Cloudflare
      const cfResponse = await createCustomHostname(domain);
      
      if (!cfResponse.success) {
        const errorMsg = cfResponse.errors?.[0]?.message || 'Failed to create custom hostname';
        throw new Error(errorMsg);
      }
      
      const hostnameData = cfResponse.result;
      
      // Update the domain record with Cloudflare hostname ID
      const { error: updateError } = await supabase
        .from('funnel_domains')
        .update({
          cloudflare_hostname_id: hostnameData.id,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', domainId);
      
      if (updateError) {
        console.error('Failed to update domain record:', updateError);
        throw new Error('Failed to save hostname ID');
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          hostnameId: hostnameData.id,
          status: hostnameData.status,
          ssl: hostnameData.ssl,
          ownership_verification: hostnameData.ownership_verification,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'status') {
      if (!hostnameId) {
        throw new Error('HostnameId is required for status action');
      }
      
      const cfResponse = await getCustomHostname(hostnameId);
      
      if (!cfResponse.success) {
        const errorMsg = cfResponse.errors?.[0]?.message || 'Failed to get hostname status';
        throw new Error(errorMsg);
      }
      
      const hostnameData = cfResponse.result;
      
      // Map Cloudflare status to our domain status
      let domainStatus = 'pending';
      let sslProvisioned = false;
      
      if (hostnameData.status === 'active') {
        if (hostnameData.ssl?.status === 'active') {
          domainStatus = 'verified';
          sslProvisioned = true;
        } else {
          domainStatus = 'pending';
        }
      } else if (hostnameData.status === 'pending') {
        domainStatus = 'pending';
      } else if (hostnameData.status === 'moved' || hostnameData.status === 'deleted') {
        domainStatus = 'failed';
      }
      
      // Update domain record if domainId provided
      if (domainId) {
        const updateData: Record<string, any> = {
          status: domainStatus,
          ssl_provisioned: sslProvisioned,
          updated_at: new Date().toISOString(),
        };
        
        if (sslProvisioned) {
          updateData.verified_at = new Date().toISOString();
          updateData.ssl_provisioned_at = new Date().toISOString();
        }
        
        const { error: updateError } = await supabase
          .from('funnel_domains')
          .update(updateData)
          .eq('id', domainId);
        
        if (updateError) {
          console.error('Failed to update domain status:', updateError);
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          status: hostnameData.status,
          ssl: hostnameData.ssl,
          ownership_verification: hostnameData.ownership_verification,
          domainStatus,
          sslProvisioned,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'delete') {
      if (!hostnameId) {
        throw new Error('HostnameId is required for delete action');
      }
      
      const cfResponse = await deleteCustomHostname(hostnameId);
      
      if (!cfResponse.success) {
        console.warn('Cloudflare delete warning:', cfResponse.errors);
        // Don't throw - allow database cleanup even if CF delete fails
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    throw new Error(`Unknown action: ${action}`);
    
  } catch (error) {
    console.error('Error in manage-custom-hostname:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});