
-- Drop the existing foreign key constraint
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS fk_bank_transactions_contact;

-- Recreate the constraint with CASCADE deletion
-- This will automatically delete related bank transactions when a customer is deleted
ALTER TABLE bank_transactions 
ADD CONSTRAINT fk_bank_transactions_contact 
FOREIGN KEY (xero_contact_id) 
REFERENCES customers (xero_contact_id) 
ON DELETE CASCADE;

-- Also add the same for invoices to prevent similar issues
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_contact;
ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_contact 
FOREIGN KEY (xero_contact_id) 
REFERENCES customers (xero_contact_id) 
ON DELETE CASCADE;
