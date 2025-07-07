
-- Add google_review_given column to customers table
ALTER TABLE public.customers 
ADD COLUMN google_review_given boolean DEFAULT false;

-- Create index for better query performance on google_review_given
CREATE INDEX idx_customers_google_review_given ON public.customers(google_review_given);
