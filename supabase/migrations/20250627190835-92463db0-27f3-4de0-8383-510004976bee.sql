
-- Fix existing contacts that should be customers but are marked as non-customers
-- Set all contacts to is_customer = true since they're all potential business relationships
UPDATE public.customers 
SET is_customer = true, updated_at = now() 
WHERE is_customer = false;

-- Create an index to help with performance on customer queries
CREATE INDEX IF NOT EXISTS idx_customers_is_customer ON public.customers(is_customer);
