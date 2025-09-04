-- =====================================================
-- FIX ADMIN FUNCTIONS - DROP VIEW FIRST
-- =====================================================

-- The error occurs because we're trying to change the data type of an existing view
-- We need to drop the view first, then recreate it

-- Drop existing functions and view
DROP FUNCTION IF EXISTS admin_get_all_recyclers_status();
DROP FUNCTION IF EXISTS admin_get_online_recyclers_summary();
DROP FUNCTION IF EXISTS admin_force_recycler_offline(UUID);
DROP FUNCTION IF EXISTS admin_get_recycler_activity_log(INTEGER);
DROP VIEW IF EXISTS admin_recyclers_monitoring;  -- Drop the view first!

-- 1. Create admin function to get all recyclers with online status
-- Using explicit casting to handle mixed column types
CREATE OR REPLACE FUNCTION admin_get_all_recyclers_status()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  truck_size TEXT,
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
    r.full_name::TEXT,
    r.phone::TEXT,
    r.email::TEXT,
    r.truck_size::TEXT,
    r.rating,
    r.verification_status::TEXT,
    r.is_available,
    r.is_online,
    r.last_seen_at,
    r.heartbeat_at,
    r.session_id::TEXT,
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

-- 2. Create admin function to get online recyclers summary
CREATE OR REPLACE FUNCTION admin_get_online_recyclers_summary()
RETURNS TABLE (
  total_recyclers INTEGER,
  verified_recyclers INTEGER,
  online_recyclers INTEGER,
  available_recyclers INTEGER,
  busy_recyclers INTEGER,
  offline_recyclers INTEGER,
  inactive_recyclers INTEGER,
  unverified_recyclers INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM recyclers) as total_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE verification_status = 'approved') as verified_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE is_online = true AND heartbeat_at > NOW() - INTERVAL '5 minutes') as online_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE is_online = true AND is_available = true AND heartbeat_at > NOW() - INTERVAL '5 minutes') as available_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE is_online = true AND is_available = false AND heartbeat_at > NOW() - INTERVAL '5 minutes') as busy_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE is_online = false) as offline_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE is_online = true AND heartbeat_at < NOW() - INTERVAL '5 minutes') as inactive_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE verification_status != 'approved') as unverified_recyclers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create admin function to force set recycler offline
CREATE OR REPLACE FUNCTION admin_force_recycler_offline(p_recycler_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE recyclers 
  SET 
    is_online = false,
    is_available = false,
    session_id = NULL,
    last_seen_at = NOW()
  WHERE id = p_recycler_id;
  
  -- Log the admin action (only if admin_notifications table exists)
  BEGIN
    INSERT INTO admin_notifications (
      title,
      message,
      type,
      created_at
    ) VALUES (
      'Admin Action',
      'Admin forced recycler offline: ' || p_recycler_id,
      'admin_action',
      NOW()
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- admin_notifications table doesn't exist, skip logging
      NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create admin function to get recycler activity log
CREATE OR REPLACE FUNCTION admin_get_recycler_activity_log(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  recycler_id UUID,
  full_name TEXT,
  action_type TEXT,
  event_timestamp TIMESTAMP WITH TIME ZONE,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as recycler_id,
    r.full_name::TEXT,
    'Status Change' as action_type,
    r.last_seen_at as event_timestamp,
    CASE 
      WHEN r.is_online = true AND r.is_available = true THEN 'Went Online & Available'
      WHEN r.is_online = true AND r.is_available = false THEN 'Went Online & Busy'
      WHEN r.is_online = false THEN 'Went Offline'
      ELSE 'Status Updated'
    END as details
  FROM recyclers r
  WHERE r.last_seen_at > NOW() - INTERVAL '1 hour' * p_hours
  ORDER BY r.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create admin view for easy monitoring (now that we've dropped the old one)
CREATE VIEW admin_recyclers_monitoring AS
SELECT 
  r.id,
  r.full_name::TEXT as full_name,
  r.phone::TEXT as phone,
  r.email::TEXT as email,
  r.truck_size::TEXT as truck_size,
  r.rating,
  r.verification_status::TEXT as verification_status,
  r.is_available,
  r.is_online,
  r.last_seen_at,
  r.heartbeat_at,
  r.session_id::TEXT as session_id,
  r.created_at,
  CASE 
    WHEN r.verification_status != 'approved' THEN 'Unverified'
    WHEN r.is_online = false THEN 'Offline'
    WHEN r.heartbeat_at < NOW() - INTERVAL '5 minutes' THEN 'Inactive'
    WHEN r.is_available = false THEN 'Busy'
    ELSE 'Available'
  END as status_category,
  CASE 
    WHEN r.heartbeat_at > NOW() - INTERVAL '1 minute' THEN 'Active'
    WHEN r.heartbeat_at > NOW() - INTERVAL '5 minutes' THEN 'Online'
    ELSE 'Offline'
  END as connection_status,
  EXTRACT(EPOCH FROM (NOW() - r.heartbeat_at))/60 as minutes_since_heartbeat
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

-- 6. Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_all_recyclers_status() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_online_recyclers_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_force_recycler_offline(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_recycler_activity_log(INTEGER) TO authenticated;
GRANT SELECT ON admin_recyclers_monitoring TO authenticated;

-- 7. Add RLS policy for admin access (temporarily allow all authenticated users)
-- You should update this based on your admin authentication system
DROP POLICY IF EXISTS "Admins can read all recycler data" ON recyclers;
DROP POLICY IF EXISTS "Admins can update recycler status" ON recyclers;

CREATE POLICY "Admins can read all recycler data" ON recyclers
  FOR SELECT USING (true); -- Temporarily allow all authenticated users

CREATE POLICY "Admins can update recycler status" ON recyclers
  FOR UPDATE USING (true); -- Temporarily allow all authenticated users

-- Add comments
COMMENT ON FUNCTION admin_get_all_recyclers_status() IS 'Admin function to get all recyclers with their online status';
COMMENT ON FUNCTION admin_get_online_recyclers_summary() IS 'Admin function to get summary statistics of recycler online status';
COMMENT ON FUNCTION admin_force_recycler_offline(UUID) IS 'Admin function to force a recycler offline';
COMMENT ON FUNCTION admin_get_recycler_activity_log(INTEGER) IS 'Admin function to get recycler activity log for specified hours';
COMMENT ON VIEW admin_recyclers_monitoring IS 'Admin view for monitoring all recyclers with their online status';
