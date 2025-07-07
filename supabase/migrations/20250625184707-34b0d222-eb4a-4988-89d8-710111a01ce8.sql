
-- Create SMS logs table to track all SMS attempts and delivery status
CREATE TABLE public.sms_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id),
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  message_content text NOT NULL,
  campaign_id text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  delivery_status text NOT NULL DEFAULT 'pending', -- pending, delivered, failed, unknown
  delivery_timestamp timestamp with time zone,
  delivery_status_id integer,
  delivery_code integer,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for SMS logs
CREATE POLICY "Users can view their own SMS logs" 
  ON public.sms_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SMS logs" 
  ON public.sms_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SMS logs" 
  ON public.sms_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_sms_logs_updated_at
  BEFORE UPDATE ON public.sms_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_sms_logs_user_id ON public.sms_logs(user_id);
CREATE INDEX idx_sms_logs_invoice_id ON public.sms_logs(invoice_id);
CREATE INDEX idx_sms_logs_sent_at ON public.sms_logs(sent_at DESC);
