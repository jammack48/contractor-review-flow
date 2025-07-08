
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SmsBalance {
  credits: number;
  cost_per_text: number;
  estimated_messages: number;
  currency: string;
}

export const useSmsBalance = () => {
  const [balance, setBalance] = useState<SmsBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching SMS balance...');
      const { data, error } = await supabase.functions.invoke('sms-get-balance');
      
      if (error) {
        console.error('SMS Balance Error:', error);
        throw new Error(error.message || 'Failed to fetch SMS balance');
      }

      console.log('SMS Balance Response:', data);
      
      const validatedBalance: SmsBalance = {
        credits: Number(data.credits) || 0,
        cost_per_text: Number(data.cost_per_text) || 0,
        estimated_messages: Number(data.estimated_messages) || 0,
        currency: data.currency || 'NZD'
      };

      setBalance(validatedBalance);
      
      toast({
        title: "Balance Updated",
        description: `${validatedBalance.credits} messages available at $${validatedBalance.cost_per_text.toFixed(2)} ${validatedBalance.currency} each`,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch SMS balance';
      setError(errorMessage);
      console.error('SMS Balance Hook Error:', err);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    balance,
    isLoading,
    error,
    fetchBalance
  };
};
