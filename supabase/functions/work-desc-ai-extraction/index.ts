
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

// AI system prompt for work description extraction
const WORK_DESCRIPTION_AI_PROMPT = `
You are a work description extraction specialist for electrical and HVAC invoices. Your job is to extract ONLY the actual work performed descriptions from invoice line items.

WHAT TO EXTRACT:
- Detailed descriptions of work performed (installations, repairs, services)
- Labour descriptions and activities
- Work dates and timeframes mentioned
- Technical work details

WHAT TO IGNORE:
- Materials, parts, components (screws, cables, outlets, switches, etc.)
- Addresses and location details
- Van charges, misc charges, call-out fees
- Thank you messages and contact information
- Generic items with prices but no work description

RULES:
1. Focus on ACTION WORDS: install, repair, service, test, commission, troubleshoot, etc.
2. Include labour descriptions and time spent
3. Include dates/times when work was performed
4. Exclude pure material lists
5. Combine related work descriptions into a coherent narrative
6. If no actual work description is found, return empty string

EXAMPLES:
Good extractions:
- "Arrived on site at 8am, installed new heat pump system, commissioned and tested operation, completed at 4pm"
- "Troubleshoot electrical fault in kitchen, replaced faulty wiring in wall cavity, tested all circuits"
- "Service call - diagnosed SmartVent system fault, cleaned filters, adjusted settings"

Bad extractions (ignore these):
- "15A RCD outlet $45" (material only)
- "123 Main Street, Auckland" (address only)
- "Screws and cable ties" (materials only)

Return JSON: {"work_description": "extracted description here"}
If no work description found, return: {"work_description": ""}
`.trim();

// Extract work descriptions using AI
async function extractWorkDescriptionsBatch(invoices) {
  const batchInput = invoices.map((inv, i) => {
    let lineItemsText = '';
    try {
      const items = typeof inv.line_items === 'string' ? JSON.parse(inv.line_items) : inv.line_items;
      if (Array.isArray(items)) {
        lineItemsText = items.map(item => item.Description || '').filter(desc => desc && desc.length > 5).join('\n');
      }
    } catch (e) {
      lineItemsText = 'No valid line items';
    }
    return `[${i}] Invoice: ${inv.invoice_number || inv.id}\nLine Items:\n${lineItemsText}`;
  }).join('\n\n---\n\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: WORK_DESCRIPTION_AI_PROMPT },
        { role: 'user', content: `Extract work descriptions from these invoices. Focus on actual work performed, labour, and dates. Ignore materials and addresses:\n\n${batchInput}` }
      ],
      temperature: 0.1,
      max_tokens: 1000
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
  
  // Parse the AI response - expect one JSON object per invoice
  const results = invoices.map((inv, i) => {
    const result = { id: inv.id, work_description: '' };
    
    // Try to extract work description for this invoice index
    const indexPattern = new RegExp(`\\[${i}\\][\\s\\S]*?\\{[\\s\\S]*?"work_description":\\s*"([^"]*)"[\\s\\S]*?\\}`, 'i');
    const match = content.match(indexPattern);
    
    if (match && match[1]) {
      result.work_description = match[1].trim();
    } else {
      // Fallback: try to find any JSON with work_description
      try {
        const jsonMatch = content.match(/\{"work_description":\s*"([^"]*)"\}/);
        if (jsonMatch && jsonMatch[1] && i === 0) {
          result.work_description = jsonMatch[1].trim();
        }
      } catch (e) {
        console.error('Failed to parse AI response for invoice', inv.id);
      }
    }
    
    return result;
  });
  
  return { results, usage };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testBatch = false, batchSize = 200, offset = 0 } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const size = testBatch ? Math.min(batchSize, 10) : Math.min(batchSize, 200);
    
    // Find invoices that need AI work description extraction
    const { data: invoices, error: fetchErr } = await supabase
      .from('invoices')
      .select('id, invoice_number, line_items, work_description')
      .eq('invoice_type', 'ACCREC')
      .not('line_items', 'is', null)
      .neq('line_items', '')
      .or('work_description.is.null,work_description.eq.,work_description.lt.20')
      .range(offset, offset + size - 1);

    if (fetchErr) throw new Error(fetchErr.message);
    if (!invoices?.length) {
      return new Response(JSON.stringify({
        success: true, 
        message: 'No invoices need AI work description extraction', 
        processed: 0, 
        updated: 0, 
        hasMore: false, 
        nextOffset: offset
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Count remaining for progress tracking
    const { count: total } = await supabase
      .from('invoices')
      .select('*', { head: true, count: 'exact' })
      .eq('invoice_type', 'ACCREC')
      .not('line_items', 'is', null)
      .neq('line_items', '')
      .or('work_description.is.null,work_description.eq.,work_description.lt.20');

    console.log(`[WORK-DESC-AI] Processing ${invoices.length} invoices for AI work description extraction`);

    // Process invoices in smaller batches for AI
    let results = [];
    let usageTotals = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 };
    
    const batchSizeAI = 5; // Smaller batches for detailed work description extraction
    const batches = [];
    for (let i = 0; i < invoices.length; i += batchSizeAI) {
      batches.push(invoices.slice(i, i + batchSizeAI));
    }
    
    const maxConc = 3; // Conservative concurrency for quality
    for (let i = 0; i < batches.length; i += maxConc) {
      const slice = batches.slice(i, i + maxConc);
      const out = await Promise.all(slice.map(batch => extractWorkDescriptionsBatch(batch)));
      out.forEach(o => {
        results.push(...o.results);
        usageTotals.prompt_tokens += o.usage.prompt_tokens;
        usageTotals.completion_tokens += o.usage.completion_tokens;
        usageTotals.total_tokens += o.usage.total_tokens;
        usageTotals.cost += o.usage.cost;
      });
      if (i + maxConc < batches.length) await new Promise(r => setTimeout(r, 500));
    }

    // Update invoices with AI-extracted work descriptions
    let updated = 0;
    const updateOperations = [];

    for (const result of results) {
      if (result.work_description && result.work_description.length > 10) {
        updateOperations.push(
          supabase
            .from('invoices')
            .update({ work_description: result.work_description })
            .eq('id', result.id)
        );
      }
    }

    if (updateOperations.length > 0) {
      const updateResults = await Promise.all(updateOperations);
      const errors = updateResults.filter(r => r.error);
      
      if (errors.length > 0) {
        console.error('AI work description update errors:', errors);
        throw new Error(`Failed to update invoices: ${errors[0].error.message}`);
      }
      
      updated = updateOperations.length;
    }

    const nextOffset = offset + invoices.length;
    const hasMore = (total || 0) > nextOffset;
    const remaining = Math.max(0, (total || 0) - nextOffset);

    console.log(`💰 [AI-USAGE] Tokens used: ${usageTotals.total_tokens}, Cost: $${usageTotals.cost}`);

    return new Response(JSON.stringify({
      success: true,
      message: `🧠 AI work description extraction processed ${invoices.length}, updated ${updated} with intelligent work descriptions. Cost: $${usageTotals.cost.toFixed(5)}`,
      processed: invoices.length,
      updated,
      tokenUsage: usageTotals,
      hasMore,
      nextOffset,
      remaining,
      extractionType: 'ai-work-description'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error('AI work description extraction error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
