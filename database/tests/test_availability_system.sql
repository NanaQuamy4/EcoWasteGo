-- Test the availability system to ensure it's working correctly

-- First, run the availability fix
\i fix_recycler_availability_final.sql

-- Check current recycler status
SELECT 
  'Final Status Check' as info,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  latitude,
  longitude,
  (SELECT COUNT(*) FROM pickup_requests 
   WHERE recycler_id = recyclers.id 
   AND status IN ('accepted', 'in_progress', 'confirmed')) as pending_requests
FROM recyclers 
WHERE verification_status = 'approved'
ORDER BY heartbeat_at DESC;

-- Test the new RPC function
SELECT 'Testing get_available_recyclers_simple...' as status;
SELECT * FROM get_available_recyclers_simple();

-- Test availability calculation for specific recycler
SELECT 
  'Availability Test' as info,
  full_name,
  email,
  calculate_recycler_availability(id) as calculated_availability,
  is_available as current_availability,
  is_online,
  verification_status = 'approved' as is_verified,
  heartbeat_at > NOW() - INTERVAL '10 minutes' as has_recent_heartbeat,
  (SELECT COUNT(*) FROM pickup_requests 
   WHERE recycler_id = recyclers.id 
   AND status IN ('accepted', 'in_progress', 'confirmed')) as pending_requests
FROM recyclers 
WHERE verification_status = 'approved'
ORDER BY heartbeat_at DESC;
