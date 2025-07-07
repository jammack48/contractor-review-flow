
-- Update user role to developer for jamie@ostleelectrical.co.nz
UPDATE public.profiles 
SET role = 'developer' 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'jamie@ostleelectrical.co.nz'
);
