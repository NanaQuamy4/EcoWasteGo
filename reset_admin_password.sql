-- Reset admin password to fix login issue
-- This will set a new password for the admin user

-- First, let's check the current user details
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'admin@ecowastego.com';

-- Note: We cannot directly update passwords in auth.users table
-- We need to use Supabase Auth API or reset via dashboard

SELECT 'INFO: Cannot reset password via SQL. Use one of these methods:' as status;
SELECT '1. Supabase Dashboard: Auth > Users > admin@ecowastego.com > Reset Password' as method1;
SELECT '2. App: Use "Forgot Password" feature' as method2;
SELECT '3. Create new admin account with known password' as method3;
