import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting data integrity check...');

    // Run the integrity check function
    const { data: issues, error: checkError } = await supabase
      .rpc('check_data_integrity');

    if (checkError) {
      console.error('Error running integrity check:', checkError);
      throw checkError;
    }

    console.log('Integrity check completed. Issues found:', issues?.length || 0);

    // Log each issue to the database
    if (issues && issues.length > 0) {
      for (const issue of issues) {
        const { error: logError } = await supabase
          .from('data_integrity_logs')
          .insert({
            issue_type: issue.issue_type,
            issue_count: issue.issue_count,
            details: issue.details,
          });

        if (logError) {
          console.error('Error logging issue:', logError);
        } else {
          console.log(`Logged ${issue.issue_type}: ${issue.issue_count} instances`);
        }
      }
    }

    // Return summary
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      issues_found: issues?.length || 0,
      details: issues || [],
    };

    console.log('Integrity check summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in data-integrity-check function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
