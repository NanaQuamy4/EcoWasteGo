-- Fix the auto_set_inactive_recyclers_offline function to handle admin_id constraint
-- The function was failing because it tried to insert into admin_notifications without an admin_id

-- Option 1: Modify the function to get a system admin ID or skip notification
CREATE OR REPLACE FUNCTION auto_set_inactive_recyclers_offline()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
  system_admin_id UUID;
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
  
  -- Only create notification if we have recyclers to set offline and can find a system admin
  IF updated_count > 0 THEN
    -- Try to get a system admin ID (first admin user)
    SELECT id INTO system_admin_id 
    FROM auth.users 
    WHERE email LIKE '%admin%' 
    LIMIT 1;
    
    -- If we found an admin, create the notification
    IF system_admin_id IS NOT NULL THEN
      INSERT INTO admin_notifications (
        admin_id,
        title,
        message,
        type,
        priority,
        created_at
      ) VALUES (
        system_admin_id,
        'Auto-Offline Update',
        'Set ' || updated_count || ' inactive recyclers offline',
        'system',
        'medium',
        NOW()
      );
    END IF;
  END IF;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative Option 2: Create a separate system_logs table for system notifications
-- This would be better for system-generated notifications that don't need admin_id

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Alternative function that uses system_logs instead of admin_notifications
CREATE OR REPLACE FUNCTION auto_set_inactive_recyclers_offline_v2()
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
  
  -- Log the update in system_logs (no admin_id required)
  INSERT INTO system_logs (
    event_type,
    title,
    message,
    metadata
  ) VALUES (
    'auto_offline',
    'Auto-Offline Update',
    'Set ' || updated_count || ' inactive recyclers offline',
    jsonb_build_object('updated_count', updated_count, 'timestamp', NOW())
  );
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_set_inactive_recyclers_offline() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_set_inactive_recyclers_offline_v2() TO authenticated;
GRANT SELECT, INSERT ON system_logs TO authenticated;
