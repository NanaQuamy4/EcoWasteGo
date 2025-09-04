-- Refresh recycler status to ensure it's properly set
UPDATE recyclers 
SET 
  is_online = true,
  is_available = true,
  heartbeat_at = NOW(),
  last_seen_at = NOW(),
  updated_at = NOW()
WHERE email = 'nquamy7@gmail.com';

-- Verify the update
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  last_seen_at,
  heartbeat_at
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';

-- Test the status function
SELECT * FROM get_recycler_online_status('e9e096bf-7c7b-4338-a619-124d7ae699b6');
