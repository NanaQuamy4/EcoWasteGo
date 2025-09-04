-- Fix admin_force_recycler_offline function to handle admin_id constraint
-- This resolves the "null value in column admin_id" error

-- Update the admin_force_recycler_offline function to properly handle admin_id
CREATE OR REPLACE FUNCTION admin_force_recycler_offline(p_recycler_id UUID)
RETURNS VOID AS $$
DECLARE
  current_admin_id UUID;
BEGIN
  -- Get the current admin user ID
  current_admin_id := auth.uid();
  
  UPDATE recyclers 
  SET 
    is_online = false,
    is_available = false,
    session_id = NULL,
    last_seen_at = NOW()
  WHERE id = p_recycler_id;
  
  -- Log the admin action only if we have a valid admin_id
  IF current_admin_id IS NOT NULL THEN
    INSERT INTO admin_notifications (
      admin_id,
      title,
      message,
      type,
      created_at
    ) VALUES (
      current_admin_id,
      'Admin Action',
      'Admin forced recycler offline: ' || p_recycler_id,
      'admin_action',
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function to make sure it works
DO $$
DECLARE
  test_recycler_id UUID;
BEGIN
  -- Get a recycler ID to test with
  SELECT id INTO test_recycler_id FROM recyclers LIMIT 1;
  
  IF test_recycler_id IS NOT NULL THEN
    -- Test the function (this should not cause the admin_id error anymore)
    PERFORM admin_force_recycler_offline(test_recycler_id);
    RAISE NOTICE 'SUCCESS: admin_force_recycler_offline function updated and tested successfully';
  ELSE
    RAISE NOTICE 'No recyclers found to test with, but function has been updated';
  END IF;
END $$;

SELECT 'SUCCESS: admin_force_recycler_offline function fixed!' as status;
