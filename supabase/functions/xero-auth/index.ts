import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Safe date parsing
const parseXeroDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Failed to parse date:', dateStr, error);
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const requestBody = await req.json();
    const { accessToken, tenantId, startDate } = requestBody;

    if (!accessToken || !tenantId) {
      throw new Error('Missing access token or tenant ID');
    }

    const results = {
      customers: [],
      invoices: [],
      errors: [],
      progress: [],
      hasMore: false,
      nextStartPage: 1
    };

    // Progress callback
    const addProgress = (message: string) => {
      results.progress.push(message);
      console.log(`[PROGRESS] ${message}`);
    };

    const xeroHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Xero-tenant-id': tenantId,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // === Phase 1: Import Customers ===
    addProgress("\ud83d\udce1 PHASE 1: Starting customer import...");
    let customersPage = 1;
    while (true) {
      addProgress(`\ud83d\udcc4 Fetching customers page ${customersPage}...`);
      const contactsResponse = await fetch(`https://api.xero.com/api.xro/2.0/Contacts?page=${customersPage}`, {
        headers: xeroHeaders
      });
      if (!contactsResponse.ok) {
        if (contactsResponse.status === 429) {
          addProgress(`\u23f3 Rate limited, waiting 3 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }
        const errorText = await contactsResponse.text();
        addProgress(`\u274c Customer API error page ${customersPage}: ${contactsResponse.status} - ${errorText}`);
        break;
      }
      const contactsData = await contactsResponse.json();
      const pageContacts = contactsData.Contacts || [];
      if (pageContacts.length === 0) break;

      const customerUpserts = [];
      for (const contact of pageContacts) {
        if (!contact.Name || !contact.ContactID) continue;
        customerUpserts.push({
          xero_contact_id: contact.ContactID,
          name: contact.Name,
          email_address: contact.EmailAddress || null,
          phone_numbers: contact.Phones || [],
          addresses: contact.Addresses || [],
          contact_status: contact.ContactStatus || 'ACTIVE',
          is_supplier: contact.IsSupplier || false,
          is_customer: contact.IsCustomer !== false,
          contact_groups: contact.ContactGroups || [],
          website: contact.Website || null,
          bank_account_details: contact.BankAccountDetails || null,
          tax_number: contact.TaxNumber || null,
          accounts_receivable_tax_type: contact.AccountsReceivableTaxType || null,
          accounts_payable_tax_type: contact.AccountsPayableTaxType || null,
          contact_persons: contact.ContactPersons || [],
          has_attachments: contact.HasAttachments || false,
          xero_network_key: contact.XeroNetworkKey || null,
          sales_default_account_code: contact.SalesDefaultAccountCode || null,
          purchases_default_account_code: contact.PurchasesDefaultAccountCode || null,
          sales_tracking_categories: contact.SalesTrackingCategories || [],
          purchases_tracking_categories: contact.PurchasesTrackingCategories || [],
          contact_id: contact.ContactID,
          contact_number: contact.ContactNumber || null,
          account_number: contact.AccountNumber || null,
          legal_name: contact.LegalName || null,
          company_number: contact.CompanyNumber || null
        });
      }
      if (customerUpserts.length > 0) {
        const { data, error } = await supabaseClient.from('customers').upsert(customerUpserts, {
          onConflict: 'xero_contact_id',
          ignoreDuplicates: false
        }).select('id, xero_contact_id, name');
        if (error) {
          addProgress(`\u274c Customer batch failed: ${error.message}`);
          results.errors.push(`Customer batch error: ${error.message}`);
        } else {
          results.customers = results.customers.concat(data || []);
        }
      }
      customersPage++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    addProgress("\ud83c\udfaf Customer import complete.");

    // === Phase 2: Import Invoices with Date Window Pagination ===
    addProgress("\ud83d\udccb PHASE 2: Starting invoice import (windowed pagination)...");
    // Get all customer IDs
    const { data: allCustomers } = await supabaseClient.from('customers').select('xero_contact_id');
    const customerIds = (allCustomers ?? []).map((c: any) => c.xero_contact_id);

    let dateWindow = startDate || null; // Start from this date, or null for all time
    let continuePaging = true;
    let page = 1;
    let lastInvoiceDate: string | null = null;
    let invoicesFetched = 0;
    const PAGE_SIZE = 100; // Xero's page size
    while (continuePaging) {
      let pageCount = 0;
      do {
        let whereClause = '';
        if (dateWindow) {
          whereClause = `&where=Date<Datetime(${encodeURIComponent(dateWindow)})`;
        }
        const url = `https://api.xero.com/api.xro/2.0/Invoices?page=${page}${whereClause}&order=Date DESC`;
        addProgress(`\ud83d\udcc4 Fetching invoices page ${page} (window: < ${dateWindow || "none"}) ...`);
        const invoicesResponse = await fetch(url, { headers: xeroHeaders });
        if (!invoicesResponse.ok) {
          if (invoicesResponse.status === 429) {
            addProgress(`\u23f3 Rate limited, waiting 3 seconds...`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          }
          const errorText = await invoicesResponse.text();
          addProgress(`\u274c Invoice API error page ${page}: ${invoicesResponse.status} - ${errorText}`);
          break;
        }
        const invoicesData = await invoicesResponse.json();
        const pageInvoices = invoicesData.Invoices || [];
        if (pageInvoices.length === 0) {
          continuePaging = false;
          break;
        }
        // Only keep invoices for our customers
        const relevantInvoices = pageInvoices.filter((inv: any) => inv.Contact?.ContactID && customerIds.includes(inv.Contact.ContactID));
        if (relevantInvoices.length > 0) {
          const invoiceUpserts = [];
          for (const invoice of relevantInvoices) {
            if (!invoice.InvoiceID) continue;
            const lineItems = invoice.LineItems || [];
            invoiceUpserts.push({
              xero_invoice_id: invoice.InvoiceID,
              xero_contact_id: invoice.Contact?.ContactID || null,
              invoice_number: invoice.InvoiceNumber || null,
              invoice_type: invoice.Type || 'ACCREC',
              invoice_status: invoice.Status || 'DRAFT',
              line_amount_types: invoice.LineAmountTypes || 'Exclusive',
              invoice_date: parseXeroDate(invoice.Date),
              due_date: parseXeroDate(invoice.DueDate),
              expected_payment_date: parseXeroDate(invoice.ExpectedPaymentDate),
              planned_payment_date: parseXeroDate(invoice.PlannedPaymentDate),
              sub_total: parseFloat(invoice.SubTotal) || 0,
              total_tax: parseFloat(invoice.TotalTax) || 0,
              total: parseFloat(invoice.Total) || 0,
              total_discount: parseFloat(invoice.TotalDiscount) || 0,
              fully_paid_on_date: parseXeroDate(invoice.FullyPaidOnDate),
              amount_due: parseFloat(invoice.AmountDue) || 0,
              amount_paid: parseFloat(invoice.AmountPaid) || 0,
              amount_credited: parseFloat(invoice.AmountCredited) || 0,
              work_description: null,
              line_items: lineItems
            });
          }
          const { data, error } = await supabaseClient.from('invoices').upsert(invoiceUpserts, {
            onConflict: 'xero_invoice_id',
            ignoreDuplicates: false
          }).select('id, xero_invoice_id, invoice_number, total');
          if (error) {
            addProgress(`\u274c Invoice batch failed: ${error.message}`);
            results.errors.push(`Invoice batch error: ${error.message}`);
          } else {
            results.invoices = results.invoices.concat(data || []);
            invoicesFetched += (data?.length || 0);
          }
        }
        // Prepare for next page/window
        lastInvoiceDate = relevantInvoices.length > 0
          ? relevantInvoices[relevantInvoices.length - 1].Date
          : lastInvoiceDate;
        page++;
        pageCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limiting
      } while (pageCount < 20 && continuePaging); // Xero: max 20 pages per window
      // If we hit max page count, move window back in time
      if (pageCount === 20 && lastInvoiceDate) {
        dateWindow = lastInvoiceDate;
        page = 1;
        addProgress(`\u23ae\ufe0f Moving window back to invoices before ${dateWindow}`);
      } else {
        continuePaging = false;
      }
    }
    addProgress(`\ud83c\udf89 Invoice import complete. Total invoices fetched: ${invoicesFetched}`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse = {
      error: error.message,
      customers: [],
      invoices: [],
      errors: [error.message],
      progress: [`\u274c Fatal error: ${error.message}`],
      hasMore: false,
      nextStartPage: 1
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 