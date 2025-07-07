
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Enhanced helper to extract work description from line items with smart content detection
const extractWorkDescription = (lineItems, debug = false) => {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    if (debug) console.log("[EXTRACT] No line items found");
    return "";
  }
  
  if (debug) {
    console.log(`[EXTRACT] Processing ${lineItems.length} line items:`);
    lineItems.forEach((item, index) => {
      console.log(`[EXTRACT] Item ${index}:`, {
        Description: item?.Description?.substring(0, 100) + (item?.Description?.length > 100 ? '...' : ''),
        HasAmount: !!(item?.LineAmount || item?.UnitAmount),
        Length: item?.Description?.length || 0
      });
    });
  }

  // Work-related keywords that indicate actual work descriptions
  const workKeywords = [
    'install', 'replace', 'remove', 'repair', 'fix', 'test', 'commission',
    'arrived', 'went through', 'access', 'wiring', 'electrical', 'power',
    'connect', 'disconnect', 'mount', 'secure', 'check', 'inspect',
    'troubleshoot', 'diagnose', 'complete', 'finish', 'service', 'maintenance'
  ];

  // Generic keywords to skip (addresses, thank you messages, etc.)
  const skipKeywords = [
    'thank you', 'opportunity', 'contact', 'office', 'concerns',
    'drive', 'road', 'street', 'avenue', 'auckland', 'wellington',
    'christchurch', 'hamilton', 'tauranga', 'charge', 'van charge',
    'misc', 'screws', 'wipes', 'tape', 'ties', 'silicon'
  ];

  let bestDescription = "";
  let bestScore = -1;
  let selectedIndex = -1;

  lineItems.forEach((item, index) => {
    if (!item || typeof item.Description !== "string") return;
    
    const description = item.Description.trim();
    if (description.length < 15) return; // Skip very short descriptions
    
    const lowerDesc = description.toLowerCase();
    
    // Skip if it's a generic item (has amount and contains skip keywords)
    const hasAmount = !!(item.LineAmount || item.UnitAmount);
    const hasSkipKeyword = skipKeywords.some(keyword => lowerDesc.includes(keyword));
    
    if (hasAmount && hasSkipKeyword && description.length < 50) {
      if (debug) console.log(`[EXTRACT] Skipping item ${index}: Generic charged item`);
      return;
    }
    
    // Skip pure address descriptions (no work verbs)
    const hasWorkKeyword = workKeywords.some(keyword => lowerDesc.includes(keyword));
    const looksLikeAddress = lowerDesc.includes('drive') || lowerDesc.includes('road') || 
                            lowerDesc.includes('street') || lowerDesc.includes('avenue');
    
    if (looksLikeAddress && !hasWorkKeyword) {
      if (debug) console.log(`[EXTRACT] Skipping item ${index}: Address only`);
      return;
    }
    
    // Calculate score based on work content and length
    let score = 0;
    
    // Bonus for work-related keywords
    const workMatches = workKeywords.filter(keyword => lowerDesc.includes(keyword)).length;
    score += workMatches * 10;
    
    // Bonus for length (longer descriptions are usually more detailed work descriptions)
    score += Math.min(description.length / 10, 25);
    
    // Penalty for having monetary amounts (unless it's clearly work-related)
    if (hasAmount && !hasWorkKeyword) {
      score -= 10;
    }
    
    // Bonus for technical terms
    const technicalTerms = [
      'cooktop', 'oven', 'wiring', 'electrical', 'circuit', 'switch', 'outlet',
      'heat pump', 'air con', 'switchboard', 'panel', 'mcb', 'rcbo', 'smart vent'
    ];
    const techMatches = technicalTerms.filter(term => lowerDesc.includes(term)).length;
    score += techMatches * 8;
    
    if (debug) {
      console.log(`[EXTRACT] Item ${index} score: ${score} (work: ${workMatches}, tech: ${techMatches}, length: ${description.length})`);
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestDescription = description;
      selectedIndex = index;
    }
  });

  if (debug) {
    console.log(`[EXTRACT] Selected item ${selectedIndex} with score ${bestScore}`);
    console.log(`[EXTRACT] Selected description: "${bestDescription.substring(0, 200)}${bestDescription.length > 200 ? '...' : ''}"`);
  }

  // Fallback: if no good work description found, use the longest non-generic description
  if (!bestDescription || bestScore < 5) {
    let longestDesc = "";
    lineItems.forEach((item, index) => {
      if (!item || typeof item.Description !== "string") return;
      const desc = item.Description.trim();
      const lowerDesc = desc.toLowerCase();
      const hasSkipKeyword = skipKeywords.some(keyword => lowerDesc.includes(keyword));
      
      if (!hasSkipKeyword && desc.length > longestDesc.length && desc.length > 20) {
        longestDesc = desc;
        selectedIndex = index;
      }
    });
    
    if (debug && longestDesc) {
      console.log(`[EXTRACT] Fallback: Using longest non-generic description from item ${selectedIndex}`);
    }
    
    return longestDesc;
  }
  
  return bestDescription;
};

