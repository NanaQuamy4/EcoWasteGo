-- Fix recycler heartbeat to make them available immediately
UPDATE recyclers 
SET 
  heartbeat_at = NOW(),
  last_seen_at = NOW(),
  is_online = true,
  is_available = true,
  updated_at = NOW()
WHERE email = 'nquamy7@gmail.com';

-- Verify the fix
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  heartbeat_at,
  (heartbeat_at > NOW() - INTERVAL '5 minutes') as heartbeat_recent
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';

-- Test the RPC function
SELECT * FROM get_available_recyclers_for_requests();
