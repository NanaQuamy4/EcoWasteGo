-- Check what triggers are causing automatic busy status
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'pickup_requests'
  AND trigger_name LIKE '%availability%'
  OR trigger_name LIKE '%busy%';

-- Check functions that might be setting is_available to false
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%availability%' 
   OR routine_name LIKE '%busy%'
   OR routine_name LIKE '%update_recycler%';
