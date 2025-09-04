-- Check if admin user exists in the database
-- This script will help diagnose the admin login issue

-- Step 1: Check if admin user exists in auth.users
SELECT 'Checking auth.users table for admin@ecowastego.com...' as info;

SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
FROM auth.users 
WHERE email = 'admin@ecowastego.com';

-- Step 2: Check if admin user exists in customers table
SELECT 'Checking customers table for admin@ecowastego.com...' as info;

SELECT 
    id,
    full_name,
    email,
    phone,
    created_at,
    updated_at
FROM customers 
WHERE email = 'admin@ecowastego.com';

-- Step 3: Check if admin user exists in recyclers table
SELECT 'Checking recyclers table for admin@ecowastego.com...' as info;

SELECT 
    id,
    full_name,
    email,
    phone,
    verification_status,
    created_at,
    updated_at
FROM recyclers 
WHERE email = 'admin@ecowastego.com';

-- Step 4: Check if admin user exists in admin_users table (if it exists)
SELECT 'Checking admin_users table for admin@ecowastego.com...' as info;

SELECT 
    id,
    user_id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
FROM admin_users 
WHERE email = 'admin@ecowastego.com';

-- Step 5: Get all users with admin-related emails
SELECT 'All users with admin-related emails...' as info;

SELECT 
    'auth.users' as table_name,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email ILIKE '%admin%'
UNION ALL
SELECT 
    'customers' as table_name,
    id::text,
    email,
    NULL as email_confirmed_at,
    created_at
FROM customers 
WHERE email ILIKE '%admin%'
UNION ALL
SELECT 
    'recyclers' as table_name,
    id::text,
    email,
    NULL as email_confirmed_at,
    created_at
FROM recyclers 
WHERE email ILIKE '%admin%';

-- Step 6: Check recent user registrations
SELECT 'Recent user registrations (last 10)...' as info;

SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 7: Check if there are any authentication issues
SELECT 'Authentication system status...' as info;

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_who_signed_in
FROM auth.users;
