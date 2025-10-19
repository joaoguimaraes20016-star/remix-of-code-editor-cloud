import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Refresh Calendly access token using refresh token
 * This function should be called when the access token expires
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { teamId } = await req.json();

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: 'Team ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Refreshing Calendly token for team:', teamId);

    // Fetch team's refresh token
    const { data: team, error: teamError } = await supabaseClient
      .from('teams')
      .select('calendly_refresh_token, calendly_token_expires_at')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      console.error('Error fetching team:', teamError);
      return new Response(
        JSON.stringify({ error: 'Team not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!team.calendly_refresh_token) {
      return new Response(
        JSON.stringify({ error: 'No refresh token found. Please reconnect Calendly.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth credentials
    const clientId = Deno.env.get('CALENDLY_CLIENT_ID');
    const clientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('OAuth credentials not configured');
      return new Response(
        JSON.stringify({ error: 'OAuth not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh the access token
    console.log('Exchanging refresh token for new access token...');
    const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: team.calendly_refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token refresh failed:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to refresh token. Please reconnect Calendly.',
          needsReauth: true 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenResponse.json();
    const newAccessToken = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in; // seconds until expiration

    if (!newAccessToken) {
      console.error('No access token in refresh response');
      return new Response(
        JSON.stringify({ error: 'No access token received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();

    console.log('Token refreshed successfully, expires at:', expiresAt);

    // Update team with new tokens
    const { error: updateError } = await supabaseClient
      .from('teams')
      .update({
        calendly_access_token: newAccessToken,
        calendly_refresh_token: newRefreshToken,
        calendly_token_expires_at: expiresAt,
      })
      .eq('id', teamId);

    if (updateError) {
      console.error('Error updating team tokens:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save new tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        expiresAt,
        message: 'Token refreshed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in refresh-calendly-token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
