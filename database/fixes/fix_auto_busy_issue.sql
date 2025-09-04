-- Check what's causing the recycler to be automatically set as busy
-- First, let's see the current status
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  last_seen_at,
  updated_at
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';

-- Check if there are any pickup requests that might be causing the issue
SELECT 
  id,
  status,
  recycler_id,
  created_at,
  updated_at
FROM pickup_requests 
WHERE recycler_id = (SELECT id FROM recyclers WHERE email = 'nquamy7@gmail.com')
ORDER BY created_at DESC
LIMIT 10;

-- Force set the recycler as available and online
UPDATE recyclers 
SET 
  is_online = true,
  is_available = true,
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
  heartbeat_at,
  last_seen_at
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';

-- Test the RPC function
SELECT * FROM get_available_recyclers_for_requests();
