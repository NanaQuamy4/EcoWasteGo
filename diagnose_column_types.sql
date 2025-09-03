-- =====================================================
-- DIAGNOSE COLUMN TYPES IN RECYCLERS TABLE
-- =====================================================

-- Check the exact data types of all columns in the recyclers table
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
ORDER BY ordinal_position;

-- Check if the table exists and has data
SELECT 
  'Table exists: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recyclers') THEN 'YES' ELSE 'NO' END as table_check,
  'Row count: ' || (SELECT COUNT(*) FROM recyclers) as row_count;

-- Check specific columns that are causing issues
SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
AND column_name IN ('full_name', 'phone', 'email', 'truck_size', 'verification_status', 'session_id', 'is_online', 'is_available', 'heartbeat_at', 'last_seen_at')
ORDER BY column_name;
