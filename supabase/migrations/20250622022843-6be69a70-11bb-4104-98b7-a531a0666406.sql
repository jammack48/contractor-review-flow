
-- Add phone_number column to sms_templates table
ALTER TABLE public.sms_templates 
ADD COLUMN phone_number TEXT;
