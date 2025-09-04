-- Test direct status update to verify it works
-- This simulates what the app will do

-- First, let's see current pickup requests
SELECT 
  'Current Pickup Requests' as info,
  id,
  customer_id,
  recycler_id,
  status,
  created_at
FROM pickup_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- Test direct status update (simulate what the app does)
-- This should work regardless of current status
UPDATE pickup_requests 
SET 
  status = 'confirmed',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM pickup_requests 
  ORDER BY created_at DESC 
  LIMIT 1
)
RETURNING id, status, updated_at;

-- Check the result
SELECT 
  'Updated Request' as info,
  id,
  status,
  updated_at
FROM pickup_requests 
ORDER BY updated_at DESC 
LIMIT 1;
