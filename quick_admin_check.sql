-- Quick check for admin user existence
-- Run this to quickly see if admin@ecowastego.com exists

-- Check auth.users table
SELECT 
    'auth.users' as source,
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'admin@ecowastego.com';

-- If no results, show all admin-related emails
SELECT 
    'All admin emails in auth.users' as info,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email ILIKE '%admin%'
ORDER BY created_at DESC;
