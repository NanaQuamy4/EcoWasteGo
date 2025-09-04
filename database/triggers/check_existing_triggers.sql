-- Check existing triggers on the recyclers table
-- This helps diagnose trigger conflicts

-- Check all triggers on the recyclers table
SELECT 
  'Current triggers on recyclers table:' as info;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'recyclers'
ORDER BY trigger_name;

-- Check all functions related to verification
SELECT 
  'Verification-related functions:' as info;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%verification%'
ORDER BY routine_name;

-- Check if the create_notification function exists
SELECT 
  'create_notification function check:' as info;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'create_notification';