serve(async (req) => {
  const progress = [];
  const startTime = Date.now();
  const TIMEOUT_THRESHOLD = 25000; // 25 seconds safety margin
  
  try {
    progress.push("[INIT] Starting enhanced work description extraction function");
    
    if (req.method === "OPTIONS") {
      progress.push("[CORS] Preflight");
      console.log(progress.join("\n"));
      return new Response("ok", { headers: corsHeaders });
    }

    // Supabase client
    progress.push("[CONFIG] Creating Supabase client");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"), 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Get configuration from body
    let batchSize = 200;
    let maxProcessing = 1000;
    let skipCompleted = false; // Changed to false to process more invoices
    let debugMode = false;
    
    try {
      const body = await req.json();
      if (typeof body.batchSize === "number" && body.batchSize > 0 && body.batchSize <= 500) {
        batchSize = body.batchSize;
      }
      if (typeof body.maxProcessing === "number" && body.maxProcessing > 0) {
        maxProcessing = body.maxProcessing;
      }
      if (typeof body.skipCompleted === "boolean") {
        skipCompleted = body.skipCompleted;
      }
      if (typeof body.debugMode === "boolean") {
        debugMode = body.debugMode;
      }
    } catch (err) {
      progress.push(`[CONFIG] Using defaults due to body parse error: ${err.message}`);
    }

    progress.push(`[CONFIG] batchSize=${batchSize}, maxProcessing=${maxProcessing}, skipCompleted=${skipCompleted}, debugMode=${debugMode}`);

    // Build query conditions - find invoices that need work descriptions
    let query = supabase
      .from("invoices")
      .select("id, line_items, invoice_type, work_description", { count: "exact" })
      .eq("invoice_type", "ACCREC")
      .not("line_items", "is", null);

    if (skipCompleted) {
      query = query.or("work_description.is.null,work_description.eq.");
    } else {
      // Process invoices with empty or very short work descriptions
      query = query.or("work_description.is.null,work_description.eq.,work_description.lt.20");
    }

    // Get total count of invoices to process
    const countRes = await query.range(0, 0);
    if (countRes.error) {
      throw new Error(`Count query failed: ${countRes.error.message}`);
    }
    
    const totalCount = countRes.count ?? 0;
    progress.push(`[INIT] ${totalCount} invoices to process`);

    if (totalCount === 0) {
      progress.push("[COMPLETE] No invoices need processing");
      console.log(progress.join("\n"));
      return new Response(JSON.stringify({
        success: true,
        progress,
        totalProcessed: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        remainingCount: 0,
        isComplete: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let offset = 0;
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let debugSamples = [];
    const actualLimit = Math.min(totalCount, maxProcessing);

    progress.push(`[START] Processing up to ${actualLimit} invoices in batches of ${batchSize}`);

    // Process in smaller batches
    while (totalProcessed < actualLimit && offset < totalCount) {
      // Check timeout
      if (Date.now() - startTime > TIMEOUT_THRESHOLD) {
        progress.push(`[TIMEOUT] Stopping due to time limit (${TIMEOUT_THRESHOLD}ms)`);
        break;
      }

      const currentBatchSize = Math.min(batchSize, actualLimit - totalProcessed);
      progress.push(`[BATCH] Fetching invoices ${offset} to ${offset + currentBatchSize - 1}`);

      // Fetch batch
      const fetchQuery = supabase
        .from("invoices")
        .select("id, line_items, invoice_type, work_description")
        .eq("invoice_type", "ACCREC")
        .not("line_items", "is", null);

      if (skipCompleted) {
        fetchQuery.or("work_description.is.null,work_description.eq.");
      } else {
        fetchQuery.or("work_description.is.null,work_description.eq.,work_description.lt.20");
      }

      const fetchRes = await fetchQuery
        .range(offset, offset + currentBatchSize - 1)
        .order("id");

      if (fetchRes.error) {
        progress.push(`❌ [FETCH] Error: ${fetchRes.error.message}`);
        break;
      }

      const invoices = fetchRes.data ?? [];
      if (invoices.length === 0) {
        progress.push("[FETCH] No more rows to process");
        break;
      }

      progress.push(`[FETCH] Processing ${invoices.length} invoices`);

      // Process each invoice in the batch
      for (const inv of invoices) {
        // Check timeout again
        if (Date.now() - startTime > TIMEOUT_THRESHOLD) {
          progress.push(`[TIMEOUT] Stopping mid-batch due to time limit`);
          break;
        }

        totalProcessed++;

        // Skip if already has work description (double-check)
        if (skipCompleted && inv.work_description && inv.work_description.trim().length > 20) {
          totalSkipped++;
          continue;
        }

        // Parse line items
        let items = inv.line_items;
        if (typeof items === "string") {
          try {
            items = JSON.parse(items);
          } catch (parseErr) {
            progress.push(`[INV-${inv.id}] ⚠️ JSON parse error, skipping`);
            totalSkipped++;
            continue;
          }
        }

        if (!Array.isArray(items) || items.length === 0) {
          progress.push(`[INV-${inv.id}] ⚠️ No line items, skipping`);
          totalSkipped++;
          continue;
        }

        // Extract work description using enhanced logic
        const workDescription = extractWorkDescription(items, debugMode && debugSamples.length < 3);
        
        // Store debug sample for the first few invoices
        if (debugMode && debugSamples.length < 3) {
          debugSamples.push({
            invoiceId: inv.id,
            lineItemCount: items.length,
            extractedDescription: workDescription.substring(0, 100) + (workDescription.length > 100 ? '...' : ''),
            originalItems: items.slice(0, 3).map(item => ({
              Description: item?.Description?.substring(0, 50) + (item?.Description?.length > 50 ? '...' : ''),
              HasAmount: !!(item?.LineAmount || item?.UnitAmount)
            }))
          });
        }

        // Only update if we found a meaningful description
        if (workDescription && workDescription.trim().length > 10) {
          const updateRes = await supabase
            .from("invoices")
            .update({ work_description: workDescription.trim() })
            .eq("id", inv.id);

          if (updateRes.error) {
            progress.push(`[INV-${inv.id}] ❌ Update failed: ${updateRes.error.message}`);
            totalSkipped++;
          } else {
            totalUpdated++;
            if (totalProcessed % 25 === 0) {
              progress.push(`[PROGRESS] ${totalProcessed} processed, ${totalUpdated} updated`);
            }
          }
        } else {
          totalSkipped++;
        }
      }

      offset += currentBatchSize;

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const remainingCount = Math.max(0, totalCount - totalProcessed);
    const isComplete = remainingCount === 0;

    progress.push(`🎉 [COMPLETE] Processed=${totalProcessed}, Updated=${totalUpdated}, Skipped=${totalSkipped}, Remaining=${remainingCount}`);

    // Add debug samples to progress if in debug mode
    if (debugMode && debugSamples.length > 0) {
      progress.push(`🔍 [DEBUG] Sample extractions:`);
      debugSamples.forEach((sample, index) => {
        progress.push(`  Sample ${index + 1} (Invoice ${sample.invoiceId}): "${sample.extractedDescription}"`);
      });
    }

    console.log(progress.join("\n"));

    return new Response(JSON.stringify({
      success: true,
      progress,
      totalProcessed,
      totalUpdated,
      totalSkipped,
      remainingCount,
      isComplete,
      debugSamples: debugMode ? debugSamples : undefined,
      executionTime: Date.now() - startTime
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    progress.push(`❌ [FATAL] ${err.message}`);
    console.log(progress.join("\n"));
    
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      progress,
      executionTime: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
