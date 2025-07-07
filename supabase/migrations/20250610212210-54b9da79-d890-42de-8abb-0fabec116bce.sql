
-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invoices table  
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Users can view all customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update customers" ON customers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete customers" ON customers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for invoices
CREATE POLICY "Users can view all invoices" ON invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert invoices" ON invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update invoices" ON invoices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete invoices" ON invoices
  FOR DELETE USING (auth.role() = 'authenticated');
