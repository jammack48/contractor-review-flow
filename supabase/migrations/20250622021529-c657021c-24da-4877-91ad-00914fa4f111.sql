
-- Create a table for SMS templates
CREATE TABLE public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  template_name TEXT NOT NULL DEFAULT 'review_request',
  message_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own templates
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own templates
CREATE POLICY "Users can view their own SMS templates" 
  ON public.sms_templates 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own templates
CREATE POLICY "Users can create their own SMS templates" 
  ON public.sms_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own templates
CREATE POLICY "Users can update their own SMS templates" 
  ON public.sms_templates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own templates
CREATE POLICY "Users can delete their own SMS templates" 
  ON public.sms_templates 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_sms_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sms_templates_updated_at
    BEFORE UPDATE ON public.sms_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_templates_updated_at();
