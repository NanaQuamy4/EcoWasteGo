-- Fix recycler availability immediately
-- The recycler is online but showing isAvailable: false

-- First, check current recycler status
SELECT 
  'Current Recycler Status' as info,
  id,
  full_name,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  updated_at
FROM recyclers 
WHERE full_name LIKE '%Osei%' OR email = 'nquamy7@gmail.com';

-- Check pending requests for this recycler
SELECT 
  'Pending Requests Count' as info,
  COUNT(*) as pending_count
FROM pickup_requests 
WHERE recycler_id = (
  SELECT id FROM recyclers 
  WHERE full_name LIKE '%Osei%' OR email = 'nquamy7@gmail.com'
  LIMIT 1
) 
AND status IN ('pending', 'assigned');

-- Force set recycler as available (bypass all logic)
UPDATE recyclers 
SET 
  is_available = true,
  is_online = true,
  updated_at = NOW(),
  heartbeat_at = NOW()
WHERE full_name LIKE '%Osei%' OR email = 'nquamy7@gmail.com';

-- Verify the update
SELECT 
  'Updated Recycler Status' as info,
  id,
  full_name,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  updated_at
FROM recyclers 
WHERE full_name LIKE '%Osei%' OR email = 'nquamy7@gmail.com';

-- Test the RPC function
SELECT * FROM get_available_recyclers_simple();