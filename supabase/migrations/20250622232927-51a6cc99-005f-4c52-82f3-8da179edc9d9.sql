
-- Enable Row Level Security on unmatched_invoices table
ALTER TABLE public.unmatched_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for unmatched_invoices
-- Allow authenticated users to view all unmatched invoices
CREATE POLICY "Authenticated users can view unmatched invoices" ON public.unmatched_invoices
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert unmatched invoices
CREATE POLICY "Authenticated users can insert unmatched invoices" ON public.unmatched_invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update unmatched invoices
CREATE POLICY "Authenticated users can update unmatched invoices" ON public.unmatched_invoices
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete unmatched invoices
CREATE POLICY "Authenticated users can delete unmatched invoices" ON public.unmatched_invoices
  FOR DELETE USING (auth.role() = 'authenticated');

-- Also allow service role full access for data imports/sync operations
CREATE POLICY "Service role full access to unmatched invoices" ON public.unmatched_invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
