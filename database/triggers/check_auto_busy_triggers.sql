-- Check all triggers on the recyclers table that might be setting is_available to false
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'recyclers'
ORDER BY trigger_name;

-- Check if there are any functions that might be automatically setting availability
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%availability%' 
   OR routine_name LIKE '%busy%'
   OR routine_name LIKE '%offline%';

-- Check the specific trigger function that updates availability
SELECT 
  prosrc
FROM pg_proc 
WHERE proname = 'update_recycler_availability_based_on_requests';
