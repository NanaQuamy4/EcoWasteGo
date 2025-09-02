-- Debug the admin_all_users view to see why it shows 3 customers instead of 4
-- This will help us identify the source of the discrepancy

-- First, let's see what the admin_all_users view is actually returning
SELECT 'admin_all_users view results:' as info;
SELECT 
    user_type,
    COUNT(*) as count
FROM admin_all_users 
GROUP BY user_type;

-- Let's see the actual data in the view
SELECT 'Detailed admin_all_users data:' as info;
SELECT 
    user_type,
    email,
    name,
    created_at
FROM admin_all_users 
ORDER BY user_type, created_at;

-- Let's check what's in the customers table directly
SELECT 'Direct customers table count:' as info;
SELECT COUNT(*) as customer_count FROM customers;

-- Let's see the actual customers data
SELECT 'Direct customers table data:' as info;
SELECT 
    id,
    user_id,
    email,
    name,
    created_at
FROM customers 
ORDER BY created_at;

-- Let's check if there are any users in auth.users that might be causing the discrepancy
SELECT 'Auth users with customer role:' as info;
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'customer'
ORDER BY created_at;

-- Let's check if there are any users in auth.users that don't have a corresponding record in customers table
SELECT 'Auth users with customer role but no customers table record:' as info;
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'role' as role,
    au.created_at
FROM auth.users au
LEFT JOIN customers c ON au.id = c.user_id
WHERE au.raw_user_meta_data->>'role' = 'customer'
AND c.user_id IS NULL
ORDER BY au.created_at;
