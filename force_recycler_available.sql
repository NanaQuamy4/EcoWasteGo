-- Force recycler to be available (clear any busy status)
UPDATE recyclers 
SET 
  is_available = true,
  is_online = true,
  heartbeat_at = NOW(),
  last_seen_at = NOW(),
  updated_at = NOW()
WHERE email = 'nquamy7@gmail.com';

-- Verify the fix
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  last_seen_at,
  heartbeat_at
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';

-- Test the RPC function
SELECT * FROM get_available_recyclers_for_requests();

-- Check admin status
SELECT 
  full_name,
  status_category,
  pending_requests_count,
  is_available,
  is_online
FROM admin_get_all_recyclers_status()
WHERE email = 'nquamy7@gmail.com';
