-- =====================================================
-- FIX ADMIN FUNCTIONS TYPE MISMATCH
-- =====================================================

-- Drop and recreate the admin function with correct data types
DROP FUNCTION IF EXISTS admin_get_all_recyclers_status();

-- 1. Create admin function to get all recyclers with online status
CREATE OR REPLACE FUNCTION admin_get_all_recyclers_status()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  truck_size VARCHAR(100),  -- Changed from TEXT to VARCHAR(100)
  rating NUMERIC,
  verification_status TEXT,
  is_available BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  heartbeat_at TIMESTAMP WITH TIME ZONE,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  status_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.full_name,
    r.phone,
    r.email,
    r.truck_size,
    r.rating,
    r.verification_status,
    r.is_available,
    r.is_online,
    r.last_seen_at,
    r.heartbeat_at,
    r.session_id,
    r.created_at,
    CASE 
      WHEN r.verification_status != 'approved' THEN 'Unverified'
      WHEN r.is_online = false THEN 'Offline'
      WHEN r.heartbeat_at < NOW() - INTERVAL '5 minutes' THEN 'Inactive'
      WHEN r.is_available = false THEN 'Busy'
      ELSE 'Available'
    END as status_category
  FROM recyclers r
  ORDER BY 
    CASE 
      WHEN r.verification_status != 'approved' THEN 1
      WHEN r.is_online = false THEN 2
      WHEN r.heartbeat_at < NOW() - INTERVAL '5 minutes' THEN 3
      WHEN r.is_available = false THEN 4
      ELSE 5
    END DESC,
    r.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_get_all_recyclers_status() TO authenticated;

-- Test the function
-- SELECT * FROM admin_get_all_recyclers_status() LIMIT 5;
