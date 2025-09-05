-- Disable automatic busy status system completely
-- This gives recyclers full manual control over their availability status

-- Step 1: Check current triggers and functions
SELECT 'Current triggers on pickup_requests:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'pickup_requests'
  AND (trigger_name LIKE '%availability%' OR trigger_name LIKE '%busy%');

-- Step 2: Drop all availability-related triggers
DROP TRIGGER IF EXISTS trigger_update_recycler_availability ON pickup_requests;
DROP TRIGGER IF EXISTS trigger_update_availability ON pickup_requests;
DROP TRIGGER IF EXISTS trigger_availability_update ON pickup_requests;

-- Step 3: Drop availability-related functions
DROP FUNCTION IF EXISTS update_recycler_availability_based_on_requests();
DROP FUNCTION IF EXISTS update_specific_recycler_availability(UUID);
DROP FUNCTION IF EXISTS update_all_recyclers_availability();

-- Step 4: Create a simple function that does NOT automatically set busy status
-- This function only provides information, doesn't change availability
CREATE OR REPLACE FUNCTION get_recycler_pending_requests_count(recycler_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO pending_count
  FROM pickup_requests 
  WHERE recycler_id = recycler_id_param
    AND status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress');
  
  RETURN pending_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_recycler_pending_requests_count(UUID) TO authenticated;

-- Step 5: Update get_available_recyclers_for_requests to respect manual availability
CREATE OR REPLACE FUNCTION get_available_recyclers_for_requests()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  truck_size TEXT,
  rating DECIMAL,
  verification_status TEXT,
  is_available BOOLEAN,
  is_online BOOLEAN,
  pending_requests_count BIGINT,
  last_seen_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.full_name::TEXT,
    r.email::TEXT,
    r.phone::TEXT,
    r.truck_size::TEXT,
    r.rating,
    r.verification_status::TEXT,
    r.is_available,
    r.is_online,
    COALESCE(pr_counts.pending_count, 0) as pending_requests_count,
    r.last_seen_at,
    r.heartbeat_at
  FROM recyclers r
  LEFT JOIN (
    SELECT 
      recycler_id,
      COUNT(*) as pending_count
    FROM pickup_requests 
    WHERE status IN ('accepted', 'in_progress', 'confirmed')
    GROUP BY recycler_id
  ) pr_counts ON r.id = pr_counts.recycler_id
  WHERE r.verification_status = 'approved'
    AND r.is_online = true
    AND r.is_available = true  -- Only show manually available recyclers
    -- Relaxed heartbeat requirement
    AND (r.heartbeat_at IS NULL OR r.heartbeat_at > NOW() - INTERVAL '30 minutes')
  ORDER BY r.rating DESC, r.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_available_recyclers_for_requests() TO authenticated;

-- Step 6: Update get_online_recyclers to respect manual availability
CREATE OR REPLACE FUNCTION get_online_recyclers()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  truck_size TEXT,
  rating DECIMAL,
  is_available BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.full_name::TEXT,
    r.phone::TEXT,
    r.truck_size::TEXT,
    r.rating,
    r.is_available,
    r.is_online,
    r.last_seen_at,
    r.heartbeat_at,
    r.latitude,
    r.longitude
  FROM recyclers r
  WHERE r.verification_status = 'approved'
    AND r.is_online = true
    -- Relaxed heartbeat requirement
    AND (r.heartbeat_at IS NULL OR r.heartbeat_at > NOW() - INTERVAL '30 minutes');
    -- Note: We don't filter by is_available here - let the app decide
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_online_recyclers() TO authenticated;

-- Step 7: Force set all online recyclers as available (clear any busy status)
UPDATE recyclers 
SET 
  is_available = true,
  updated_at = NOW()
WHERE is_online = true;

-- Step 8: Test the functions
SELECT 'Testing updated functions...' as info;
SELECT COUNT(*) as online_recyclers_count FROM get_online_recyclers();
SELECT COUNT(*) as available_recyclers_count FROM get_available_recyclers_for_requests();

-- Step 9: Show current recycler status
SELECT 'Current recycler status:' as info;
SELECT 
  id,
  full_name,
  is_online,
  is_available,
  CASE 
    WHEN is_online = false THEN 'Offline'
    WHEN is_available = true THEN 'Available'
    WHEN is_available = false THEN 'Busy (Manual)'
    ELSE 'Unknown'
  END as status
FROM recyclers 
WHERE is_online = true
ORDER BY full_name;

-- Success message
SELECT '✅ Automatic busy system disabled! Recyclers now have full manual control over availability.' as result;
