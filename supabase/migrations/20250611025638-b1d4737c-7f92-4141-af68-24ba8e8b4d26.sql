
-- First, let's completely disable RLS temporarily to test if that's the issue
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- Then re-enable it with more explicit policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow all access for authenticated users and service role" ON customers;
DROP POLICY IF EXISTS "Allow all access for authenticated users and service role" ON invoices;

-- Create new policies that explicitly allow service_role for all operations
CREATE POLICY "service_role_full_access" ON customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_access" ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_access" ON invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
