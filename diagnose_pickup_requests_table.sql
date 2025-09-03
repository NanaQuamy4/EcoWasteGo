-- Diagnose the current structure of pickup_requests table
-- Run this first to see what columns exist

-- Check if the table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickup_requests') 
        THEN 'Table EXISTS' 
        ELSE 'Table DOES NOT EXIST' 
    END as table_status;

-- If table exists, show all columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
ORDER BY ordinal_position;

-- Show table constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'pickup_requests';

-- Show indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'pickup_requests';
