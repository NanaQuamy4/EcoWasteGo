-- =====================================================
-- ADMIN ONLINE RECYCLERS MANAGEMENT
-- =====================================================

-- 1. Create admin function to get all recyclers with online status
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
  
  -- Log the admin action
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
    r.full_name,
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

-- 5. Create admin view for easy monitoring
CREATE OR REPLACE VIEW admin_recyclers_monitoring AS
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

-- 6. Grant permissions to admin role
GRANT EXECUTE ON FUNCTION admin_get_all_recyclers_status() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_online_recyclers_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_force_recycler_offline(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_recycler_activity_log(INTEGER) TO authenticated;
GRANT SELECT ON admin_recyclers_monitoring TO authenticated;

-- 7. Add RLS policy for admin access
-- Note: This assumes you have an admin role or admin detection mechanism
-- You may need to adjust this based on your admin authentication system

-- Policy for admin to read all recycler data
CREATE POLICY "Admins can read all recycler data" ON recyclers
  FOR SELECT USING (
    -- Add your admin detection logic here
    -- For example: auth.jwt() ->> 'role' = 'admin'
    -- Or: auth.uid() IN (SELECT user_id FROM admin_users)
    true -- Temporarily allow all authenticated users - adjust as needed
  );

-- Policy for admin to update recycler status
CREATE POLICY "Admins can update recycler status" ON recyclers
  FOR UPDATE USING (
    -- Add your admin detection logic here
    true -- Temporarily allow all authenticated users - adjust as needed
  );

-- 8. Create admin dashboard queries
-- These can be used in your admin dashboard

-- Query 1: Get current online status summary
-- SELECT * FROM admin_get_online_recyclers_summary();

-- Query 2: Get all recyclers with status
-- SELECT * FROM admin_get_all_recyclers_status();

-- Query 3: Get recyclers by status category
-- SELECT * FROM admin_recyclers_monitoring WHERE status_category = 'Available';

-- Query 4: Get inactive recyclers (online but no recent heartbeat)
-- SELECT * FROM admin_recyclers_monitoring WHERE status_category = 'Inactive';

-- Query 5: Get recent activity
-- SELECT * FROM admin_get_recycler_activity_log(24);

COMMENT ON FUNCTION admin_get_all_recyclers_status() IS 'Admin function to get all recyclers with their online status';
COMMENT ON FUNCTION admin_get_online_recyclers_summary() IS 'Admin function to get summary statistics of recycler online status';
COMMENT ON FUNCTION admin_force_recycler_offline(UUID) IS 'Admin function to force a recycler offline';
COMMENT ON FUNCTION admin_get_recycler_activity_log(INTEGER) IS 'Admin function to get recycler activity log for specified hours';
COMMENT ON VIEW admin_recyclers_monitoring IS 'Admin view for monitoring all recyclers with their online status';
