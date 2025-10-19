import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { teamId, accessToken, organizationUri } = await req.json();

    // Check if this is a service role call (from OAuth callback)
    const authHeader = req.headers.get('Authorization');
    const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'xxx');

    // For non-service-role calls, verify user authentication and permissions
    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify user is team owner or offer owner
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (membership?.role !== 'owner' && membership?.role !== 'offer_owner') {
        return new Response(JSON.stringify({ error: 'Only team owners and offer owners can setup Calendly' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Register webhook with Calendly - include team ID in URL
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/calendly-webhook?team_id=${teamId}`;
    
    const webhookResponse = await fetch('https://api.calendly.com/webhook_subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        organization: organizationUri,
        scope: 'organization',
        events: [
          'invitee.created',
          'invitee.canceled',
        ],
        signing_key: Deno.env.get('CALENDLY_SIGNING_KEY') || crypto.randomUUID(),
      }),
    });

    let webhookId;
    
    if (!webhookResponse.ok) {
      const errorData = await webhookResponse.json();
      
      // If webhook already exists, fetch existing webhooks and use that
      if (errorData.title === 'Already Exists' || errorData.message?.includes('already exists')) {
        console.log('Webhook already exists, fetching existing webhooks...');
        
        const listResponse = await fetch(`https://api.calendly.com/webhook_subscriptions?organization=${encodeURIComponent(organizationUri)}&scope=organization`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          const existingWebhook = listData.collection?.find((w: any) => w.callback_url === webhookUrl);
          
          if (existingWebhook) {
            webhookId = existingWebhook.uri;
            console.log('Using existing webhook:', webhookId);
          } else {
            console.error('Could not find existing webhook');
            return new Response(JSON.stringify({ error: 'Webhook configuration mismatch' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          console.error('Failed to list webhooks:', await listResponse.text());
          return new Response(JSON.stringify({ error: 'Failed to verify webhook' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        console.error('Failed to register webhook:', errorData);
        return new Response(JSON.stringify({ error: 'Failed to register webhook' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const webhookData = await webhookResponse.json();
      webhookId = webhookData.resource?.uri;
    }

    // Store credentials in database
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        calendly_access_token: accessToken,
        calendly_organization_uri: organizationUri,
        calendly_webhook_id: webhookId,
      })
      .eq('id', teamId);

    if (updateError) {
      console.error('Failed to update team:', updateError);
      
      // Try to cleanup webhook if database update failed
      if (webhookId) {
        await fetch(webhookId, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }

      return new Response(JSON.stringify({ error: 'Failed to save configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully configured Calendly for team:', teamId);

    return new Response(JSON.stringify({ 
      success: true,
      webhookId,
      webhookUrl 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
