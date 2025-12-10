import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This function is called by Caddy's on-demand TLS before issuing SSL certificates
// It verifies that the requested domain is authorized in our system
// Returns 200 if domain is verified, 404 if not authorized

serve(async (req) => {
  try {
    // Caddy sends the domain as a query parameter
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');

    console.log(`Caddy TLS verification request for domain: ${domain}`);

    if (!domain) {
      console.log('No domain provided in verification request');
      return new Response('Domain parameter required', { status: 400 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if domain exists and is verified in our system
    const { data: domainRecord, error } = await supabase
      .from('funnel_domains')
      .select('id, domain, status')
      .eq('domain', domain)
      .eq('status', 'verified')
      .single();

    if (error || !domainRecord) {
      console.log(`Domain not authorized: ${domain}`, error?.message);
      return new Response('Domain not authorized', { status: 404 });
    }

    console.log(`Domain verified for TLS: ${domain}`);
    
    // Update SSL status
    await supabase
      .from('funnel_domains')
      .update({ 
        ssl_status: 'provisioning',
        updated_at: new Date().toISOString()
      })
      .eq('id', domainRecord.id);

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in domain verification:', error);
    return new Response('Internal error', { status: 500 });
  }
});
