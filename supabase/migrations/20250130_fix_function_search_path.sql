
-- Fix Function Search Path Mutable warnings by setting explicit search paths

-- Drop and recreate update_customer_stats function with proper search path
DROP FUNCTION IF EXISTS public.update_customer_stats();

CREATE OR REPLACE FUNCTION public.update_customer_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Update customer statistics
  UPDATE public.customers 
  SET 
    total_spend = COALESCE((
      SELECT SUM(total_amount) 
      FROM public.jobs 
      WHERE customer_id = COALESCE(NEW.customer_id, OLD.customer_id)
    ), 0),
    job_count = COALESCE((
      SELECT COUNT(*) 
      FROM public.jobs 
      WHERE customer_id = COALESCE(NEW.customer_id, OLD.customer_id)
    ), 0),
    last_job_date = (
      SELECT MAX(invoice_date) 
      FROM public.jobs 
      WHERE customer_id = COALESCE(NEW.customer_id, OLD.customer_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.customer_id, OLD.customer_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Drop and recreate handle_new_user function with proper search path
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$function$;
