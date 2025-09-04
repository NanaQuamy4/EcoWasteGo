-- Simple fix: Remove the admin notification creation from auto-offline function
-- This prevents the admin_id constraint violation

CREATE OR REPLACE FUNCTION auto_set_inactive_recyclers_offline()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Set recyclers offline if they haven't sent heartbeat in last 5 minutes
  UPDATE recyclers 
  SET 
    is_online = false,
    is_available = false,
    session_id = NULL
  WHERE 
    is_online = true 
    AND heartbeat_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the update to console (no database notification to avoid admin_id constraint)
  -- The cron job will log this information externally
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_set_inactive_recyclers_offline() TO authenticated;
