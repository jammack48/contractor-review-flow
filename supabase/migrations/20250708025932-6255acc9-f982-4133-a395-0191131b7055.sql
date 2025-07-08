
-- Add missing fields to customers table
ALTER TABLE public.customers ADD COLUMN google_review_given boolean DEFAULT false;

-- Add missing fields to sms_history table to match what the UI expects
ALTER TABLE public.sms_history ADD COLUMN delivery_status text DEFAULT 'pending';
ALTER TABLE public.sms_history ADD COLUMN customer_name text;
ALTER TABLE public.sms_history ADD COLUMN message_content text;
ALTER TABLE public.sms_history ADD COLUMN delivery_timestamp timestamptz;
ALTER TABLE public.sms_history ADD COLUMN campaign_id text;
ALTER TABLE public.sms_history ADD COLUMN error_message text;

-- Add missing fields to bank_transactions table to match BankTransaction type
ALTER TABLE public.bank_transactions ADD COLUMN xero_bank_transaction_id text;
ALTER TABLE public.bank_transactions ADD COLUMN xero_contact_id text;  
ALTER TABLE public.bank_transactions ADD COLUMN xero_bank_account_id text;
ALTER TABLE public.bank_transactions ADD COLUMN bank_account_name text;
ALTER TABLE public.bank_transactions ADD COLUMN bank_account_code text;
ALTER TABLE public.bank_transactions ADD COLUMN transaction_date date;
ALTER TABLE public.bank_transactions ADD COLUMN reference text;
ALTER TABLE public.bank_transactions ADD COLUMN is_reconciled boolean DEFAULT false;
ALTER TABLE public.bank_transactions ADD COLUMN sub_type text;
ALTER TABLE public.bank_transactions ADD COLUMN status text;
ALTER TABLE public.bank_transactions ADD COLUMN currency_code text DEFAULT 'NZD';
ALTER TABLE public.bank_transactions ADD COLUMN currency_rate decimal DEFAULT 1.0;
ALTER TABLE public.bank_transactions ADD COLUMN gross_amount decimal;
ALTER TABLE public.bank_transactions ADD COLUMN net_amount decimal;
ALTER TABLE public.bank_transactions ADD COLUMN tax_amount decimal;
ALTER TABLE public.bank_transactions ADD COLUMN tax_type text;

-- Update the message column name to match what UI expects
ALTER TABLE public.sms_history ALTER COLUMN message TYPE text;

-- Copy message content to new message_content field for existing records
UPDATE public.sms_history SET message_content = message WHERE message_content IS NULL;
