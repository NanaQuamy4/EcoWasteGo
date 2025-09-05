-- Debug the RPC function to see what's causing the null error
-- This will help us understand why the customer app is getting null instead of an array

-- First, let's test the function directly
SELECT 'Testing get_available_recyclers_exclude_rejected with a test customer ID...' as info;

-- Test with a dummy customer ID
SELECT * FROM get_available_recyclers_exclude_rejected('00000000-0000-0000-0000-000000000000'::UUID);

-- Check if the function exists
SELECT 'Checking if function exists...' as info;
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'get_available_recyclers_exclude_rejected';

-- Check current recycler status
SELECT 'Current recycler status:' as info;
SELECT 
  id,
  full_name,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  CASE 
    WHEN is_online = false THEN 'Offline'
    WHEN is_available = true THEN 'Available'
    WHEN is_available = false THEN 'Busy'
    ELSE 'Unknown'
  END as status
FROM recyclers 
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Check if there are any pickup requests that might be causing the exclusion
SELECT 'Checking for rejected requests...' as info;
SELECT 
  pr.id,
  pr.customer_id,
  pr.recycler_id,
  pr.status,
  pr.created_at
FROM pickup_requests pr 
WHERE pr.recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
  AND pr.status = 'rejected';
