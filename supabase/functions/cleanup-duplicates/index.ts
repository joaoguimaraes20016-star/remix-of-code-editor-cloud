import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all duplicate sales
    const { data: allSales, error: fetchError } = await supabase
      .from('sales')
      .select('id, customer_name, date, sales_rep, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    // Group by customer_name, date, sales_rep and keep only the first one
    const seen = new Map<string, string>();
    const duplicateIds: string[] = [];

    for (const sale of allSales || []) {
      const key = `${sale.customer_name}-${sale.date}-${sale.sales_rep}`;
      
      if (seen.has(key)) {
        // This is a duplicate, mark for deletion
        duplicateIds.push(sale.id);
      } else {
        // First occurrence, keep it
        seen.set(key, sale.id);
      }
    }

    console.log(`Found ${duplicateIds.length} duplicates to delete`);

    // Delete duplicates in batches
    if (duplicateIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .in('id', duplicateIds);

      if (deleteError) throw deleteError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: duplicateIds.length,
        remainingCount: seen.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
