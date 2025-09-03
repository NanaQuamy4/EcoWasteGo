-- Fix auto-offline function to respect manual recycler control
-- This ensures recyclers who manually set themselves online stay online
-- Only sets offline if they haven't sent heartbeat AND haven't manually set themselves online recently

-- Drop the existing auto-offline function
DROP FUNCTION IF EXISTS auto_set_inactive_recyclers_offline();

-- Create new auto-offline function that respects manual control
CREATE OR REPLACE FUNCTION auto_set_inactive_recyclers_offline()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Only set recyclers offline if:
  -- 1. They haven't sent heartbeat in last 10 minutes (increased from 5)
  -- 2. They haven't manually updated their status in the last 5 minutes
  -- This gives recyclers more control and prevents auto-offline from overriding manual online status
  
  UPDATE recyclers 
  SET 
    is_online = false,
    is_available = false,
    session_id = NULL
  WHERE 
    is_online = true 
    AND heartbeat_at < NOW() - INTERVAL '10 minutes'  -- Increased timeout
    AND updated_at < NOW() - INTERVAL '5 minutes';    -- Respect manual updates
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Only log if we actually updated someone
  IF updated_count > 0 THEN
    INSERT INTO admin_notifications (
      title,
      message,
      type,
      created_at
    ) VALUES (
      'Auto-Offline Update',
      'Set ' || updated_count || ' inactive recyclers offline (respecting manual control)',
      'system',
      NOW()
    );
  END IF;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_set_inactive_recyclers_offline() TO authenticated;

-- Add comment explaining the new behavior
COMMENT ON FUNCTION auto_set_inactive_recyclers_offline() IS 
'Automatically sets recyclers offline only if they are truly inactive (no heartbeat for 10+ minutes AND no manual status updates for 5+ minutes). Respects manual recycler control.';

-- Test the function
SELECT auto_set_inactive_recyclers_offline() as recyclers_set_offline;
