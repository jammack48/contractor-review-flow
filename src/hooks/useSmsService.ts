
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SendSmsResult {
  success: boolean;
  recipient: string;
  message?: string;
  error?: string;
}

interface SendSmsResponse {
  success: boolean;
  totalSent: number;
  successful: number;
  failed: number;
  results: SendSmsResult[];
}

// Helper function to extract phone number from phone array
export const extractPhoneNumber = (phoneData: any): string => {
  if (!phoneData) return '';
  
  if (typeof phoneData === 'string') return phoneData;
  
  if (Array.isArray(phoneData)) {
    for (const phone of phoneData) {
      if (phone && typeof phone === 'object' && 
          phone.PhoneType === 'MOBILE' && 
          phone.PhoneNumber && 
          phone.PhoneNumber.trim() !== '') {
        return phone.PhoneNumber.trim();
      }
    }
    
    for (const phone of phoneData) {
      if (phone && typeof phone === 'object' && 
          phone.PhoneNumber && 
          phone.PhoneNumber.trim() !== '') {
        return phone.PhoneNumber.trim();
      }
    }
  }
  
  if (typeof phoneData === 'object') {
    return phoneData.PhoneNumber || phoneData.phoneNumber || '';
  }
  
  return '';
};

export const useSmsService = () => {
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendSmsResponse | null>(null);

  const sendBulkSms = async (
    message: string, 
    recipients: { phone: string; name: string; invoiceId: string }[]
  ) => {
    setIsSending(true);
    setSendResults(null);
    
    try {
      const phoneNumbers = recipients.map(r => r.phone);
      const customerNames = recipients.map(r => r.name);
      const invoiceIds = recipients.map(r => r.invoiceId);
      
      console.log('SMS Service: Sending bulk SMS to recipients:', phoneNumbers);
      
      const { data, error } = await supabase.functions.invoke('sms-send', {
        body: {
          message,
          recipients: phoneNumbers,
          invoiceIds,
          customerNames
        }
      });
      
      if (error) {
        console.error('SMS Service Error:', error);
        throw new Error(error.message || 'Failed to send SMS');
      }

      console.log('SMS Service Response:', data);
      setSendResults(data);
      
      if (data.successful > 0) {
        toast({
          title: "SMS Sent",
          description: `Successfully sent ${data.successful} of ${data.totalSent} messages`,
        });
      }
      
      if (data.failed > 0) {
        toast({
          title: "Partial Success",
          description: `${data.failed} messages failed to send. Check results for details.`,
          variant: "destructive",
        });
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS';
      console.error('SMS Service Hook Error:', err);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    sendResults,
    sendBulkSms,
    setSendResults
  };
};
