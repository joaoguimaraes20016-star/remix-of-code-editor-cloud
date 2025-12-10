import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhook_url, funnel_name } = await req.json();

    if (!webhook_url) {
      return new Response(
        JSON.stringify({ error: 'webhook_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testing GHL webhook:', webhook_url);

    // Create comprehensive test payload matching submit-funnel-lead structure
    const testPayload = {
      lead_id: `test_lead_${Date.now()}`,
      contact_id: `test_contact_${Date.now()}`,
      email: "testlead@example.com",
      phone: "+1 (555) 123-4567",
      name: "John Test Lead",
      source: `Funnel: ${funnel_name || 'My Test Funnel'}`,
      funnel_id: "test_funnel_uuid",
      funnel_name: funnel_name || "My Test Funnel",
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: "test_campaign",
      opt_in: true,
      opt_in_timestamp: new Date().toISOString(),
      custom_fields: {
        "What's your budget?": "$3,000 - $6,000",
        "What's your goal?": "Scale my business",
        "How soon do you want to start?": "Ready now",
        "What industry are you in?": "E-commerce"
      },
      calendly_booked: true,
      calendly_event_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      calendly_event_uri: "https://calendly.com/events/test123",
      submitted_at: new Date().toISOString()
    };

    console.log('Sending test payload:', JSON.stringify(testPayload, null, 2));

    // Send to GHL webhook
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    console.log('GHL response status:', response.status);
    console.log('GHL response:', responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: `GHL returned status ${response.status}`,
          details: responseText 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test payload sent successfully',
        payload_sent: testPayload
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error testing GHL webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
