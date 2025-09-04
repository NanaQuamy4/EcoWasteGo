-- =====================================================
-- FINAL TEST FOR ADMIN FUNCTIONS
-- =====================================================

-- Test 1: Check if recyclers table exists and has data
SELECT '=== TEST 1: Checking recyclers table ===' as test_step;
SELECT 
  'Table exists: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recyclers') THEN 'YES' ELSE 'NO' END as table_check,
  'Row count: ' || (SELECT COUNT(*) FROM recyclers) as row_count;

-- Test 2: Check column types in recyclers table
SELECT '=== TEST 2: Checking column types ===' as test_step;
SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
AND column_name IN ('full_name', 'phone', 'email', 'truck_size', 'verification_status', 'session_id', 'is_online', 'is_available', 'heartbeat_at', 'last_seen_at')
ORDER BY column_name;

-- Test 3: Test admin_get_all_recyclers_status function
SELECT '=== TEST 3: Testing admin_get_all_recyclers_status function ===' as test_step;
SELECT * FROM admin_get_all_recyclers_status() LIMIT 3;

-- Test 4: Test admin_get_online_recyclers_summary function
SELECT '=== TEST 4: Testing admin_get_online_recyclers_summary function ===' as test_step;
SELECT * FROM admin_get_online_recyclers_summary();

-- Test 5: Test admin_recyclers_monitoring view
SELECT '=== TEST 5: Testing admin_recyclers_monitoring view ===' as test_step;
SELECT * FROM admin_recyclers_monitoring LIMIT 3;

-- Test 6: Check if required columns exist
SELECT '=== TEST 6: Checking required columns exist ===' as test_step;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
AND column_name IN ('is_online', 'is_available', 'heartbeat_at', 'last_seen_at')
ORDER BY column_name;

-- Test 7: Test function permissions
SELECT '=== TEST 7: Testing function permissions ===' as test_step;
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name LIKE 'admin_%' 
AND routine_schema = 'public'
ORDER BY routine_name;

-- Test 8: Test view permissions
SELECT '=== TEST 8: Testing view permissions ===' as test_step;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'admin_recyclers_monitoring' 
AND table_schema = 'public';

-- Test 9: Sample data check
SELECT '=== TEST 9: Sample recycler data ===' as test_step;
SELECT 
  id,
  full_name,
  verification_status,
  is_online,
  is_available,
  last_seen_at,
  heartbeat_at
FROM recyclers 
LIMIT 5;

-- Test 10: Summary statistics
SELECT '=== TEST 10: Summary statistics ===' as test_step;
SELECT 
  COUNT(*) as total_recyclers,
  COUNT(CASE WHEN verification_status = 'approved' THEN 1 END) as verified_recyclers,
  COUNT(CASE WHEN is_online = true THEN 1 END) as online_recyclers,
  COUNT(CASE WHEN is_online = true AND is_available = true THEN 1 END) as available_recyclers
FROM recyclers;
