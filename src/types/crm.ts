
export interface Customer {
  id: string;
  xero_contact_id: string;
  name: string;
  email_address?: string;
  phone_numbers: any[];
  addresses: any[];
  contact_status: string;
  is_supplier: boolean;
  is_customer: boolean;
  contact_groups: any[];
  website?: string;
  bank_account_details?: string;
  tax_number?: string;
  accounts_receivable_tax_type?: string;
  accounts_payable_tax_type?: string;
  contact_persons: any[];
  xero_network_key?: string;
  sales_default_account_code?: string;
  purchases_default_account_code?: string;
  sales_tracking_categories: any[];
  purchases_tracking_categories: any[];
  contact_id?: string;
  contact_number?: string;
  account_number?: string;
  legal_name?: string;
  company_number?: string;
  google_review_given?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  Description?: string;
  Quantity?: number;
  UnitAmount?: number;
  LineAmount?: number;
  AccountCode?: string;
  TaxType?: string;
  ItemCode?: string;
  LineItemID?: string;
}

export interface Invoice {
  id: string;
  xero_invoice_id: string;
  xero_contact_id: string;
  invoice_number?: string;
  invoice_type: string;
  invoice_status: string;
  line_amount_types: string;
  invoice_date?: string;
  due_date?: string;
  expected_payment_date?: string;
  planned_payment_date?: string;
  fully_paid_on_date?: string;
  sub_total: number;
  total_tax: number;
  total: number;
  total_discount: number;
  amount_due: number;
  amount_paid: number;
  amount_credited: number;
  work_description?: string;
  service_keywords?: string[]; // New field for AI-extracted service keywords
  line_items?: LineItem[]; // Made optional for lazy loading
  created_at: string;
  updated_at: string;
}

export interface FilterState {
  invoiceStatus: string;
  dateRange: {
    start: string;
    end: string;
  };
  searchTerm: string;
  invoiceType?: string;
  serviceKeywords?: string[]; // New field for service keyword filtering
}

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface XeroTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tenantId: string;
  tenantName: string;
}

export interface XeroSyncResponse {
  customers: Customer[];
  invoices: Invoice[];
  errors: string[];
}

export interface BankTransaction {
  id: string;
  user_id: string | null;
  xero_bank_transaction_id: string | null;
  xero_contact_id: string | null;
  xero_bank_account_id: string | null;
  bank_account_name: string | null;
  bank_account_code: string | null;  
  bank_account_id: string | null;
  transaction_id: string | null;
  transaction_date: string | null;
  date: string | null;
  amount: number | null;
  gross_amount: number | null;
  net_amount: number | null;
  tax_amount: number | null;
  description: string | null;
  reference: string | null;
  type: string | null;
  sub_type: string | null;
  status: string | null;
  currency_code: string | null;
  currency_rate: number | null;
  tax_type: string | null;
  is_reconciled: boolean | null;
  created_at: string;
  updated_at: string;
}

// Update the BadgeLevel type back to include 'black' instead of 'gray'
export type BadgeLevel = 'gold' | 'silver' | 'bronze' | 'copper' | 'black';
