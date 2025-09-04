-- Check the structure of the admin_all_users view
-- This will help us see what columns are actually available

-- First, let's see what columns exist in the admin_all_users view
SELECT 'admin_all_users view structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_all_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Let's see what the admin_all_users view is actually returning (just the basic count)
SELECT 'admin_all_users view results:' as info;
SELECT 
    user_type,
    COUNT(*) as count
FROM admin_all_users 
GROUP BY user_type;

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
