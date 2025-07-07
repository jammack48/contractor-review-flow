
import { serve } from 'https://deno.land/std@0.184.0/http/server.ts';
import { encode } from 'https://deno.land/std@0.184.0/encoding/base64.ts';

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
    console.log('SMS Balance: Starting balance check...');
    
    // Load credentials from environment - using uppercase names to match Supabase secrets
    const smsUsername = Deno.env.get('SMS_USERNAME');
    const smsPassword = Deno.env.get('SMS_PASSWORD');
    const costPerText = Deno.env.get('SMS_COST_PER_TEXT') || '0.10'; // Default to 10 cents NZD

    console.log('SMS Balance: Checking credentials...', { 
      hasUsername: !!smsUsername, 
      hasPassword: !!smsPassword,
      username: smsUsername,
      passwordLength: smsPassword ? smsPassword.length : 0
    });

    if (!smsUsername || !smsPassword) {
      console.error('SMS Balance: Missing SMS credentials');
      return new Response(
        JSON.stringify({ error: 'Missing SMS credentials' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('SMS Balance: Making API call to SMS Everyone using Basic Auth...');
    console.log('SMS Balance: Using username:', smsUsername);
    console.log('SMS Balance: Password starts with:', smsPassword.substring(0, 3) + '...');

    // Build Basic Auth header
    const authToken = encode(`${smsUsername}:${smsPassword}`);
    console.log('SMS Balance: Auth token generated, making request...');

    const res = await fetch('https://smseveryone.com/api/RetrieveUserSettings', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Accept': 'application/json',
      },
    });

    console.log('SMS Balance: Response status:', res.status);
    console.log('SMS Balance: Response headers:', Object.fromEntries(res.headers.entries()));

    const settings = await res.json();
    console.log('SMS Balance: API Response:', settings);

    if (!res.ok) {
      console.error('SMS Balance: API call failed', settings);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve settings', details: settings }), 
        { 
          status: res.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if we have a valid response structure
    if (typeof settings.Credits === 'undefined') {
      console.error('SMS Balance: Invalid response structure - Credits field missing', settings);
      return new Response(
        JSON.stringify({ error: 'Invalid response from SMS provider', details: settings }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate estimated messages
    const credits = settings.Credits || 0;
    const cost = parseFloat(costPerText);
    const estimatedMessages = cost > 0 ? Math.floor(credits / cost) : 0;

    // Prepare response - map the API response to our expected format
    const responsePayload = {
      credits: credits,
      cost_per_text: cost,
      estimated_messages: estimatedMessages,
      currency: 'NZD'
    };

    console.log('SMS Balance: Success', responsePayload);

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('SMS Balance: Error occurred', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
