-- Create function to get available recyclers excluding those who rejected this customer
-- This function takes a customer_id parameter and excludes recyclers who have rejected this customer

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
    r.full_name,
    r.phone,
    r.truck_size,
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
    AND r.is_available = true
    AND r.heartbeat_at > NOW() - INTERVAL '10 minutes'
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
SELECT 'Testing get_available_recyclers_exclude_rejected...' as status;
-- This would be called with: SELECT * FROM get_available_recyclers_exclude_rejected('customer-uuid-here');
