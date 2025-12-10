import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain')?.toLowerCase().replace(/^www\./, '');

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain parameter required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[get-funnel-data] Fetching data for domain: ${domain}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find verified domain
    const { data: domainRecord, error: domainError } = await supabase
      .from('funnel_domains')
      .select('id, domain, funnel_id, ssl_provisioned')
      .eq('domain', domain)
      .eq('status', 'verified')
      .maybeSingle();

    if (domainError) {
      console.error('[get-funnel-data] Domain lookup error:', domainError);
      return new Response(JSON.stringify({ error: 'Domain lookup failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!domainRecord) {
      console.log(`[get-funnel-data] Domain not found or not verified: ${domain}`);
      return new Response(JSON.stringify({ error: 'Domain not found or not verified' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find published funnel linked to this domain
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, name, slug, settings, status')
      .eq('domain_id', domainRecord.id)
      .eq('status', 'published')
      .maybeSingle();

    if (funnelError) {
      console.error('[get-funnel-data] Funnel lookup error:', funnelError);
      return new Response(JSON.stringify({ error: 'Funnel lookup failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!funnel) {
      console.log(`[get-funnel-data] No published funnel for domain: ${domain}`);
      return new Response(JSON.stringify({ error: 'No published funnel found for this domain' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch funnel steps
    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, step_type, content, order_index')
      .eq('funnel_id', funnel.id)
      .order('order_index', { ascending: true });

    if (stepsError) {
      console.error('[get-funnel-data] Steps lookup error:', stepsError);
      return new Response(JSON.stringify({ error: 'Steps lookup failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[get-funnel-data] Found funnel ${funnel.slug} with ${steps?.length || 0} steps`);

    // Return JSON data
    return new Response(JSON.stringify({
      success: true,
      funnel: {
        id: funnel.id,
        name: funnel.name,
        slug: funnel.slug,
        settings: funnel.settings,
      },
      steps: steps || [],
      domain: domain,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[get-funnel-data] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
