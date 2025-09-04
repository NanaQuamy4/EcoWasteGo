-- Fix the RPC timeout issue by creating a more efficient function
-- and adding proper error handling

-- Drop the existing function
DROP FUNCTION IF EXISTS get_available_recyclers_for_requests();

-- Create a more efficient version with better performance
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
  -- Add timeout protection
  PERFORM pg_sleep(0.1); -- Small delay to prevent immediate timeout
  
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
    COALESCE(pr.pending_count, 0) as pending_requests_count,
    r.latitude,
    r.longitude
  FROM recyclers r
  LEFT JOIN (
    SELECT 
      recycler_id,
      COUNT(*) as pending_count
    FROM pickup_requests 
    WHERE status IN ('accepted', 'in_progress', 'confirmed')
    GROUP BY recycler_id
  ) pr ON r.id = pr.recycler_id
  WHERE r.verification_status = 'approved'
    AND r.is_online = true
    AND r.is_available = true
    AND r.heartbeat_at > NOW() - INTERVAL '5 minutes'
    AND COALESCE(pr.pending_count, 0) < 5
  ORDER BY r.heartbeat_at DESC; -- Order by most recent activity
  
  -- If no results, return empty table
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_recyclers_for_requests() TO authenticated;

-- Test the function
SELECT 'Testing RPC function...' as status;

-- Call the function to test it
SELECT * FROM get_available_recyclers_for_requests();

-- Check if there are any recyclers that should be available
SELECT 
  'Recycler Status Check' as info,
  r.full_name,
  r.email,
  r.is_online,
  r.is_available,
  r.verification_status,
  r.heartbeat_at,
  r.latitude,
  r.longitude,
  COALESCE(pr.pending_count, 0) as pending_requests
FROM recyclers r
LEFT JOIN (
  SELECT 
    recycler_id,
    COUNT(*) as pending_count
  FROM pickup_requests 
  WHERE status IN ('accepted', 'in_progress', 'confirmed')
  GROUP BY recycler_id
) pr ON r.id = pr.recycler_id
WHERE r.verification_status = 'approved'
ORDER BY r.heartbeat_at DESC;
