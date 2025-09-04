-- Test the exact RPC function that the customer app uses
SELECT * FROM get_available_recyclers_for_requests();

-- Also test with a simple query to see if the recycler is in the results
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  (heartbeat_at > NOW() - INTERVAL '5 minutes') as heartbeat_recent
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';
