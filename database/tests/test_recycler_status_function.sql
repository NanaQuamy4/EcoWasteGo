-- Test the get_recycler_online_status function directly
SELECT * FROM get_recycler_online_status('e9e096bf-7c7b-4338-a619-124d7ae699b6');

-- Also check the recycler data directly
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  last_seen_at,
  heartbeat_at,
  session_id
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';
