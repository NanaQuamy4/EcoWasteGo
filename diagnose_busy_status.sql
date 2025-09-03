-- Diagnose why recycler shows as "Busy" when they have 0 requests
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  last_seen_at,
  heartbeat_at,
  created_at,
  updated_at
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';

-- Check all pickup requests for this recycler (any status)
SELECT 
  id,
  status,
  created_at,
  updated_at
FROM pickup_requests 
WHERE recycler_id = (SELECT id FROM recyclers WHERE email = 'nquamy7@gmail.com')
ORDER BY created_at DESC;

-- Check the admin status function to see what it reports
SELECT 
  full_name,
  status_category,
  pending_requests_count,
  is_available,
  is_online
FROM admin_get_all_recyclers_status()
WHERE email = 'nquamy7@gmail.com';

-- Check if there are any triggers or functions that might be setting is_available to false
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'recyclers';
