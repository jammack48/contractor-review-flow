
// supabase/functions/quote-parser/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const MODEL           = "gpt-4.1-mini-2025-04-14";   // Updated to cheapest/fastest model
const CHUNK_LINES     = 30;              // Reduce chunk size for better handling
const MAX_TOKENS_OUT  = 2500;            // Reduce tokens to prevent truncation

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age":       "86400",
};

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

serve(async (req) => {
  console.log(`[QUOTE-PARSER] ${req.method} request received`);
  
  // ─── CORS PRE-FLIGHT ───────────────────────────────────────
  if (req.method === "OPTIONS") {
    console.log("[QUOTE-PARSER] Handling OPTIONS request");
    return new Response(null, { status: 204, headers: CORS });
  }

  // ─── CONFIG CHECKS ─────────────────────────────────────────
  if (!OPENAI_API_KEY) {
    console.error("[QUOTE-PARSER] Missing OPENAI_API_KEY");
    return jsonError("Missing OPENAI_API_KEY. Configure in edge function secrets", 500);
  }

  // ─── PARSE REQUEST ─────────────────────────────────────────
  let rawText: string;
  try {
    const body = await req.json();
    rawText = body.rawText;
    if (!rawText?.trim()) {
      throw new Error("Empty rawText");
    }
    console.log(`[QUOTE-PARSER] Processing ${rawText.length} characters of text`);
  } catch (error) {
    console.error("[QUOTE-PARSER] Request parsing error:", error);
    return jsonError("Request body must be JSON with a non-empty `rawText` field", 400);
  }

  // ─── SPLIT INTO CHUNKS ─────────────────────────────────────
  const chunks = chunkByLines(rawText, CHUNK_LINES);
  console.log(`[QUOTE-PARSER] Split into ${chunks.length} chunks`);
  const allItems: any[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[QUOTE-PARSER] Processing chunk ${i + 1}/${chunks.length}`);
    
    const prompt = buildPrompt(chunk);
    const aiRes  = await openAiCall(prompt);

    if (!aiRes.ok) {
      const errMsg = await aiRes.text();
      console.error(`[QUOTE-PARSER] OpenAI error ${aiRes.status}: ${errMsg}`);
      logAIError(errMsg, aiRes);
      return jsonError(`OpenAI error ${aiRes.status}: ${errMsg}`, 500);
    }

    const responseData = await aiRes.json();
    const choice = responseData.choices?.[0];

    if (!choice) {
      console.error("[QUOTE-PARSER] No choices in OpenAI response");
      return jsonError("Invalid OpenAI response format", 500);
    }

    // ─── HANDLE TRUNCATION OR FILTER ─────────────────────────
    if (choice.finish_reason !== "stop") {
      console.warn(`[QUOTE-PARSER] OpenAI stopped with finish_reason="${choice.finish_reason}"`);
      // Continue anyway but log the issue
    }

    // ─── PARSE & VALIDATE JSON ────────────────────────────────
    let parsed;
    try {
      const content = choice.message?.content || "";
      console.log(`[QUOTE-PARSER] Raw OpenAI response length: ${content.length}`);
      
      // Try to repair truncated JSON
      const repairedContent = repairTruncatedJson(content);
      parsed = JSON.parse(repairedContent);
      
      if (!Array.isArray(parsed.lineItems)) {
        throw new Error("Missing or invalid lineItems array");
      }
      
      console.log(`[QUOTE-PARSER] Successfully parsed ${parsed.lineItems.length} items from chunk ${i + 1}`);
      allItems.push(...parsed.lineItems);
      
    } catch (parseError) {
      console.error(`[QUOTE-PARSER] JSON parsing error for chunk ${i + 1}:`, parseError);
      console.error(`[QUOTE-PARSER] Content that failed to parse:`, choice.message?.content?.substring(0, 500));
      
      // Try to extract partial data instead of failing completely
      const partialItems = extractPartialItems(choice.message?.content || "");
      if (partialItems.length > 0) {
        console.log(`[QUOTE-PARSER] Extracted ${partialItems.length} partial items from chunk ${i + 1}`);
        allItems.push(...partialItems);
      } else {
        return jsonError(`JSON parsing failed for chunk ${i + 1}: ${parseError.message}`, 500);
      }
    }
  }

  // ─── FINAL CLEANUP & ID REGENERATION ───────────────────────
  const lineItems = allItems
    .map(standardise)
    .map((it, idx) => ({ ...it, id: String(idx + 1) }));

  console.log(`[QUOTE-PARSER] Successfully processed ${lineItems.length} total items`);
  console.log(`💰 [AI-USAGE] Processed ${chunks.length} chunks with ${MODEL}`);
  
  return new Response(JSON.stringify({ success: true, lineItems }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});

// ─── HELPERS ────────────────────────────────────────────────
function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function chunkByLines(text: string, linesPerChunk: number): string[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += linesPerChunk) {
    out.push(lines.slice(i, i + linesPerChunk).join("\n"));
  }
  return out;
}

function buildPrompt(chunk: string) {
  return `
Parse this quote/invoice chunk into JSON with exactly this structure (no markdown or comments):

{
  "lineItems": [
    {
      "id": "1",
      "name": "Item name",
      "type": "labour" or "material",
      "quantity": number,
      "cost": number,
      "price": number,
      "markup": number,
      "tax": 15,
      "discount": 0,
      "total": number,
      "isBigTicket": boolean,
      "maxMarkup": number or null
    }
  ]
}

Rules:
- Determine type from name (labour-related = "labour", everything else = "material")
- Compute markup = ((price - cost)/cost)*100
- isBigTicket if cost > 500 or major equipment keywords
- maxMarkup = 25 for big ticket; else null
- IDs are sequential strings (we'll reassign later)
- All numbers must be numeric, not strings
- Ensure the JSON is complete and valid

Data:
${chunk}
`;
}

async function openAiCall(prompt: string) {
  console.log("[QUOTE-PARSER] Calling OpenAI API...");
  return fetch("https://api.openai.com/v1/chat/completions", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: MAX_TOKENS_OUT,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
}

function repairTruncatedJson(content: string): string {
  // If the JSON ends abruptly, try to close it properly
  let trimmed = content.trim();
  
  if (!trimmed.endsWith('}')) {
    // Count open braces vs close braces
    const openBraces = (trimmed.match(/{/g) || []).length;
    const closeBraces = (trimmed.match(/}/g) || []).length;
    const openBrackets = (trimmed.match(/\[/g) || []).length;
    const closeBrackets = (trimmed.match(/\]/g) || []).length;
    
    // Add missing closing brackets and braces
    for (let i = 0; i < (openBrackets - closeBrackets); i++) {
      trimmed += ' ]';
    }
    for (let i = 0; i < (openBraces - closeBraces); i++) {
      trimmed += ' }';
    }
  }
  
  return trimmed;
}

function extractPartialItems(content: string): any[] {
  // Try to extract individual item objects even if the overall JSON is malformed
  const items: any[] = [];
  const itemMatches = content.match(/"id":\s*"[^"]+",[\s\S]*?"maxMarkup":\s*(?:null|\d+)/g);
  
  if (itemMatches) {
    for (const match of itemMatches) {
      try {
        const itemObj = JSON.parse(`{${match}}`);
        items.push(itemObj);
      } catch {
        // Skip malformed items
      }
    }
  }
  
  return items;
}

function standardise(item: any) {
  return {
    name:        String(item.name ?? ""),
    type:        item.type === "labour" ? "labour" : "material",
    quantity:    Number(item.quantity) || 1,
    cost:        Number(item.cost) || 0,
    price:       Number(item.price) || 0,
    markup:      Number(item.markup) || 0,
    tax:         Number(item.tax) || 15,
    discount:    Number(item.discount) || 0,
    total:       Number(item.total) || Number(item.quantity) * Number(item.price) || 0,
    isBigTicket: Boolean(item.isBigTicket),
    maxMarkup:   item.isBigTicket ? 25 : null,
  };
}
