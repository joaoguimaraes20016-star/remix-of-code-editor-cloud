import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Your Lovable app's base URL - this is where the React SPA is hosted
const APP_BASE_URL = 'https://code-hug-hub.lovable.app';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let domain: string | null = url.searchParams.get('domain');
    const xForwardedHost = req.headers.get('x-forwarded-host');
    const hostHeader = req.headers.get('host');
    
    console.log(`[serve-funnel] Full URL: ${req.url}`);
    console.log(`[serve-funnel] Request method: ${req.method}`);
    console.log(`[serve-funnel] Query param domain: ${domain}`);
    console.log(`[serve-funnel] X-Forwarded-Host: ${xForwardedHost}`);
    console.log(`[serve-funnel] Host: ${hostHeader}`);
    console.log(`[serve-funnel] All headers:`, JSON.stringify(Object.fromEntries(req.headers.entries())));

    // Test endpoint for debugging Caddy routing
    if (url.searchParams.get('test') === 'true') {
      const cleanDomainTest = domain?.toLowerCase().replace(/^www\./, '').split(':')[0] || null;
      return new Response(JSON.stringify({
        detectedDomain: cleanDomainTest,
        source: domain ? 'query_param' : (xForwardedHost ? 'x-forwarded-host' : 'host'),
        rawQueryParam: domain,
        xForwardedHost,
        host: hostHeader,
        timestamp: new Date().toISOString(),
      }, null, 2), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
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
      const html = `<!DOCTYPE html>
<html>
<head><title>Domain Not Configured</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafb;">
  <div style="text-align: center; padding: 2rem;">
    <h1 style="color: #111827; margin-bottom: 0.5rem;">Domain Not Configured</h1>
    <p style="color: #6b7280; margin-bottom: 1.5rem;">The domain <strong>${cleanDomain}</strong> is not connected to any published funnel.</p>
    <a href="${APP_BASE_URL}" style="color: #6366f1; text-decoration: none;">Go to Infostack →</a>
  </div>
</body>
</html>`;
      return new Response(html, { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
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
      const html = `<!DOCTYPE html>
<html>
<head><title>No Funnel Published</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafb;">
  <div style="text-align: center; padding: 2rem;">
    <h1 style="color: #111827; margin-bottom: 0.5rem;">No Funnel Published</h1>
    <p style="color: #6b7280; margin-bottom: 1.5rem;">The domain <strong>${cleanDomain}</strong> doesn't have a published funnel yet.</p>
    <a href="${APP_BASE_URL}" style="color: #6366f1; text-decoration: none;">Go to Infostack →</a>
  </div>
</body>
</html>`;
      return new Response(html, { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
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
