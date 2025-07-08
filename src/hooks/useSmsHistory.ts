
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SmsLog {
  id: string;
  user_id: string;
  invoice_id: string | null;
  customer_name: string;
  phone_number: string;
  message_content: string;
  campaign_id: string | null;
  sent_at: string;
  delivery_status: 'pending' | 'delivered' | 'failed' | 'unknown';
  delivery_timestamp: string | null;
  delivery_status_id: number | null;
  delivery_code: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const useSmsHistory = () => {
  const [recentSmsMap, setRecentSmsMap] = useState<Map<string, SmsLog>>(new Map());

  const {
    data: smsLogs = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['sms-logs'],
    queryFn: async () => {
      console.log('Fetching SMS logs...');
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('SMS History Error:', error);
        throw new Error(error.message || 'Failed to fetch SMS history');
      }

      return data as SmsLog[];
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMap = new Map<string, SmsLog>();
    
    smsLogs.forEach(log => {
      if (log.invoice_id && new Date(log.sent_at) >= sevenDaysAgo) {
        const existing = recentMap.get(log.invoice_id);
        if (!existing || new Date(log.sent_at) > new Date(existing.sent_at)) {
          recentMap.set(log.invoice_id, log);
        }
      }
    });

    setRecentSmsMap(recentMap);
  }, [smsLogs]);

  const hasRecentSms = (invoiceId: string): boolean => {
    return recentSmsMap.has(invoiceId);
  };

  const getRecentSms = (invoiceId: string): SmsLog | undefined => {
    return recentSmsMap.get(invoiceId);
  };

  const hasRecentSmsForPhone = (phoneNumber: string): boolean => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return smsLogs.some(log => 
      log.phone_number === phoneNumber && 
      new Date(log.sent_at) >= sevenDaysAgo
    );
  };

  const getDeliveryStatusColor = (status: string): string => {
    switch (status) {
      case 'delivered':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDeliveryStatusBadge = (status: string): string => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return {
    smsLogs,
    isLoading,
    error,
    refetch,
    hasRecentSms,
    getRecentSms,
    hasRecentSmsForPhone,
    getDeliveryStatusColor,
    getDeliveryStatusBadge,
    recentSmsMap
  };
};
