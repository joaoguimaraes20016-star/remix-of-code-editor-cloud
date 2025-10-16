import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { teamId } = await req.json();
    console.log('Syncing appointments for team:', teamId);

    // Get the team's Google Sheets URL
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('google_sheets_url')
      .eq('id', teamId)
      .maybeSingle();

    if (teamError) {
      console.error('Error fetching team:', teamError);
      return new Response(
        JSON.stringify({ error: 'Error fetching team data: ' + teamError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!team || !team.google_sheets_url) {
      console.error('No Google Sheets URL configured for team:', teamId);
      return new Response(
        JSON.stringify({ error: 'No Google Sheets URL configured. Please add a URL in the Appointments settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching data from:', team.google_sheets_url);

    // Fetch data from Google Sheets published CSV
    const sheetsResponse = await fetch(team.google_sheets_url);
    console.log('Sheets response status:', sheetsResponse.status);
    
    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      console.error('Failed to fetch Google Sheets. Status:', sheetsResponse.status, 'Body:', errorText);
      throw new Error(`Failed to fetch Google Sheets (${sheetsResponse.status}). Make sure the URL is a published CSV link.`);
    }

    const csvText = await sheetsResponse.text();
    const rows = csvText.split('\n').slice(1); // Skip header row
    console.log('CSV rows found:', rows.length);
    
    const appointments = rows
      .filter((row: string) => row.trim())
      .map((row: string) => {
        const cells = row.split(',').map((cell: string) => cell.trim().replace(/^"|"$/g, ''));
        const [leadName, leadEmail, startAtUtc] = cells;
        
        if (!leadName || !leadEmail || !startAtUtc) {
          console.warn('Skipping invalid row:', row);
          return null;
        }
        
        return {
          team_id: teamId,
          lead_name: leadName,
          lead_email: leadEmail,
          start_at_utc: new Date(startAtUtc).toISOString(),
          status: 'NEW',
        };
      })
      .filter((apt): apt is NonNullable<typeof apt> => apt !== null);

    if (appointments.length === 0) {
      console.log('No valid appointments to import');
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'No appointments to import' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Inserting appointments:', appointments.length);

    // Insert appointments
    const { error: insertError } = await supabase
      .from('appointments')
      .insert(appointments);

    if (insertError) {
      console.error('Error inserting appointments:', insertError);
      throw insertError;
    }

    console.log(`Successfully synced ${appointments.length} appointments for team ${teamId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: appointments.length,
        message: `Successfully synced ${appointments.length} appointments` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-appointments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
