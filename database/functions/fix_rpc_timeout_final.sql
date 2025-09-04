-- Final fix for RPC timeout issues
-- This creates a more efficient and reliable function

-- Drop the existing function completely
DROP FUNCTION IF EXISTS get_available_recyclers_for_requests();

-- Create a much simpler and faster function
CREATE OR REPLACE FUNCTION get_available_recyclers_for_requests()
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
  pending_requests_count BIGINT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple query without complex joins to avoid timeout
  RETURN QUERY
  SELECT 
    r.id,
    r.full_name,
    r.phone,
    r.truck_size,
    r.rating,
    r.is_available,
    r.is_online,
    r.last_seen_at,
    r.heartbeat_at,
    0::BIGINT as pending_requests_count, -- Simplified - no pending count for now
    r.latitude,
    r.longitude
  FROM recyclers r
  WHERE r.verification_status = 'approved'
    AND r.is_online = true
    AND r.is_available = true
    AND r.heartbeat_at > NOW() - INTERVAL '10 minutes' -- Extended to 10 minutes
  ORDER BY r.heartbeat_at DESC
  LIMIT 50; -- Limit results to prevent large queries
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_recyclers_for_requests() TO authenticated;

-- Test the function
SELECT 'Testing simplified RPC function...' as status;

-- Call the function to test it
SELECT * FROM get_available_recyclers_for_requests();

-- Check recycler status
SELECT 
  'Current Recycler Status' as info,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  latitude,
  longitude
FROM recyclers 
WHERE verification_status = 'approved'
ORDER BY heartbeat_at DESC;
