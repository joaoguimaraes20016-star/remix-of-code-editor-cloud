import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Your Lovable app's base URL - this is where the React SPA is hosted
const APP_BASE_URL = Deno.env.get('SITE_URL') || 'https://code-hug-hub.lovable.app';

// Build timestamp for cache-busting
const BUILD_TIMESTAMP = Date.now().toString();

// Log on cold start
console.log(`[serve-funnel] Cold start - APP_BASE_URL: ${APP_BASE_URL}, BUILD: ${BUILD_TIMESTAMP}`);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let domain: string | null = url.searchParams.get('domain');
    const xForwardedHost = req.headers.get('x-forwarded-host');
    const hostHeader = req.headers.get('host');
    
    const debugMode = url.searchParams.get('debug') === '1';
    
    console.log(`[serve-funnel] APP_BASE_URL: ${APP_BASE_URL}`);
    console.log(`[serve-funnel] Full URL: ${req.url}`);
    console.log(`[serve-funnel] Request method: ${req.method}`);
    console.log(`[serve-funnel] Query param domain: ${domain}`);
    console.log(`[serve-funnel] X-Forwarded-Host: ${xForwardedHost}`);
    console.log(`[serve-funnel] Host: ${hostHeader}`);

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

    // 2. Get linked published funnel with full snapshot
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, name, slug, status, settings, published_document_snapshot, team_id')
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
    
    console.log(`[serve-funnel] Found funnel: ${funnel.name} (${funnel.slug}) for domain: ${cleanDomain}`);

    // 4. Serve HTML shell that embeds funnel data directly
    // This allows the SPA to render without a redirect - URL stays on custom domain
    const funnelData = JSON.stringify({
      funnel: {
        id: funnel.id,
        team_id: funnel.team_id,
        name: funnel.name,
        slug: funnel.slug,
        settings: funnel.settings,
        published_document_snapshot: funnel.published_document_snapshot,
      },
      domain: cleanDomain,
      queryParams: queryString ? Object.fromEntries(queryParams) : {},
    }).replace(/</g, '\\u003c'); // Escape < for script safety

    // Extract page title and meta from settings or snapshot
    const pageTitle = funnel.name || 'Funnel';
    const settings = funnel.settings as any;
    const snapshot = funnel.published_document_snapshot as any;
    const metaDescription = settings?.seo?.description || snapshot?.settings?.seo?.description || '';
    const ogImage = settings?.seo?.ogImage || snapshot?.settings?.seo?.ogImage || '';

    // Debug comment for troubleshooting
    const debugComment = debugMode 
      ? `<!-- serve-funnel DEBUG: APP_BASE_URL=${APP_BASE_URL} BUILD=${BUILD_TIMESTAMP} DOMAIN=${cleanDomain} -->\n  ` 
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  ${debugComment}<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  ${metaDescription ? `<meta name="description" content="${metaDescription}">` : ''}
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  <meta property="og:title" content="${pageTitle}">
  ${metaDescription ? `<meta property="og:description" content="${metaDescription}">` : ''}
  <link rel="canonical" href="https://${cleanDomain}${queryString ? `?${queryString}` : ''}">
  
  <!-- Inject funnel data for client-side rendering -->
  <script>
    window.__INFOSTACK_FUNNEL__ = ${funnelData};
    window.__INFOSTACK_DOMAIN__ = "${cleanDomain}";
  </script>
  
  <!-- Load the SPA assets with cache-busting -->
  <script type="module" crossorigin src="${APP_BASE_URL}/assets/index.js?v=${BUILD_TIMESTAMP}"></script>
  <link rel="stylesheet" crossorigin href="${APP_BASE_URL}/assets/index.css?v=${BUILD_TIMESTAMP}">
  
  <style>
    /* Critical CSS for loading state */
    body { margin: 0; padding: 0; background: #000; }
    #root { min-height: 100vh; }
    .funnel-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #000;
    }
    .funnel-loading::after {
      content: '';
      width: 32px;
      height: 32px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="root" class="funnel-loading"></div>
</body>
</html>`;

    console.log(`[serve-funnel] Serving inline funnel HTML for: ${cleanDomain}`);

    // CSP that allows our assets and inline scripts
    const cspHeader = [
      `default-src 'self' ${APP_BASE_URL}`,
      `script-src 'self' 'unsafe-inline' ${APP_BASE_URL} https://*.calendly.com`,
      `style-src 'self' 'unsafe-inline' ${APP_BASE_URL} https://fonts.googleapis.com`,
      `font-src 'self' ${APP_BASE_URL} https://fonts.gstatic.com`,
      `img-src 'self' ${APP_BASE_URL} data: blob: https:`,
      `connect-src 'self' ${APP_BASE_URL} https://*.supabase.co https://*.calendly.com`,
      `frame-src https://*.calendly.com https://*.youtube.com https://*.vimeo.com`,
    ].join('; ');

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Security-Policy': cspHeader,
        'X-Frame-Options': 'SAMEORIGIN',
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
