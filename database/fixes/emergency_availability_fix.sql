-- EMERGENCY FIX: Force recycler to be available and online
-- This will immediately fix any availability issues

-- Step 1: Check current status
SELECT 'Current recycler status:' as info;
SELECT 
  id,
  full_name,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  last_seen_at,
  CASE 
    WHEN is_online = false THEN 'Offline'
    WHEN is_available = true THEN 'Available'
    WHEN is_available = false THEN 'Busy'
    ELSE 'Unknown'
  END as status
FROM recyclers 
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Step 2: Force set recycler as online and available
UPDATE recyclers 
SET 
  is_online = true,
  is_available = true,
  heartbeat_at = NOW(),
  last_seen_at = NOW(),
  updated_at = NOW()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Step 3: Verify the fix
SELECT 'After fix - recycler status:' as info;
SELECT 
  id,
  full_name,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  last_seen_at,
  CASE 
    WHEN is_online = false THEN 'Offline'
    WHEN is_available = true THEN 'Available'
    WHEN is_available = false THEN 'Busy'
    ELSE 'Unknown'
  END as status
FROM recyclers 
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Step 4: Test the RPC functions
SELECT 'Testing RPC functions...' as info;
SELECT COUNT(*) as online_recyclers_count FROM get_online_recyclers();
SELECT COUNT(*) as available_recyclers_count FROM get_available_recyclers_for_requests();

-- Step 5: Test customer app RPC
SELECT 'Testing customer app RPC...' as info;
SELECT COUNT(*) as customer_app_count FROM get_available_recyclers_exclude_rejected('10740f49-fb42-4773-8015-cc3774dc523a'::UUID);

-- Success message
SELECT '🚨 EMERGENCY FIX APPLIED! Your recycler should now be available!' as result;
