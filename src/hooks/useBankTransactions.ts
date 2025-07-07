
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BankTransaction } from '@/types/crm';

export const useBankTransactions = (xeroContactId: string | null) => {
  return useQuery({
    queryKey: ['bankTransactions', xeroContactId],
    queryFn: async (): Promise<BankTransaction[]> => {
      if (!xeroContactId) {
        return [];
      }

      console.log(`🏦 [BANK-TRANSACTIONS] Fetching bank transactions for contact: ${xeroContactId}`);
      
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('xero_contact_id', xeroContactId)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('❌ [BANK-TRANSACTIONS] Error fetching bank transactions:', error);
        throw error;
      }

      console.log(`✅ [BANK-TRANSACTIONS] Loaded ${data?.length || 0} bank transactions`);
      return data || [];
    },
    enabled: !!xeroContactId,
  });
};
