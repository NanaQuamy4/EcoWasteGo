-- Fix admin data consistency across all screens
-- This ensures all admin screens show the same user counts

-- First, let's check what the current RPC function returns
SELECT 'Current get_user_analytics results:' as info;
SELECT * FROM get_user_analytics();

-- Check what the admin_all_users view returns
SELECT 'Current admin_all_users view results:' as info;
SELECT 
    user_type,
    COUNT(*) as count
FROM admin_all_users 
GROUP BY user_type;

-- Check what the admin_user_stats view returns
SELECT 'Current admin_user_stats view results:' as info;
SELECT * FROM admin_user_stats;

-- Let's also check the raw data
SELECT 'Raw auth.users data:' as info;
SELECT 
    raw_user_meta_data->>'role' as role,
    COUNT(*) as count
FROM auth.users 
WHERE raw_user_meta_data->>'role' IN ('customer', 'recycler', 'admin')
GROUP BY raw_user_meta_data->>'role';

-- Check customers table
SELECT 'Customers table data:' as info;
SELECT COUNT(*) as customer_count FROM customers;

-- Check recyclers table  
SELECT 'Recyclers table data:' as info;
SELECT COUNT(*) as recycler_count FROM recyclers;
