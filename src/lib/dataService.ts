
import type { Customer, Invoice, BankTransaction } from '@/types/crm';
import { isDemoMode } from './demoConfig';
import { demoCustomers, demoInvoices } from './demoData';
import { fetchCustomers as fetchSupabaseCustomers, fetchInvoices as fetchSupabaseInvoices } from './supabaseService';
import { supabase } from '@/integrations/supabase/client';

// Demo service functions that return promises to match Supabase API
const fetchDemoCustomers = async (): Promise<Customer[]> => {
  console.log('🎭 [DEMO-MODE] Fetching demo customers...');
  // Simulate network delay for realistic experience
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log(`🎭 [DEMO-MODE] Loaded ${demoCustomers.length} demo customers`);
  return demoCustomers;
};

const fetchDemoInvoices = async (): Promise<Invoice[]> => {
  console.log('🎭 [DEMO-MODE] Fetching demo invoices...');
  // Simulate network delay for realistic experience
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`🎭 [DEMO-MODE] Loaded ${demoInvoices.length} demo invoices`);
  return demoInvoices;
};

const fetchDemoBankTransactions = async (): Promise<BankTransaction[]> => {
  console.log('🎭 [DEMO-MODE] Fetching demo bank transactions...');
  // Return empty array for demo mode for now
  return [];
};

// Main service functions that switch between demo and live data
export const fetchCustomers = async (): Promise<Customer[]> => {
  const isDemo = isDemoMode();
  console.log(`🔄 [DATA-SERVICE] Fetching customers - Demo mode: ${isDemo}`);
  
  if (isDemo) {
    return fetchDemoCustomers();
  } else {
    return fetchSupabaseCustomers();
  }
};

export const fetchInvoices = async (): Promise<Invoice[]> => {
  const isDemo = isDemoMode();
  console.log(`🔄 [DATA-SERVICE] Fetching invoices - Demo mode: ${isDemo}`);
  
  if (isDemo) {
    return fetchDemoInvoices();
  } else {
    return fetchSupabaseInvoices();
  }
};

export const fetchBankTransactions = async (): Promise<BankTransaction[]> => {
  const isDemo = isDemoMode();
  console.log(`🔄 [DATA-SERVICE] Fetching bank transactions - Demo mode: ${isDemo}`);
  
  if (isDemo) {
    return fetchDemoBankTransactions();
  } else {
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('❌ [DATA-SERVICE] Error fetching bank transactions:', error);
      throw error;
    }

    console.log(`✅ [DATA-SERVICE] Loaded ${data?.length || 0} bank transactions`);
    return data || [];
  }
};

// Export demo mode utilities
export { isDemoMode, setDemoMode } from './demoConfig';
