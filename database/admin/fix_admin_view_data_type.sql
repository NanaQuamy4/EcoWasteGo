-- Fix admin_recyclers_monitoring view data type mismatch
-- This resolves the "cannot change data type of view column" error

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS admin_recyclers_monitoring;

-- Step 2: Recreate the view with explicit casting to ensure consistent data types
CREATE OR REPLACE VIEW admin_recyclers_monitoring AS
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
    WHEN r.verification_status != 'approved' THEN 'Unverified'::TEXT
    WHEN r.is_online = false THEN 'Offline'::TEXT
    WHEN r.heartbeat_at < NOW() - INTERVAL '5 minutes' THEN 'Inactive'::TEXT
    WHEN r.is_available = false THEN 'Busy'::TEXT
    ELSE 'Available'::TEXT
  END as status_category,
  CASE 
    WHEN r.heartbeat_at > NOW() - INTERVAL '1 minute' THEN 'Active'::TEXT
    WHEN r.heartbeat_at > NOW() - INTERVAL '5 minutes' THEN 'Online'::TEXT
    ELSE 'Offline'::TEXT
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

-- Step 3: Grant permissions
GRANT SELECT ON admin_recyclers_monitoring TO authenticated;

-- Step 4: Test the view
SELECT 'Testing admin_recyclers_monitoring view...' as info;
SELECT COUNT(*) as recycler_count FROM admin_recyclers_monitoring;

-- Step 5: Test the admin functions
SELECT 'Testing admin functions...' as info;

-- Test admin_get_all_recyclers_status function
SELECT COUNT(*) as function_result_count FROM admin_get_all_recyclers_status();

-- Test admin_get_online_recyclers_summary function  
SELECT * FROM admin_get_online_recyclers_summary();

SELECT 'SUCCESS: admin_recyclers_monitoring view recreated with consistent data types!' as status;
