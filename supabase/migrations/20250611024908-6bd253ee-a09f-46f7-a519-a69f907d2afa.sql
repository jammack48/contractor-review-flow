
-- Drop the existing RLS policies that are blocking the import
DROP POLICY IF EXISTS "Users can view all customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

DROP POLICY IF EXISTS "Users can view all invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;

-- Create new RLS policies that allow service role access (for imports) and authenticated user access
-- Customers table policies
CREATE POLICY "Allow all access for authenticated users and service role" ON customers
  FOR ALL USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );

-- Invoices table policies  
CREATE POLICY "Allow all access for authenticated users and service role" ON invoices
  FOR ALL USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );
