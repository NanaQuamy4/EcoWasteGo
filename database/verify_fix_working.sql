-- Verify the fix is working - check recycler status
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  last_seen_at
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';

-- Test the RPC function that the customer app uses
SELECT * FROM get_available_recyclers_for_requests();

-- Check if there are any pickup requests that might affect availability
SELECT 
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status IN ('accepted', 'in_progress', 'confirmed') THEN 1 END) as pending_requests
FROM pickup_requests 
WHERE recycler_id = (SELECT id FROM recyclers WHERE email = 'nquamy7@gmail.com');
