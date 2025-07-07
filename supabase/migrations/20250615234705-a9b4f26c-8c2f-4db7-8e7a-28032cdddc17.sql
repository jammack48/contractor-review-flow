
-- Add service_keywords column to invoices table for AI-extracted service types
ALTER TABLE public.invoices 
ADD COLUMN service_keywords text[];

-- Add an index on service_keywords for faster searching
CREATE INDEX idx_invoices_service_keywords ON public.invoices USING GIN (service_keywords);

-- Update existing invoices to have empty array as default
UPDATE public.invoices 
SET service_keywords = '{}' 
WHERE service_keywords IS NULL;
