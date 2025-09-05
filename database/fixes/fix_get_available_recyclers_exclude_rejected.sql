-- Fix get_available_recyclers_exclude_rejected function to match our availability fixes
-- This function is called by the customer app and needs to respect manual availability

-- Drop and recreate the function with proper data types and relaxed heartbeat
DROP FUNCTION IF EXISTS get_available_recyclers_exclude_rejected(UUID);

CREATE OR REPLACE FUNCTION get_available_recyclers_exclude_rejected(p_customer_id UUID)
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
) 
LANGUAGE plpgsql
AS $$
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
    AND r.is_available = true  -- Only show manually available recyclers
    -- Relaxed heartbeat requirement (30 minutes instead of 10)
    AND (r.heartbeat_at IS NULL OR r.heartbeat_at > NOW() - INTERVAL '30 minutes')
    -- Exclude recyclers who have rejected this customer
    AND r.id NOT IN (
      SELECT DISTINCT pr.recycler_id 
      FROM pickup_requests pr 
      WHERE pr.customer_id = p_customer_id 
        AND pr.status = 'rejected'
        AND pr.recycler_id IS NOT NULL
    )
  ORDER BY r.heartbeat_at DESC
  LIMIT 50;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_available_recyclers_exclude_rejected(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_recyclers_exclude_rejected(UUID) TO anon;

-- Test the function
SELECT 'Testing updated get_available_recyclers_exclude_rejected...' as status;
SELECT COUNT(*) as available_recyclers_count FROM get_available_recyclers_exclude_rejected('00000000-0000-0000-0000-000000000000'::UUID);

-- Success message
SELECT '✅ get_available_recyclers_exclude_rejected function updated with relaxed heartbeat and manual availability!' as result;
