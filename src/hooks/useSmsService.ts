
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

// Improved helper function to safely extract phone number from phone array
export const extractPhoneNumber = (phoneData: any): string => {
  if (!phoneData) return '';
  
  // If it's already a string, return it
  if (typeof phoneData === 'string') return phoneData;
  
  // If it's an array of phone objects
  if (Array.isArray(phoneData)) {
    // First, try to find a mobile number with a non-empty PhoneNumber
    for (const phone of phoneData) {
      if (phone && typeof phone === 'object' && 
          phone.PhoneType === 'MOBILE' && 
          phone.PhoneNumber && 
          phone.PhoneNumber.trim() !== '') {
        return phone.PhoneNumber.trim();
      }
    }
    
    // If no mobile found, look for any non-empty phone number
    for (const phone of phoneData) {
      if (phone && typeof phone === 'object' && 
          phone.PhoneNumber && 
          phone.PhoneNumber.trim() !== '') {
        return phone.PhoneNumber.trim();
      }
    }
  }
  
  // If it's a single object, try to extract the phone number
  if (typeof phoneData === 'object') {
    return phoneData.PhoneNumber || phoneData.phoneNumber || '';
  }
  
  return '';
};

export const useSmsService = () => {
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendSmsResponse | null>(null);

  const sendSms = async (
    message: string, 
    recipients: string[], 
    invoiceIds: string[] = [], 
    customerNames: string[] = []
  ) => {
    setIsSending(true);
    setSendResults(null);
    
    try {
      console.log('SMS Service: Sending SMS to recipients:', recipients);
      
      const { data, error } = await supabase.functions.invoke('sms-send', {
        body: {
          message,
          recipients,
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

  const sendTestSms = async (message: string, phoneNumber: string) => {
    return sendSms(message, [phoneNumber]);
  };

  const sendBulkSms = async (
    message: string, 
    recipients: { phone: string; name: string; invoiceId: string }[]
  ) => {
    const phoneNumbers = recipients.map(r => r.phone);
    const customerNames = recipients.map(r => r.name);
    const invoiceIds = recipients.map(r => r.invoiceId);
    
    return sendSms(message, phoneNumbers, invoiceIds, customerNames);
  };

  return {
    isSending,
    sendResults,
    sendTestSms,
    sendBulkSms,
    setSendResults
  };
};
