import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Fail fast if any key is missing
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_KEY   = Deno.env.get('OPENAI_API_KEY');
if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  throw new Error('Missing one of SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY');
}

// GPT-4.1-mini pricing (per 1K tokens)
const PRICING = {
  INPUT_PER_1K: 0.00015,
  OUTPUT_PER_1K: 0.0006
};

function calculateCost(usage) {
  const p = usage.prompt_tokens   || 0;
  const c = usage.completion_tokens || 0;
  const cost = p/1000 * PRICING.INPUT_PER_1K + c/1000 * PRICING.OUTPUT_PER_1K;
  return { prompt_tokens: p, completion_tokens: c, total_tokens: usage.total_tokens||0, cost: Math.round(cost*1e5)/1e5 };
}

// Enhanced AI error logging
function logAIError(error, response) {
  const status = response?.status;
  console.error('[AI-ERROR] OpenAI API error:', error);
  console.error('[AI-ERROR] Status:', status);
  
  if (status === 429) {
    console.error('⚠️ [AI-ERROR] OpenAI quota exceeded - check billing dashboard: https://platform.openai.com/usage');
  } else if (status === 401) {
    console.error('🔑 [AI-ERROR] API key invalid - verify credentials: https://platform.openai.com/api-keys');
  } else if (status === 403) {
    console.error('💳 [AI-ERROR] Payment required - add funds to continue: https://platform.openai.com/account/billing');
  } else if (status >= 400 && status < 500) {
    console.error('🚫 [AI-ERROR] Client error - check API request format');
  } else if (status >= 500) {
    console.error('🔧 [AI-ERROR] Server error - OpenAI service issue');
  }
}

// Pre-filter logic
function hasRelevantKeywords(desc) {
  const t = desc.toLowerCase();
  return [
    'heat pump','ac','air con','hvac','air conditioning',
    'switchboard','panel','repair','install','replace','service',
    'maintenance','diagnosis','fault','broken','not working'
  ].some(term => t.includes(term));
}

// System prompt as a constant
const SYSTEM_PROMPT = `
Extract keywords for HVAC/electrical work. Categories: heat pumps, air con, switchboards, service work.
Return a JSON array of { "index":<n>, "keywords":[...]}.
Rules:
- max 8 keywords
- lowercase
- equipment + action words only
- format: [{"index":0,"keywords":["heat pump","repair"]},...]

`.trim();

