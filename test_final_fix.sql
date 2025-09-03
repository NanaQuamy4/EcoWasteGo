-- =====================================================
-- TEST THE FINAL FIX
-- =====================================================

-- Test the fixed admin function
SELECT 'Testing fixed admin_get_all_recyclers_status function...' as test_step;
SELECT * FROM admin_get_all_recyclers_status() LIMIT 3;

-- Test the summary function
SELECT 'Testing admin_get_online_recyclers_summary function...' as test_step;
SELECT * FROM admin_get_online_recyclers_summary();

-- Test the monitoring view
SELECT 'Testing admin_recyclers_monitoring view...' as test_step;
SELECT * FROM admin_recyclers_monitoring LIMIT 3;
