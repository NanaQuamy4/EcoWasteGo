-- Check the recycler's heartbeat status
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  last_seen_at,
  heartbeat_at,
  NOW() as current_time,
  (heartbeat_at > NOW() - INTERVAL '5 minutes') as heartbeat_recent,
  (NOW() - heartbeat_at) as time_since_heartbeat
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';

-- Test the RPC function directly
SELECT * FROM get_available_recyclers_for_requests();

-- Update heartbeat to current time to make recycler available
UPDATE recyclers 
SET 
  heartbeat_at = NOW(),
  last_seen_at = NOW(),
  updated_at = NOW()
WHERE email = 'nquamy7@gmail.com';

-- Test again after updating heartbeat
SELECT * FROM get_available_recyclers_for_requests();
