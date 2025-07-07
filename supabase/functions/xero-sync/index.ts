import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Simplified Xero date parser with minimal logging
const parseXeroDate = (dateStr, context = "unknown") => {
  if (!dateStr) {
    return null;
  }

  try {
    let parsedDate = null;

    // Handle Xero's /Date(timestamp+timezone)/ format
    if (typeof dateStr === 'string' && dateStr.startsWith('/Date(') && dateStr.endsWith(')/')) {
      const timestampMatch = dateStr.match(/\/Date\((\d+)(?:[+-]\d{4})?\)\//);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1]);
        parsedDate = new Date(timestamp);
      }
    }
    // Handle ISO date strings
    else if (typeof dateStr === 'string') {
      parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime()) && dateStr.includes('T')) {
        const datePart = dateStr.split('T')[0];
        parsedDate = new Date(datePart);
      }
    }
    // Handle Date objects or timestamps
    else if (dateStr instanceof Date) {
      parsedDate = dateStr;
    }
    else if (typeof dateStr === 'number') {
      parsedDate = new Date(dateStr);
    }

    // Validate and return
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split("T")[0];
    } else {
      console.error(`❌ [XERO-DATE] Invalid date for ${context}:`, dateStr);
      return null;
    }
    
  } catch (error) {
    console.error(`💥 [XERO-DATE] Exception parsing date for ${context}:`, error.message);
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    console.log(`🚀 [XERO-SYNC] Starting chunked import process...`);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      accessToken, 
      tenantId, 
      startCustomerPage = 1, 
      startInvoicePage = 1,
      startBankTransactionPage = 1,
      maxCustomerPages = 10,
      maxInvoicePages = 10,
      maxBankTransactionPages = 10
    } = await req.json();

    const progress = [];

    if (!accessToken || !tenantId) {
      throw new Error("Missing access token or tenant ID");
    }

    const xeroHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Xero-tenant-id": tenantId,
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    // Import customers in chunks
    progress.push(`🟡 Starting customer import from page ${startCustomerPage}...`);
    
    let totalCustomers = 0;
    let customerPage = startCustomerPage;
    let hasMoreCustomers = true;
    const customerPageSize = 1000;
    
    while (hasMoreCustomers && (customerPage - startCustomerPage) < maxCustomerPages) {
      const res = await fetch(`https://api.xero.com/api.xro/2.0/Contacts?page=${customerPage}&pageSize=${customerPageSize}`, {
        headers: xeroHeaders
      });
      
      if (!res.ok) {
        console.error(`❌ [XERO-SYNC] Customer fetch failed for page ${customerPage}:`, res.status);
        break;
      }
      
      const data = await res.json();
      const contacts = data.Contacts || [];
      
      if (!contacts.length) {
        hasMoreCustomers = false;
        break;
      }

      await supabase.from("customers").upsert(
        contacts.filter((c) => c.ContactID && c.Name).map((c) => ({
          xero_contact_id: c.ContactID,
          name: c.Name,
          email_address: c.EmailAddress || null,
          phone_numbers: c.Phones || [],
          addresses: c.Addresses || [],
          contact_status: c.ContactStatus || 'ACTIVE',
          is_supplier: c.IsSupplier || false,
          is_customer: true,
          contact_groups: c.ContactGroups || [],
          website: c.Website || null,
          bank_account_details: c.BankAccountDetails || null,
          tax_number: c.TaxNumber || null,
          accounts_receivable_tax_type: c.AccountsReceivableTaxType || null,
          accounts_payable_tax_type: c.AccountsPayableTaxType || null,
          contact_persons: c.ContactPersons || [],
          xero_network_key: c.XeroNetworkKey || null,
          sales_default_account_code: c.SalesDefaultAccountCode || null,
          purchases_default_account_code: c.PurchasesDefaultAccountCode || null,
          sales_tracking_categories: c.SalesTrackingCategories || [],
          purchases_tracking_categories: c.PurchasesTrackingCategories || [],
          contact_id: c.ContactID || null,
          contact_number: c.ContactNumber || null,
          account_number: c.AccountNumber || null,
          legal_name: c.LegalName || null,
          company_number: c.CompanyNumber || null,
          has_attachments: c.HasAttachments || false,
          google_review_given: false
        })),
        {
          onConflict: "xero_contact_id"
        }
      );

      totalCustomers += contacts.length;
      customerPage++;
      
      await new Promise((r) => setTimeout(r, 50));
    }

    progress.push(`✅ Customers: ${totalCustomers} processed`);

    // Import invoices in chunks
    progress.push(`🔄 Starting invoice import from page ${startInvoicePage}...`);
    
    let totalInvoices = 0;
    let invoicePage = startInvoicePage;
    let hasMoreInvoices = true;
    let dateParsingStats = {
      successful: 0,
      failed: 0,
      nullDates: 0
    };
    const invoicePageSize = 1000;

    while (hasMoreInvoices && (invoicePage - startInvoicePage) < maxInvoicePages) {
      const res = await fetch(
        `https://api.xero.com/api.xro/2.0/Invoices?page=${invoicePage}&pageSize=${invoicePageSize}&order=Date ASC`,
        {
          headers: xeroHeaders
        }
      );
      
      if (!res.ok) {
        console.error(`❌ [XERO-SYNC] Invoice fetch failed for page ${invoicePage}:`, res.status);
        break;
      }
      
      const data = await res.json();
      const invoices = data.Invoices || [];
      
      if (!invoices.length) {
        hasMoreInvoices = false;
        break;
      }

      // Process invoices with minimal logging
      const processedInvoices = invoices.filter((inv) => inv.InvoiceID).map((inv) => {
        const parsedDate = parseXeroDate(inv.Date, `Invoice ${inv.InvoiceNumber || inv.InvoiceID}`);
        
        // Track parsing statistics
        if (inv.Date === null || inv.Date === undefined) {
          dateParsingStats.nullDates++;
        } else if (parsedDate) {
          dateParsingStats.successful++;
        } else {
          dateParsingStats.failed++;
        }

        return {
          xero_invoice_id: inv.InvoiceID,
          xero_contact_id: inv.Contact?.ContactID ?? null,
          invoice_number: inv.InvoiceNumber ?? null,
          invoice_type: inv.Type ?? null,
          invoice_status: inv.Status ?? null,
          invoice_date: parsedDate,
          total: parseFloat(inv.Total) || 0,
          line_items: inv.LineItems ?? []
        };
      });

      const { error: upsertError } = await supabase.from("invoices").upsert(processedInvoices, {
        onConflict: "xero_invoice_id"
      });

      if (upsertError) {
        console.error(`❌ [XERO-SYNC] Database upsert error:`, upsertError);
        throw new Error(`Database upsert failed: ${upsertError.message}`);
      }

      totalInvoices += invoices.length;
      invoicePage++;
      
      await new Promise((r) => setTimeout(r, 50));
    }

    progress.push(`✅ Invoices: ${totalInvoices} processed`);

    // Import bank transactions in chunks - ONLY customer/supplier transactions
    progress.push(`💰 Starting bank transaction import from page ${startBankTransactionPage}...`);
    
    let totalBankTransactions = 0;
    let bankTransactionPage = startBankTransactionPage;
    let hasMoreBankTransactions = true;
    const bankTransactionPageSize = 1000;

    // Filter to only get RECEIVE/SPEND transactions with actual contacts
    const filter = encodeURIComponent(
      '(Type=="RECEIVE" || Type=="SPEND") && Contact.ContactID!=null'
    );

    while (hasMoreBankTransactions && (bankTransactionPage - startBankTransactionPage) < maxBankTransactionPages) {
      const res = await fetch(
        `https://api.xero.com/api.xro/2.0/BankTransactions?page=${bankTransactionPage}&pageSize=${bankTransactionPageSize}&order=Date ASC&where=${filter}`,
        {
          headers: xeroHeaders
        }
      );
      
      if (!res.ok) {
        console.error(`❌ [XERO-SYNC] Bank transaction fetch failed for page ${bankTransactionPage}:`, res.status);
        break;
      }
      
      const data = await res.json();
      const bankTransactions = data.BankTransactions || [];
      
      if (!bankTransactions.length) {
        hasMoreBankTransactions = false;
        break;
      }

      // Process bank transactions
      const processedBankTransactions = bankTransactions.filter((bt) => bt.BankTransactionID).map((bt) => {
        const parsedDate = parseXeroDate(bt.Date, `BankTransaction ${bt.BankTransactionID}`);
        
        return {
          xero_bank_transaction_id: bt.BankTransactionID,
          xero_contact_id: bt.Contact?.ContactID ?? null,
          xero_bank_account_id: bt.BankAccount?.BankAccountID ?? null,
          bank_account_name: bt.BankAccount?.Name ?? null,
          bank_account_code: bt.BankAccount?.Code ?? null,
          transaction_type: bt.Type ?? null,
          status: bt.Status ?? null,
          transaction_date: parsedDate,
          total_amount: parseFloat(bt.Total) || 0,
          sub_total: parseFloat(bt.SubTotal) || 0,
          total_tax: parseFloat(bt.TotalTax) || 0,
          particulars: bt.Particulars ?? null,
          code: bt.Code ?? null,
          reference: bt.Reference ?? null,
          is_reconciled: bt.IsReconciled || false,
          line_items: bt.LineItems ?? []
        };
      });

      const { error: upsertError } = await supabase.from("bank_transactions").upsert(processedBankTransactions, {
        onConflict: "xero_bank_transaction_id"
      });

      if (upsertError) {
        console.error(`❌ [XERO-SYNC] Bank transaction database upsert error:`, upsertError);
        throw new Error(`Bank transaction database upsert failed: ${upsertError.message}`);
      }

      totalBankTransactions += bankTransactions.length;
      bankTransactionPage++;
      
      await new Promise((r) => setTimeout(r, 50));
    }

    progress.push(`✅ Bank Transactions: ${totalBankTransactions} processed (customer/supplier transactions only)`);

    // Determine if there's more data to sync
    const nextCustomerPage = hasMoreCustomers ? customerPage : null;
    const nextInvoicePage = hasMoreInvoices ? invoicePage : null;
    const nextBankTransactionPage = hasMoreBankTransactions ? bankTransactionPage : null;
    const hasMore = hasMoreCustomers || hasMoreInvoices || hasMoreBankTransactions;

    if (hasMore) {
      progress.push(`⏸️ Chunk complete: ${totalCustomers} customers, ${totalInvoices} invoices, and ${totalBankTransactions} bank transactions processed`);
      progress.push(`🔄 More data available. Next customer page: ${nextCustomerPage || 'complete'}, next invoice page: ${nextInvoicePage || 'complete'}, next bank transaction page: ${nextBankTransactionPage || 'complete'}`);
    } else {
      progress.push(`🎉 Complete import finished: ${totalCustomers} customers, ${totalInvoices} invoices, and ${totalBankTransactions} bank transactions imported`);
    }

    progress.push(`📊 Date parsing: ${dateParsingStats.successful} successful, ${dateParsingStats.failed} failed, ${dateParsingStats.nullDates} null`);

    console.log(`🎯 [XERO-SYNC] Chunk complete: customers=${totalCustomers}, invoices=${totalInvoices}, bankTransactions=${totalBankTransactions}, hasMore=${hasMore}`);

    return new Response(JSON.stringify({
      progress,
      totalCustomers,
      totalInvoices,
      totalBankTransactions,
      dateParsingStats,
      hasMore,
      nextStartPage: nextCustomerPage,
      nextInvoicePage: nextInvoicePage,
      nextBankTransactionPage: nextBankTransactionPage,
      success: true
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error(`💥 [XERO-SYNC] Critical error:`, err);
    return new Response(JSON.stringify({
      error: err.message,
      stack: err.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
