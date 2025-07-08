
import { supabase } from '@/integrations/supabase/client';
import type { Customer, Invoice, LineItem } from '@/types/crm';

// Fetch ALL customers from Supabase with pagination
export const fetchCustomers = async (): Promise<Customer[]> => {
  console.log('🔄 Fetching ALL customers from Supabase with pagination...');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  let allCustomers: any[] = [];
  let start = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    console.log(`📦 Fetching customers batch: ${start} to ${start + batchSize - 1}`);
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name')
      .range(start, start + batchSize - 1);

    if (error) {
      console.error('❌ Error fetching customers batch:', error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    if (data && data.length > 0) {
      allCustomers = [...allCustomers, ...data];
      console.log(`✅ Fetched batch of ${data.length} customers (total so far: ${allCustomers.length})`);
      
      // If we got less than the batch size, we've reached the end
      if (data.length < batchSize) {
        hasMore = false;
      } else {
        start += batchSize;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Fetched ALL ${allCustomers.length} customers from Supabase`);
  
  // Type cast to Customer[] - ensuring arrays are properly handled
  return allCustomers.map(customer => ({
    ...customer,
    phone_numbers: Array.isArray(customer.phone_numbers) ? customer.phone_numbers : [],
    addresses: Array.isArray(customer.addresses) ? customer.addresses : [],
    contact_groups: Array.isArray(customer.contact_groups) ? customer.contact_groups : [],
    contact_persons: Array.isArray(customer.contact_persons) ? customer.contact_persons : [],
    sales_tracking_categories: Array.isArray(customer.sales_tracking_categories) ? customer.sales_tracking_categories : [],
    purchases_tracking_categories: Array.isArray(customer.purchases_tracking_categories) ? customer.purchases_tracking_categories : []
  })) as Customer[];
};

// Fetch ALL invoices from Supabase with pagination
export const fetchInvoices = async (): Promise<Invoice[]> => {
  console.log('🔄 Fetching ALL invoices from Supabase with pagination...');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  let allInvoices: any[] = [];
  let start = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    console.log(`📦 Fetching invoices batch: ${start} to ${start + batchSize - 1}`);
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        xero_invoice_id,
        xero_contact_id,
        invoice_number,
        invoice_type,
        invoice_status,
        line_amount_types,
        invoice_date,
        due_date,
        expected_payment_date,
        planned_payment_date,
        fully_paid_on_date,
        sub_total,
        total_tax,
        total,
        total_discount,
        amount_due,
        amount_paid,
        amount_credited,
        work_description,
        service_keywords,
        created_at,
        updated_at
      `)
      .order('invoice_date', { ascending: false })
      .range(start, start + batchSize - 1);

    if (error) {
      console.error('❌ Error fetching invoices batch:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    if (data && data.length > 0) {
      allInvoices = [...allInvoices, ...data];
      console.log(`✅ Fetched batch of ${data.length} invoices (total so far: ${allInvoices.length})`);
      
      // If we got less than the batch size, we've reached the end
      if (data.length < batchSize) {
        hasMore = false;
      } else {
        start += batchSize;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Fetched ALL ${allInvoices.length} invoices from Supabase`);
  
  // Ensure service_keywords is properly handled as an array
  return allInvoices.map(invoice => ({
    ...invoice,
    service_keywords: Array.isArray(invoice.service_keywords) ? invoice.service_keywords : []
  })) as Invoice[];
};

// New function to fetch line items for a specific invoice
export const fetchInvoiceLineItems = async (invoiceId: string): Promise<LineItem[]> => {
  console.log(`🔄 Fetching line items for invoice ${invoiceId}...`);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('invoices')
    .select('line_items')
    .eq('id', invoiceId)
    .single();

  if (error) {
    console.error('❌ Error fetching invoice line items:', error);
    throw new Error(`Failed to fetch invoice line items: ${error.message}`);
  }

  const lineItems = (data?.line_items as LineItem[]) || [];
  console.log(`✅ Fetched ${lineItems.length} line items for invoice ${invoiceId}`);
  return lineItems;
};

// Search invoices using work_description field and AI as fallback
export const searchInvoicesSemanticAI = async (searchTerm: string, invoices: Invoice[]): Promise<Invoice[]> => {
  if (!searchTerm.trim()) return invoices;

  console.log(`🔍 Searching for: "${searchTerm}"`);

  // First, try simple text search on work_description
  const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 2);
  const filteredInvoices = invoices.filter(invoice => {
    const searchableText = [
      invoice.invoice_number,
      invoice.work_description,
      invoice.invoice_status
    ].join(' ').toLowerCase();
    
    return searchWords.some(word => searchableText.includes(word));
  });

  console.log(`🎯 Text search found ${filteredInvoices.length} relevant invoices`);

  // If we have good results from text search, return them
  if (filteredInvoices.length > 0) {
    return filteredInvoices;
  }

  // Fallback to AI search if no text results
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const invoicesForAI = invoices.map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      work_description: invoice.work_description
    }));

    const { data, error } = await supabase.functions.invoke('ai-operations', {
      body: {
        action: 'searchInvoices',
        searchTerm,
        invoices: invoicesForAI
      }
    });

    if (error) {
      throw new Error(`AI search failed: ${error.message}`);
    }
    
    const relevantIds = data?.invoiceIds || [];
    const relevantInvoices = invoices.filter(invoice => relevantIds.includes(invoice.id));
    console.log(`🤖 AI found ${relevantInvoices.length} relevant invoices`);
    
    return relevantInvoices;
  } catch (error) {
    console.error('❌ AI search failed:', error);
    return filteredInvoices; // Return text search results even if empty
  }
};
