-- Debug the admin_all_users view to see why it shows 3 customers instead of 4
-- Using correct column names

-- First, let's see what the admin_all_users view is actually returning
SELECT 'admin_all_users view results:' as info;
SELECT 
    user_type,
    COUNT(*) as count
FROM admin_all_users 
GROUP BY user_type;

-- Let's see the actual data in the view (using only columns that exist)
SELECT 'Detailed admin_all_users data:' as info;
SELECT 
    user_type,
    email,
    created_at
FROM admin_all_users 
ORDER BY user_type, created_at;

-- Let's check what's in the customers table directly
SELECT 'Direct customers table count:' as info;
SELECT COUNT(*) as customer_count FROM customers;

-- Let's see the actual customers data (using correct column name 'id')
SELECT 'Direct customers table data:' as info;
SELECT 
    id,
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
LEFT JOIN customers c ON au.id = c.id
WHERE au.raw_user_meta_data->>'role' = 'customer'
AND c.id IS NULL
ORDER BY au.created_at;
