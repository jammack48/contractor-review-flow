import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};
serve(async (req)=>{
  console.log('🔄 [XERO-TOKEN-REFRESH] Function started');
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Get the user from the auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }
    console.log('🔑 [XERO-TOKEN-REFRESH] Checking environment variables...');
    const XERO_CLIENT_ID = Deno.env.get('XERO_CLIENT_ID');
    const XERO_CLIENT_SECRET = Deno.env.get('XERO_CLIENT_SECRET');
    if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
      throw new Error('Missing Xero configuration');
    }
    // Get existing connection for this user
    const { data: connection, error: connectionError } = await supabaseClient.from('xero_connections').select('*').eq('user_id', user.id).single();
    if (connectionError || !connection) {
      throw new Error('No Xero connection found for user');
    }
    console.log('🔄 [XERO-TOKEN-REFRESH] Refreshing token...');
    // Refresh the token
    const refreshResponse = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token
      })
    });
    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json();
      throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
    }
    const tokenData = await refreshResponse.json();
    // Update the connection with new tokens
    const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const newRefreshExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
    ;
    const { error: updateError } = await supabaseClient.from('xero_connections').update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: newExpiresAt.toISOString(),
      refresh_expires_at: newRefreshExpiresAt.toISOString(),
      updated_at: new Date().toISOString()
    }).eq('user_id', user.id);
    if (updateError) {
      throw new Error(`Failed to update connection: ${updateError.message}`);
    }
    console.log('✅ [XERO-TOKEN-REFRESH] Token refreshed successfully');
    return new Response(JSON.stringify({
      success: true,
      accessToken: tokenData.access_token,
      expiresAt: newExpiresAt.toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('❌ [XERO-TOKEN-REFRESH] Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 