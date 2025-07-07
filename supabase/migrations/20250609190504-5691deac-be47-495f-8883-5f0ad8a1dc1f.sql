
-- Update user role to admin for jamie@ostleelectrical.co.nz
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'jamie@ostleelectrical.co.nz'
);
