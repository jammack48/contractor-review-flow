import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BankTransaction } from '@/types/crm';

export const useAllBankTransactions = () => {
  return useQuery({
    queryKey: ['allBankTransactions'],
    queryFn: async (): Promise<Record<string, BankTransaction[]>> => {
      console.log('🏦 [ALL-BANK-TRANSACTIONS] Fetching all bank transactions in batches...');
      const batchSize = 1000;
      let from = 0;
      let allData: BankTransaction[] = [];
      let done = false;
      let batchNum = 1;
      let totalCount = 0;

      while (!done) {
        console.log(`🔄 [ALL-BANK-TRANSACTIONS] Fetching batch #${batchNum} (rows ${from} to ${from + batchSize - 1})`);
        const { data, error, count } = await supabase
          .from('bank_transactions')
          .select('*', { count: 'exact' })
          .order('transaction_date', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) {
          console.error(`❌ [ALL-BANK-TRANSACTIONS] Error fetching batch #${batchNum}:`, error);
          throw error;
        }
        if (data) {
          allData = allData.concat(data);
          totalCount += data.length;
          console.log(`✅ [ALL-BANK-TRANSACTIONS] Batch #${batchNum}: Fetched ${data.length} transactions (Total so far: ${totalCount})`);
        }
        if (!data || data.length < batchSize) {
          done = true;
        } else {
          from += batchSize;
          batchNum++;
        }
      }

      // Group transactions by xero_contact_id
      const groupedTransactions: Record<string, BankTransaction[]> = {};
      allData.forEach(transaction => {
        if (transaction.xero_contact_id) {
          if (!groupedTransactions[transaction.xero_contact_id]) {
            groupedTransactions[transaction.xero_contact_id] = [];
          }
          groupedTransactions[transaction.xero_contact_id].push(transaction);
        }
      });

      console.log(`🏁 [ALL-BANK-TRANSACTIONS] Loaded ${allData.length} total bank transactions for ${Object.keys(groupedTransactions).length} contacts`);
      return groupedTransactions;
    },
  });
};
