import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Your Lovable app's base URL - this is where the React SPA is hosted
const APP_BASE_URL = 'https://closers-portal-7f79c.lovable.app';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let domain: string | null = url.searchParams.get('domain');
    
    console.log(`[serve-funnel] Request method: ${req.method}`);
    console.log(`[serve-funnel] Query param domain: ${domain}`);
    console.log(`[serve-funnel] X-Forwarded-Host: ${req.headers.get('x-forwarded-host')}`);
    console.log(`[serve-funnel] Host: ${req.headers.get('host')}`);
    
    if (!domain) {
      domain = req.headers.get('x-forwarded-host') || req.headers.get('host');
    }
    
    if (!domain) {
      console.log('[serve-funnel] ERROR: No domain could be determined');
      return new Response('Domain could not be determined', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const cleanDomain = domain.toLowerCase().replace(/^www\./, '').split(':')[0];
    console.log(`[serve-funnel] Resolving funnel for domain: ${cleanDomain}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Verify domain exists and is verified
    const { data: domainRecord, error: domainError } = await supabase
      .from('funnel_domains')
      .select('id, domain, status')
      .eq('domain', cleanDomain)
      .eq('status', 'verified')
      .single();

    if (domainError || !domainRecord) {
      console.log(`[serve-funnel] Domain not found or not verified: ${cleanDomain}`);
      return new Response('Domain not configured', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // 2. Get linked published funnel
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, slug, status')
      .eq('domain_id', domainRecord.id)
      .eq('status', 'published')
      .single();

    if (funnelError || !funnel) {
      console.log(`[serve-funnel] No published funnel for domain: ${cleanDomain}`);
      return new Response('No funnel configured', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // 3. Preserve query params (UTM tracking, etc.)
    const queryParams = new URLSearchParams(url.searchParams);
    queryParams.delete('domain'); // Remove internal param
    const queryString = queryParams.toString();
    
    // 4. Build redirect URL
    const redirectUrl = `${APP_BASE_URL}/f/${funnel.slug}${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[serve-funnel] 302 Redirect: ${cleanDomain} → ${redirectUrl}`);

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error: unknown) {
    console.error('[serve-funnel] Error:', error);
    return new Response('Internal error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
