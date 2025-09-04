-- Comprehensive Database Health Check for EcoWasteGo Pickup Requests
-- This script verifies that the database is properly set up for our application flow

-- ===== 1. CHECK TABLE STRUCTURE =====
SELECT '=== TABLE STRUCTURE CHECK ===' as section;

-- Check if pickup_requests table exists and has all required columns
SELECT 
    'pickup_requests table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pickup_requests'
ORDER BY ordinal_position;

-- ===== 2. CHECK STATUS CONSTRAINT =====
SELECT '=== STATUS CONSTRAINT CHECK ===' as section;

-- Check current status constraint
SELECT 
    'Current status constraint:' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'pickup_requests'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';

-- ===== 3. CHECK INDEXES =====
SELECT '=== INDEXES CHECK ===' as section;

-- Check all indexes on pickup_requests table
SELECT 
    'Indexes on pickup_requests:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'pickup_requests'
ORDER BY indexname;

-- ===== 4. CHECK FOREIGN KEY CONSTRAINTS =====
SELECT '=== FOREIGN KEY CONSTRAINTS CHECK ===' as section;

-- Check foreign key constraints
SELECT 
    'Foreign key constraints:' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'pickup_requests';

-- ===== 5. CHECK ROW LEVEL SECURITY =====
SELECT '=== ROW LEVEL SECURITY CHECK ===' as section;

-- Check if RLS is enabled
SELECT 
    'RLS status:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pickup_requests';

-- Check RLS policies
SELECT 
    'RLS policies:' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pickup_requests'
ORDER BY policyname;

-- ===== 6. CHECK REAL-TIME PUBLICATION =====
SELECT '=== REAL-TIME PUBLICATION CHECK ===' as section;

-- Check if table is in real-time publication
SELECT 
    'Real-time publication status:' as info,
    *
FROM pg_publication_tables 
WHERE tablename = 'pickup_requests';

-- ===== 7. CHECK SAMPLE DATA =====
SELECT '=== SAMPLE DATA CHECK ===' as section;

-- Check current data in pickup_requests
SELECT 
    'Current pickup_requests count:' as info,
    COUNT(*) as total_requests
FROM pickup_requests;

-- Check status distribution
SELECT 
    'Status distribution:' as info,
    status,
    COUNT(*) as count
FROM pickup_requests
GROUP BY status
ORDER BY count DESC;

-- Check for any invalid statuses (should be empty if constraint is working)
SELECT 
    'Invalid statuses (should be empty):' as info,
    status,
    COUNT(*) as count
FROM pickup_requests
WHERE status NOT IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')
GROUP BY status;

-- ===== 8. CHECK CUSTOMERS TABLE INTEGRATION =====
SELECT '=== CUSTOMERS TABLE INTEGRATION CHECK ===' as section;

-- Check if customers table exists
SELECT 
    'Customers table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- Check for orphaned pickup_requests (should be empty)
SELECT 
    'Orphaned pickup_requests (should be empty):' as info,
    COUNT(*) as orphaned_count
FROM pickup_requests pr
LEFT JOIN customers c ON pr.customer_id = c.id
WHERE c.id IS NULL;

-- ===== 9. CHECK RECYCLERS TABLE INTEGRATION =====
SELECT '=== RECYCLERS TABLE INTEGRATION CHECK ===' as section;

-- Check if recyclers table exists
SELECT 
    'Recyclers table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'recyclers'
ORDER BY ordinal_position;

-- Check for orphaned recycler assignments (should be empty)
SELECT 
    'Orphaned recycler assignments (should be empty):' as info,
    COUNT(*) as orphaned_count
FROM pickup_requests pr
LEFT JOIN recyclers r ON pr.recycler_id = r.id
WHERE pr.recycler_id IS NOT NULL AND r.id IS NULL;

-- ===== 10. CHECK TRIGGERS =====
SELECT '=== TRIGGERS CHECK ===' as section;

-- Check for status transition trigger
SELECT 
    'Status transition trigger:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'pickup_requests'
ORDER BY trigger_name;

-- ===== 11. PERFORMANCE CHECK =====
SELECT '=== PERFORMANCE CHECK ===' as section;

-- Check table statistics
SELECT 
    'Table statistics:' as info,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE tablename = 'pickup_requests';

-- ===== 12. FINAL HEALTH SUMMARY =====
SELECT '=== FINAL HEALTH SUMMARY ===' as section;

-- Overall health check
WITH health_checks AS (
    SELECT 
        'Table exists' as check_name,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickup_requests') 
             THEN 'PASS' ELSE 'FAIL' END as status
    UNION ALL
    SELECT 
        'Status constraint exists',
        CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'pickup_requests'::regclass AND contype = 'c' AND conname LIKE '%status%')
             THEN 'PASS' ELSE 'FAIL' END
    UNION ALL
    SELECT 
        'Status constraint includes all required statuses',
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'pickup_requests'::regclass 
            AND contype = 'c' 
            AND conname LIKE '%status%'
            AND pg_get_constraintdef(oid) LIKE '%assigned%'
            AND pg_get_constraintdef(oid) LIKE '%confirmed%'
        ) THEN 'PASS' ELSE 'FAIL' END
    UNION ALL
    SELECT 
        'Foreign key to customers exists',
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'pickup_requests' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%customer_id%'
        ) THEN 'PASS' ELSE 'FAIL' END
    UNION ALL
    SELECT 
        'RLS enabled',
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pickup_requests' AND rowsecurity = true)
             THEN 'PASS' ELSE 'FAIL' END
    UNION ALL
    SELECT 
        'Real-time enabled',
        CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'pickup_requests')
             THEN 'PASS' ELSE 'FAIL' END
    UNION ALL
    SELECT 
        'No orphaned customer references',
        CASE WHEN NOT EXISTS (SELECT 1 FROM pickup_requests pr LEFT JOIN customers c ON pr.customer_id = c.id WHERE c.id IS NULL)
             THEN 'PASS' ELSE 'FAIL' END
    UNION ALL
    SELECT 
        'Status transition trigger exists',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'pickup_requests' AND trigger_name LIKE '%status%')
             THEN 'PASS' ELSE 'FAIL' END
)
SELECT 
    'Health Check Results:' as info,
    check_name,
    status
FROM health_checks
ORDER BY 
    CASE status 
        WHEN 'PASS' THEN 1 
        ELSE 2 
    END,
    check_name;

-- Final status
SELECT 'Database health check completed!' as final_status;
