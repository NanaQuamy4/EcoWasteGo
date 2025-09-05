-- FIX: Update set_recycler_offline function to NOT set is_available = false
-- The current function sets both is_online = false AND is_available = false
-- This causes recyclers to appear as "busy" when they go offline

-- Check current function
SELECT 'Current set_recycler_offline function:' as info;
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'set_recycler_offline';

-- Fix the function to only set is_online = false, NOT is_available
CREATE OR REPLACE FUNCTION set_recycler_offline(
  p_recycler_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE recyclers 
  SET 
    is_online = false,
    -- REMOVED: is_available = false,  -- This was causing the busy status!
    session_id = NULL
  WHERE id = p_recycler_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the auto_set_inactive_recyclers_offline function
CREATE OR REPLACE FUNCTION auto_set_inactive_recyclers_offline()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Set recyclers offline if they haven't sent heartbeat in last 5 minutes
  -- BUT DON'T set is_available = false (let them control their own availability)
  UPDATE recyclers 
  SET 
    is_online = false,
    -- REMOVED: is_available = false,  -- This was causing the busy status!
    session_id = NULL
  WHERE 
    is_online = true 
    AND heartbeat_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fixed function
SELECT 'Testing fixed set_recycler_offline function...' as info;

-- First, set recycler as available and online
UPDATE recyclers 
SET 
  is_online = true,
  is_available = true,
  heartbeat_at = NOW(),
  last_seen_at = NOW()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Check status before
SELECT 'Before set_offline - Status:' as info;
SELECT 
  id,
  full_name,
  is_online,
  is_available
FROM recyclers 
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Test the function
SELECT set_recycler_offline('e9e096bf-7c7b-4338-a619-124d7ae699b6'::UUID);

-- Check status after
SELECT 'After set_offline - Status:' as info;
SELECT 
  id,
  full_name,
  is_online,
  is_available
FROM recyclers 
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Set back to online and available
UPDATE recyclers 
SET 
  is_online = true,
  is_available = true,
  heartbeat_at = NOW(),
  last_seen_at = NOW()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Success message
SELECT '🎯 FIXED! set_recycler_offline no longer sets is_available = false!' as result;
