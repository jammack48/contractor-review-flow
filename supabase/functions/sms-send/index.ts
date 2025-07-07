
import { serve } from 'https://deno.land/std@0.184.0/http/server.ts';
import { encode } from 'https://deno.land/std@0.184.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSmsRequest {
  message: string;
  recipients: string[];
  invoiceIds?: string[];
  customerNames?: string[];
}

interface DeliveryInfo {
  delivered: boolean;
  statusId: number;
  code: number;
  timestamp: string;
}

interface SendSmsResult {
  success: boolean;
  recipient: string;
  message?: string;
  error?: string;
  delivery?: DeliveryInfo;
}

const formatNZPhoneNumber = (phone: string): string => {
  // Remove all spaces, dashes, and brackets
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If it starts with 0, replace with +64
  if (cleaned.startsWith('0')) {
    cleaned = '+64' + cleaned.substring(1);
  }
  
  // If it doesn't start with +, assume it's NZ and add +64
  if (!cleaned.startsWith('+')) {
    cleaned = '+64' + cleaned;
  }
  
  return cleaned;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('SMS Send: Starting SMS send request...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(authHeader);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load credentials from environment
    const smsUsername = Deno.env.get('SMS_USERNAME');
    const smsPassword = Deno.env.get('SMS_PASSWORD');
    const smsOriginator = Deno.env.get('SMS_ORIGINATOR') || 'Business';

    console.log('SMS Send: Checking credentials...', { 
      hasUsername: !!smsUsername, 
      hasPassword: !!smsPassword,
      originator: smsOriginator
    });

    if (!smsUsername || !smsPassword) {
      console.error('SMS Send: Missing SMS credentials');
      return new Response(
        JSON.stringify({ error: 'Missing SMS credentials' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { message, recipients, invoiceIds = [], customerNames = [] }: SendSmsRequest = await req.json();
    
    console.log('SMS Send: Request details:', { 
      messageLength: message.length,
      recipientCount: recipients.length,
      recipients: recipients
    });

    if (!message || !recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message and recipients are required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build Basic Auth header
    const authToken = encode(`${smsUsername}:${smsPassword}`);
    
    // Send SMS to each recipient
    const results: SendSmsResult[] = [];
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const invoiceId = invoiceIds[i] || null;
      const customerName = customerNames[i] || 'Unknown Customer';

      console.log(`SMS Send: Sending to ${recipient}...`);
      
      try {
        // Format phone number for New Zealand and strip the + sign for SMS Everyone API
        const formattedPhone = formatNZPhoneNumber(recipient);
        const msisdn = formattedPhone.replace(/^\+/, ''); // Remove the + sign
        console.log(`SMS Send: Formatted phone ${recipient} -> ${formattedPhone} -> ${msisdn}`);
        
        const smsPayload = {
          Message: message,
          Originator: smsOriginator,
          Destinations: [msisdn],
          Action: 'create'
        };

        console.log('SMS Send: Payload:', smsPayload);

        // Use the correct SMS Everyone API endpoint
        const res = await fetch('https://smseveryone.com/api/campaign', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(smsPayload)
        });

        console.log(`SMS Send: Response status for ${recipient}:`, res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`SMS Send: API error for ${recipient}:`, errorText);
          
          // Log failed SMS attempt
          await supabase.from('sms_logs').insert({
            user_id: user.id,
            invoice_id: invoiceId,
            customer_name: customerName,
            phone_number: recipient,
            message_content: message,
            delivery_status: 'failed',
            error_message: `SMS API error ${res.status}: ${errorText}`
          });

          results.push({
            success: false,
            recipient: recipient,
            error: `SMS API error ${res.status}: ${errorText}`
          });
          continue;
        }

        const responseData = await res.json();
        console.log(`SMS Send: Response data for ${recipient}:`, responseData);

        if (responseData.Code === 0) {
          const campaignId = responseData.CampaignId;
          let delivery: DeliveryInfo | undefined;

          // Check delivery receipt
          try {
            const drRes = await fetch('https://smseveryone.com/api/DRStatus', {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${authToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                CampaignId: campaignId,
                Destination: msisdn,
              }),
            });

            if (!drRes.ok) {
              const errText = await drRes.text();
              console.error(`DRStatus error for ${recipient}: ${drRes.status} – ${errText}`);
            } else {
              const drData = await drRes.json();
              if (drData.Count > 0 && drData.Destinations?.length) {
                const dest = drData.Destinations[0];
                delivery = {
                  delivered: dest.Status.DeliveryReceiptStatusId === 1,
                  statusId: dest.Status.DeliveryReceiptStatusId,
                  code: dest.Status.Code,
                  timestamp: dest.TimeStamp,
                };
                console.log(`Delivery info for ${recipient}:`, delivery);
              } else {
                console.log(`No delivery receipt yet for ${recipient} (Campaign ${campaignId})`);
              }
            }
          } catch (drError) {
            console.error(`Failed to fetch DRStatus for ${recipient}:`, drError);
          }

          // Log successful SMS attempt
          const deliveryStatus = delivery?.delivered ? 'delivered' : 'pending';
          await supabase.from('sms_logs').insert({
            user_id: user.id,
            invoice_id: invoiceId,
            customer_name: customerName,
            phone_number: recipient,
            message_content: message,
            campaign_id: campaignId,
            delivery_status: deliveryStatus,
            delivery_timestamp: delivery?.timestamp ? new Date(delivery.timestamp).toISOString() : null,
            delivery_status_id: delivery?.statusId,
            delivery_code: delivery?.code
          });

          results.push({
            success: true,
            recipient: recipient,
            message: `SMS sent successfully (Campaign ID: ${campaignId})`,
            delivery
          });
        } else {
          // Log failed SMS attempt
          await supabase.from('sms_logs').insert({
            user_id: user.id,
            invoice_id: invoiceId,
            customer_name: customerName,
            phone_number: recipient,
            message_content: message,
            delivery_status: 'failed',
            error_message: responseData.Message || `API returned code ${responseData.Code}`
          });

          results.push({
            success: false,
            recipient: recipient,
            error: responseData.Message || `API returned code ${responseData.Code}`
          });
        }
      } catch (error) {
        console.error(`SMS Send: Error sending to ${recipient}:`, error);
        
        // Log failed SMS attempt
        await supabase.from('sms_logs').insert({
          user_id: user.id,
          invoice_id: invoiceId,
          customer_name: customerName,
          phone_number: recipient,
          message_content: message,
          delivery_status: 'failed',
          error_message: error.message || 'Unknown error occurred'
        });

        results.push({
          success: false,
          recipient: recipient,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('SMS Send: Completed', { 
      totalSent: recipients.length,
      successful: successCount,
      failed: failureCount
    });

    return new Response(JSON.stringify({
      success: true,
      totalSent: recipients.length,
      successful: successCount,
      failed: failureCount,
      results: results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('SMS Send: Error occurred', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
