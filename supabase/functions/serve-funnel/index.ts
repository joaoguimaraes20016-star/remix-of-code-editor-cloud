import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Your Lovable app's base URL - this is where the React SPA is hosted
// NOTE: Custom domains always load the bundle described by APP_BASE_URL's index.html.
// If the custom domain looks "old", ensure this URL points to the latest published SPA build.
const DEFAULT_APP_BASE_URL = 'https://code-hug-hub.lovable.app';
const APP_BASE_URL = Deno.env.get('APP_BASE_URL') ?? DEFAULT_APP_BASE_URL;

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

    // 4. Fetch the actual index.html from the Lovable app (has correct hashed asset URLs)
    console.log(`[serve-funnel] Fetching index.html from ${APP_BASE_URL}/index.html`);
    
    const appIndexResponse = await fetch(`${APP_BASE_URL}/index.html`, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Infostack-Funnel-Server/1.0',
      },
    });

    if (!appIndexResponse.ok) {
      console.error(`[serve-funnel] Failed to fetch app index.html: ${appIndexResponse.status}`);
      return new Response('Failed to load application', { 
        status: 502, 
        headers: corsHeaders 
      });
    }

    let appHtml = await appIndexResponse.text();
    const appIndexEtag = appIndexResponse.headers.get('etag') || '';
    const appIndexLastModified = appIndexResponse.headers.get('last-modified') || '';
    console.log(`[serve-funnel] Fetched index.html (${appHtml.length} bytes) etag=${appIndexEtag} lastModified=${appIndexLastModified}`);
    // Cache-bust asset URLs to ensure latest bundle is loaded
    // This prevents stale JS/CSS from being served on custom domains
    appHtml = appHtml.replace(
      /\/assets\/index\.js/g,
      `/assets/index.js?v=${BUILD_TIMESTAMP}`
    );
    appHtml = appHtml.replace(
      /\/assets\/index\.css/g,
      `/assets/index.css?v=${BUILD_TIMESTAMP}`
    );

    // 5. Inject funnel data into the HTML
    const snapshot = funnel.published_document_snapshot as any;
    const settings = funnel.settings as any;

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

    const shellData = JSON.stringify({
      appBaseUrl: APP_BASE_URL,
      edgeBuild: BUILD_TIMESTAMP,
      appIndexEtag,
      appIndexLastModified,
      domain: cleanDomain,
      funnelId: funnel.id,
      snapshot: {
        version: snapshot?.version ?? null,
        pages: Array.isArray(snapshot?.pages) ? snapshot.pages.length : 0,
        steps: Array.isArray(snapshot?.steps) ? snapshot.steps.length : 0,
      },
    }).replace(/</g, '\\u003c');

    // Inject BEFORE the main bundle script so data is available at boot
    // We use the body (not head) to avoid conflicts with next-themes and other head-manipulating libs
    const injectionScript = `<script>window.__INFOSTACK_FUNNEL__=${funnelData};window.__INFOSTACK_DOMAIN__="${cleanDomain}";window.__INFOSTACK_SHELL__=${shellData};</script>`;

    // Inject at the very start of <body> — before any other scripts
    appHtml = appHtml.replace(/<body[^>]*>/, (match) => {
      const debugComment = debugMode
        ? `\n<!-- serve-funnel: app_base_url=${APP_BASE_URL} edge_build=${BUILD_TIMESTAMP} etag=${appIndexEtag} -->`
        : '';
      return `${match}\n${injectionScript}${debugComment}`;
    });

    // Update page title if funnel has a name
    if (funnel.name) {
      appHtml = appHtml.replace(/<title>.*?<\/title>/, `<title>${funnel.name}</title>`);
    }

    // Add canonical URL for the custom domain
    const canonicalTag = `<link rel="canonical" href="https://${cleanDomain}${queryString ? `?${queryString}` : ''}">`;
    appHtml = appHtml.replace('</head>', `${canonicalTag}\n</head>`);

    // Add meta description and OG tags if available
    const metaDescription = settings?.seo?.description || snapshot?.settings?.seo?.description || '';
    const ogImage = settings?.seo?.ogImage || snapshot?.settings?.seo?.ogImage || '';
    
    if (metaDescription) {
      appHtml = appHtml.replace('</head>', `<meta name="description" content="${metaDescription}">\n<meta property="og:description" content="${metaDescription}">\n</head>`);
    }
    if (ogImage) {
      appHtml = appHtml.replace('</head>', `<meta property="og:image" content="${ogImage}">\n</head>`);
    }
    appHtml = appHtml.replace('</head>', `<meta property="og:title" content="${funnel.name || 'Funnel'}">\n</head>`);

    console.log(`[serve-funnel] Serving proxied HTML for: ${cleanDomain}`);

    return new Response(appHtml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Frame-Options': 'SAMEORIGIN',
        // Debug/tracing headers
        'X-Infostack-App-Base-Url': APP_BASE_URL,
        'X-Infostack-Edge-Build': BUILD_TIMESTAMP,
        'X-Infostack-App-Index-Etag': appIndexEtag,
        'X-Infostack-App-Index-Last-Modified': appIndexLastModified,
        'X-Infostack-Domain': cleanDomain,
        'X-Infostack-Funnel-Id': funnel.id,
        'X-Infostack-Snapshot-Version': String((snapshot as any)?.version ?? ''),
        'X-Infostack-Snapshot-Pages': String(Array.isArray((snapshot as any)?.pages) ? (snapshot as any).pages.length : 0),
        'X-Infostack-Snapshot-Steps': String(Array.isArray((snapshot as any)?.steps) ? (snapshot as any).steps.length : 0),
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
