-- Fix recycler availability by removing strict heartbeat requirement
-- This allows recyclers to stay discoverable even if they haven't sent recent heartbeats

-- First, drop the existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS get_online_recyclers();
DROP FUNCTION IF EXISTS get_available_recyclers_for_requests();

-- Option 1: Update get_online_recyclers to be less strict about heartbeat
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
    -- Removed strict heartbeat requirement - recyclers stay discoverable as long as they're online
    -- AND r.heartbeat_at > NOW() - INTERVAL '5 minutes'
    AND (r.heartbeat_at IS NULL OR r.heartbeat_at > NOW() - INTERVAL '30 minutes'); -- More lenient: 30 minutes
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_online_recyclers() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_online_recyclers() IS 'Get online recyclers with relaxed heartbeat requirement (30 minutes instead of 5)';

-- Option 2: Also update get_available_recyclers_for_requests if it exists
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
    AND r.is_available = true
    -- Also relaxed heartbeat requirement here
    AND (r.heartbeat_at IS NULL OR r.heartbeat_at > NOW() - INTERVAL '30 minutes')
  ORDER BY r.rating DESC, r.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_available_recyclers_for_requests() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_available_recyclers_for_requests() IS 'Get available recyclers for requests with relaxed heartbeat requirement (30 minutes instead of 5)';

-- Test the functions
SELECT 'Testing updated functions...' as info;
SELECT COUNT(*) as online_recyclers_count FROM get_online_recyclers();
SELECT COUNT(*) as available_recyclers_count FROM get_available_recyclers_for_requests();
