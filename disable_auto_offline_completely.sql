-- Completely disable auto-offline functionality
-- This gives recyclers 100% manual control over their online/offline status

-- Drop the auto-offline function entirely
DROP FUNCTION IF EXISTS auto_set_inactive_recyclers_offline();

-- Create a dummy function that does nothing (in case other code calls it)
CREATE OR REPLACE FUNCTION auto_set_inactive_recyclers_offline()
RETURNS INTEGER AS $$
BEGIN
  -- Do nothing - recyclers have full manual control
  -- This function exists only to prevent errors if called
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_set_inactive_recyclers_offline() TO authenticated;

-- Add comment
COMMENT ON FUNCTION auto_set_inactive_recyclers_offline() IS 
'Auto-offline functionality disabled. Recyclers have full manual control over their online/offline status.';

-- Test the function (should return 0)
SELECT auto_set_inactive_recyclers_offline() as recyclers_set_offline;
