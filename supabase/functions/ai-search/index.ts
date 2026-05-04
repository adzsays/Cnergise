import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { logServiceUsage } from "../_shared/cost-tracking.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, searchType } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's metadata for context
    const { data: metadata, error: metaError } = await supabase
      .from('unified_metadata')
      .select('*')
      .eq('user_id', user.id)
      .order('date_occurred', { ascending: false })
      .limit(100);

    if (metaError) {
      console.error('Error fetching metadata:', metaError);
    }

    // Build context from user's data
    const contextSummary = (metadata || []).map(m => 
      `[${m.source_type}] ${m.title}${m.amount ? ` ($${m.amount})` : ''}${m.date_occurred ? ` on ${new Date(m.date_occurred).toLocaleDateString()}` : ''}`
    ).slice(0, 50).join('\n');

    // Use Perplexity for intelligent cross-linking search
    let aiResponse = null;
    if (perplexityKey) {
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { 
              role: 'system', 
              content: `You are an AI assistant for Cnergise, a personal life management app. The user has the following data in their system:
              
${contextSummary}

Your job is to:
1. Answer questions about their data
2. Find cross-links between events (e.g., meetings related to expenses)
3. Summarize patterns and insights
4. Suggest connections they might have missed

Always reference specific items from their data when relevant. Be concise and actionable.`
            },
            { role: 'user', content: query }
          ],
        }),
      });

      const perplexityData = await perplexityResponse.json();
      logServiceUsage({ service: "perplexity", operation: "sonar", units: 1, function_name: "ai-search", user_id: user.id, metadata: { usage: perplexityData?.usage } });
      aiResponse = perplexityData.choices?.[0]?.message?.content || null;
    }

    // Also do a keyword-based search in the metadata
    const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);
    
    const relevantItems = (metadata || []).filter(item => {
      const searchText = `${item.title} ${item.description || ''} ${(item.keywords || []).join(' ')}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    });

    // Save search to history
    await supabase.from('ai_search_history').insert({
      user_id: user.id,
      query,
      results: { ai_response: aiResponse, items_found: relevantItems.length },
      metadata_ids: relevantItems.map(i => i.id),
    });

    return new Response(JSON.stringify({
      success: true,
      ai_response: aiResponse,
      related_items: relevantItems,
      total_context_items: metadata?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Search error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
