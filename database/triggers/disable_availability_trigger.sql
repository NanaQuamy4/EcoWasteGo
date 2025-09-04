-- Temporarily disable the trigger that's causing the auto-busy issue
DROP TRIGGER IF EXISTS trigger_update_recycler_availability ON pickup_requests;

-- Force set the recycler as available
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

-- Check if there are any remaining triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'recyclers';
