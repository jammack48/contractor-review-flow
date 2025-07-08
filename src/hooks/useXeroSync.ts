
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SyncState {
  hasMore: boolean;
  nextStartPage: number;
  nextInvoicePage: number;
  totalCustomers: number;
  totalInvoices: number;
}

export const useXeroSync = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    hasMore: false,
    nextStartPage: 1,
    nextInvoicePage: 1,
    totalCustomers: 0,
    totalInvoices: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const startSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      console.log('Starting Xero data sync...');
      
      const { data, error } = await supabase.functions.invoke('xero-sync', {
        body: { 
          action: 'start',
          contactsPage: 1,
          invoicesPage: 1
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to sync Xero data');
      }
      
      setSyncState({
        hasMore: data.hasMore || false,
        nextStartPage: data.nextContactsPage || 1,
        nextInvoicePage: data.nextInvoicesPage || 1,
        totalCustomers: data.totalCustomers || 0,
        totalInvoices: data.totalInvoices || 0
      });
      
      toast({
        title: "Sync Started",
        description: `Imported ${data.totalCustomers || 0} customers and ${data.totalInvoices || 0} invoices`,
      });
    } catch (error) {
      console.error('Xero sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : 'Failed to sync Xero data',
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const continueSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      console.log('Continuing Xero data sync...');
      
      const { data, error } = await supabase.functions.invoke('xero-sync', {
        body: { 
          action: 'continue',
          contactsPage: syncState.nextStartPage,
          invoicesPage: syncState.nextInvoicePage
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to continue sync');
      }
      
      setSyncState(prev => ({
        hasMore: data.hasMore || false,
        nextStartPage: data.nextContactsPage || prev.nextStartPage,
        nextInvoicePage: data.nextInvoicesPage || prev.nextInvoicePage,
        totalCustomers: (prev.totalCustomers || 0) + (data.newCustomers || 0),
        totalInvoices: (prev.totalInvoices || 0) + (data.newInvoices || 0)
      }));
      
      toast({
        title: "Sync Continued",
        description: `Added ${data.newCustomers || 0} more customers and ${data.newInvoices || 0} more invoices`,
      });
    } catch (error) {
      console.error('Xero continue sync error:', error);
      toast({
        title: "Continue Sync Failed",
        description: error instanceof Error ? error.message : 'Failed to continue sync',
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [syncState]);

  return {
    syncState,
    isSyncing,
    startSync,
    continueSync
  };
};
