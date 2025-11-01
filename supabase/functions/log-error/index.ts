import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorLog {
  team_id?: string;
  user_id?: string;
  error_type: string;
  error_message: string;
  error_context?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { team_id, user_id, error_type, error_message, error_context }: ErrorLog = await req.json();

    // Log the error to database
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert({
        team_id: team_id || null,
        user_id: user_id || null,
        error_type,
        error_message,
        error_context: error_context || {},
      });

    if (insertError) {
      console.error('Failed to log error:', insertError);
      throw insertError;
    }

    console.log('Error logged:', { error_type, team_id, user_id });

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in log-error function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
