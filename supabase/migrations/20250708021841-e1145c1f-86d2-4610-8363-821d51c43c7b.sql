
-- Create customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  xero_contact_id text UNIQUE,
  name text NOT NULL,
  email_address text,
  phone_numbers jsonb DEFAULT '[]'::jsonb,
  addresses jsonb DEFAULT '[]'::jsonb,
  contact_groups jsonb DEFAULT '[]'::jsonb,
  contact_persons jsonb DEFAULT '[]'::jsonb,
  sales_tracking_categories jsonb DEFAULT '[]'::jsonb,
  purchases_tracking_categories jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  xero_invoice_id text UNIQUE,
  xero_contact_id text,
  invoice_number text,
  invoice_type text,
  invoice_status text,
  line_amount_types text,
  invoice_date date,
  due_date date,
  expected_payment_date date,
  planned_payment_date date,
  fully_paid_on_date date,
  sub_total decimal,
  total_tax decimal,
  total decimal,
  total_discount decimal,
  amount_due decimal,
  amount_paid decimal,
  amount_credited decimal,
  work_description text,
  service_keywords jsonb DEFAULT '[]'::jsonb,
  line_items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create xero_connections table
CREATE TABLE public.xero_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  tenant_name text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  refresh_expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sms_templates table
CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  message_content text NOT NULL,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sms_history table
CREATE TABLE public.sms_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create bank_transactions table
CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id text,
  bank_account_id text,
  date date,
  amount decimal,
  description text,
  type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Users can view their own customers" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers" ON public.customers
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for xero_connections
CREATE POLICY "Users can view their own xero connections" ON public.xero_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own xero connections" ON public.xero_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own xero connections" ON public.xero_connections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own xero connections" ON public.xero_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for sms_templates
CREATE POLICY "Users can view their own sms templates" ON public.sms_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sms templates" ON public.sms_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sms templates" ON public.sms_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sms templates" ON public.sms_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for sms_history
CREATE POLICY "Users can view their own sms history" ON public.sms_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sms history" ON public.sms_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for bank_transactions
CREATE POLICY "Users can view their own bank transactions" ON public.bank_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bank transactions" ON public.bank_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank transactions" ON public.bank_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bank transactions" ON public.bank_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_xero_contact_id ON public.customers(xero_contact_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_xero_invoice_id ON public.invoices(xero_invoice_id);
CREATE INDEX idx_invoices_xero_contact_id ON public.invoices(xero_contact_id);
CREATE INDEX idx_xero_connections_user_id ON public.xero_connections(user_id);
CREATE INDEX idx_sms_templates_user_id ON public.sms_templates(user_id);
CREATE INDEX idx_sms_history_user_id ON public.sms_history(user_id);
CREATE INDEX idx_bank_transactions_user_id ON public.bank_transactions(user_id);
