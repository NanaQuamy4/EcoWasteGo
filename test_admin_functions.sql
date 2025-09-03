-- =====================================================
-- TEST ADMIN FUNCTIONS
-- =====================================================

-- Test 1: Check if recyclers table exists and has data
SELECT 'Testing recyclers table...' as test_step;
SELECT COUNT(*) as total_recyclers FROM recyclers;

-- Test 2: Check column types in recyclers table
SELECT 'Checking column types...' as test_step;
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
AND column_name IN ('full_name', 'phone', 'email', 'truck_size', 'verification_status', 'session_id')
ORDER BY column_name;

-- Test 3: Test admin_get_all_recyclers_status function
SELECT 'Testing admin_get_all_recyclers_status function...' as test_step;
SELECT * FROM admin_get_all_recyclers_status() LIMIT 3;

-- Test 4: Test admin_get_online_recyclers_summary function
SELECT 'Testing admin_get_online_recyclers_summary function...' as test_step;
SELECT * FROM admin_get_online_recyclers_summary();

-- Test 5: Test admin_recyclers_monitoring view
SELECT 'Testing admin_recyclers_monitoring view...' as test_step;
SELECT * FROM admin_recyclers_monitoring LIMIT 3;

-- Test 6: Check if required columns exist
SELECT 'Checking required columns exist...' as test_step;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
AND column_name IN ('is_online', 'is_available', 'heartbeat_at', 'last_seen_at')
ORDER BY column_name;
