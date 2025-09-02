-- Check the structure of both tables to see what columns are actually available

-- Check admin_all_users view structure
SELECT 'admin_all_users view structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_all_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check customers table structure
SELECT 'customers table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check recyclers table structure
SELECT 'recyclers table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Basic counts from each source
SELECT 'admin_all_users view results:' as info;
SELECT 
    user_type,
    COUNT(*) as count
FROM admin_all_users 
GROUP BY user_type;

SELECT 'Direct customers table count:' as info;
SELECT COUNT(*) as customer_count FROM customers;

SELECT 'Direct recyclers table count:' as info;
SELECT COUNT(*) as recycler_count FROM recyclers;
