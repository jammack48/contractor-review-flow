
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchInvoiceLineItems } from '@/lib/supabaseService';
import { isDemoMode } from '@/lib/demoConfig';
import { demoInvoices } from '@/lib/demoData';
import type { LineItem } from '@/types/crm';

export const useInvoiceLineItems = (invoiceId: string | null) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const isDemo = isDemoMode();

  // Demo function to fetch line items from local data
  const fetchDemoLineItems = async (id: string): Promise<LineItem[]> => {
    console.log(`🎭 [DEMO-MODE] Fetching line items for invoice ${id}...`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay
    
    const invoice = demoInvoices.find(inv => inv.id === id);
    const lineItems = invoice?.line_items || [];
    console.log(`🎭 [DEMO-MODE] Found ${lineItems.length} line items for invoice ${id}`);
    return lineItems;
  };

  const {
    data: lineItems = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoice-line-items', invoiceId, isDemo ? 'demo' : 'live'],
    queryFn: () => {
      if (isDemo) {
        return fetchDemoLineItems(invoiceId!);
      } else {
        return fetchInvoiceLineItems(invoiceId!);
      }
    },
    enabled: shouldFetch && !!invoiceId,
    retry: isDemo ? 0 : 2, // No retries for demo mode
    staleTime: isDemo ? Infinity : 5 * 60 * 1000, // Demo data never goes stale
  });

  const loadLineItems = () => {
    if (!shouldFetch) {
      setShouldFetch(true);
    } else {
      refetch();
    }
  };

  return {
    lineItems,
    isLoading,
    error,
    loadLineItems,
    hasLoaded: shouldFetch,
    isDemoMode: isDemo
  };
};