// Batch extraction with fence-stripping
async function extractKeywordsBatch(invoices) {
  const batchInput = invoices.map((inv,i)=>`[${i}] ${inv.work_description}`).join('\n');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role:'system', content: SYSTEM_PROMPT },
        { role:'user',   content: `Extract keywords from these work descriptions:\n${batchInput}` }
      ],
      temperature: 0.1,
      max_tokens: 800
    })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    logAIError(errorText, res);
    throw new Error(`OpenAI API error: ${errorText}`);
  }
  
  const j = await res.json();
  const usage = calculateCost(j.usage || {});
  let content = j.choices[0]?.message?.content || '';
  // strip markdown fences
  content = content.replace(/^```(?:json)?\s*/,'').replace(/```\s*$/,'').trim();
  let parsed = [];
  try {
    parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
  } catch {
    console.error('Batch parse failed:', content);
    return { results: [], usage };
  }
  const results = invoices.map((inv,i)=>{
    const match = parsed.find(r=>r.index===i);
    const kws = Array.isArray(match?.keywords) ? match.keywords : [];
    return {
      id: inv.id,
      keywords: kws.slice(0,8).map(k=>k.toLowerCase().trim()).filter(k=>k)
    };
  });
  return { results, usage };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testBatch=false, batchSize=250, offset=0 } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const size = testBatch ? Math.min(batchSize,10) : Math.min(batchSize,250);
    const { data: invoices, error: fetchErr } = await supabase
      .from('invoices')
      .select('id,work_description')
      .eq('invoice_type','ACCREC')
      .not('work_description','is',null)
      .neq('work_description','')
      .or('service_keywords.is.null,service_keywords.eq.{}')
      .range(offset, offset + size - 1);

    if (fetchErr) throw new Error(fetchErr.message);
    if (!invoices?.length) {
      return new Response(JSON.stringify({
        success: true, message:'No invoices to process', processed:0, updated:0, hasMore:false, nextOffset:offset
      }), { headers:{ ...corsHeaders,'Content-Type':'application/json' }});
    }

    // pre-filter
    const relevant = invoices.filter(inv => hasRelevantKeywords(inv.work_description));
    const filteredOut = invoices.filter(inv => !hasRelevantKeywords(inv.work_description));
    console.log(`Filtered ${filteredOut.length}/${invoices.length} invoices out`);

    // count remaining
    const { count: total } = await supabase
      .from('invoices')
      .select('*',{ head:true, count:'exact' })
      .eq('invoice_type','ACCREC')
      .not('work_description','is',null)
      .neq('work_description','')
      .or('service_keywords.is.null,service_keywords.eq.{}');

    // if none relevant, just mark them empty using bulk update
    let results = [];
    let usageTotals = { prompt_tokens:0, completion_tokens:0, total_tokens:0, cost:0 };
    
    if (relevant.length === 0) {
      // All invoices filtered out - use bulk update with WHERE IN clause
      const invoiceIds = invoices.map(inv => inv.id);
      const { error: bulkUpdateError } = await supabase
        .from('invoices')
        .update({ service_keywords: [] })
        .in('id', invoiceIds);

      if (bulkUpdateError) {
        console.error('Bulk update error for filtered invoices:', bulkUpdateError);
        throw new Error(`Failed to update filtered invoices: ${bulkUpdateError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Processed ${invoices.length} invoices, updated ${invoices.length} (all filtered out as non-relevant)`,
        processed: invoices.length,
        updated: invoices.length,
        totalKeywords: 0,
        tokenUsage: usageTotals,
        hasMore: (total||0) > offset + invoices.length,
        nextOffset: offset + invoices.length,
        remaining: Math.max(0,(total||0)-(offset + invoices.length))
      }), { headers:{ ...corsHeaders,'Content-Type':'application/json' }});
    }

    // Process relevant invoices with AI
    const batchSizeAI = 15;
    const batches = [];
    for (let i=0; i<relevant.length; i+=batchSizeAI) {
      batches.push(relevant.slice(i, i+batchSizeAI));
    }
    const maxConc = 8;
    for (let i=0; i<batches.length; i+=maxConc) {
      const slice = batches.slice(i, i+maxConc);
      const out = await Promise.all(slice.map(batch=>extractKeywordsBatch(batch)));
      out.forEach(o=>{
        results.push(...o.results);
        usageTotals.prompt_tokens   += o.usage.prompt_tokens;
        usageTotals.completion_tokens += o.usage.completion_tokens;
        usageTotals.total_tokens    += o.usage.total_tokens;
        usageTotals.cost            += o.usage.cost;
      });
      if (i+maxConc < batches.length) await new Promise(r=>setTimeout(r,200));
    }

    // Bulk update operations using WHERE IN clauses instead of individual calls
    const updateOperations = [];
    let updated = 0;

    // Update invoices with extracted keywords
    const withKeywords = results.filter(r => r.keywords.length > 0);
    if (withKeywords.length > 0) {
      // Group by identical keyword arrays to minimize DB calls
      const keywordGroups = new Map();
      withKeywords.forEach(result => {
        const keyStr = JSON.stringify(result.keywords);
        if (!keywordGroups.has(keyStr)) {
          keywordGroups.set(keyStr, { keywords: result.keywords, ids: [] });
        }
        keywordGroups.get(keyStr).ids.push(result.id);
      });

      // Execute bulk updates for each unique keyword set
      for (const [, group] of keywordGroups) {
        updateOperations.push(
          supabase
            .from('invoices')
            .update({ service_keywords: group.keywords })
            .in('id', group.ids)
        );
      }
    }

    // Update filtered out invoices with empty arrays
    if (filteredOut.length > 0) {
      const filteredIds = filteredOut.map(inv => inv.id);
      updateOperations.push(
        supabase
          .from('invoices')
          .update({ service_keywords: [] })
          .in('id', filteredIds)
      );
    }

    // Execute all bulk updates
    if (updateOperations.length > 0) {
      const updateResults = await Promise.all(updateOperations);
      const errors = updateResults.filter(r => r.error);
      
      if (errors.length > 0) {
        console.error('Bulk update errors:', errors);
        throw new Error(`Failed to update invoices: ${errors[0].error.message}`);
      }
      
      updated = invoices.length; // All invoices get updated
    }

    const totalKeywordsExtracted = results.reduce((sum,r)=>sum + r.keywords.length,0);
    const nextOffset = offset + invoices.length;
    const hasMore = (total||0) > nextOffset;

    console.log(`💰 [AI-USAGE] Tokens used: ${usageTotals.total_tokens}, Cost: $${usageTotals.cost}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${invoices.length}, updated ${updated} with ${totalKeywordsExtracted} keywords (${filteredOut.length} filtered out)`,
      processed: invoices.length,
      updated,
      totalKeywords: totalKeywordsExtracted,
      tokenUsage: usageTotals,
      hasMore,
      nextOffset,
      remaining: Math.max(0,(total||0)-nextOffset),
      filterStats: {
        total: invoices.length,
        relevant: relevant.length,
        filtered: filteredOut.length,
        filterPercentage: Math.round((filteredOut.length / invoices.length) * 100)
      }
    }), {
      headers:{
        ...corsHeaders,
        'Content-Type':'application/json'
      }
    });

  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ success:false, error: err.message }), {
      status:500,
      headers:{ ...corsHeaders,'Content-Type':'application/json' }
    });
  }
});
