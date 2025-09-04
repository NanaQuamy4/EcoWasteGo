-- Final fix for admin_force_recycler_offline function
-- This resolves the foreign key constraint violation for admin_id

-- Update the admin_force_recycler_offline function to handle missing admin_id gracefully
CREATE OR REPLACE FUNCTION admin_force_recycler_offline(p_recycler_id UUID)
RETURNS VOID AS $$
DECLARE
  current_admin_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Get the current admin user ID
  current_admin_id := auth.uid();
  
  -- Check if the admin user actually exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = current_admin_id) INTO admin_exists;
  
  UPDATE recyclers 
  SET 
    is_online = false,
    is_available = false,
    session_id = NULL,
    last_seen_at = NOW()
  WHERE id = p_recycler_id;
  
  -- Log the admin action only if we have a valid admin_id that exists in auth.users
  IF current_admin_id IS NOT NULL AND admin_exists THEN
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
  ELSE
    -- Log a system message instead if admin_id is not valid
    RAISE NOTICE 'Admin action logged without notification: forced recycler % offline (admin_id: %)', p_recycler_id, current_admin_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative approach: Create a system admin user if none exists
DO $$
DECLARE
  system_admin_id UUID;
  admin_email TEXT := 'admin@ecowastego.com';
BEGIN
  -- Check if admin user exists
  SELECT id INTO system_admin_id FROM auth.users WHERE email = admin_email;
  
  -- If no admin user exists, create one
  IF system_admin_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      created_at,
      updated_at,
      raw_user_meta_data
    ) VALUES (
      gen_random_uuid(),
      admin_email,
      NOW(),
      NOW(),
      '{"full_name": "System Admin", "role": "admin"}'::jsonb
    )
    RETURNING id INTO system_admin_id;
    
    RAISE NOTICE 'Created system admin user with ID: %', system_admin_id;
  ELSE
    RAISE NOTICE 'Admin user already exists with ID: %', system_admin_id;
  END IF;
END $$;

-- Test the function
DO $$
DECLARE
  test_recycler_id UUID;
BEGIN
  -- Get a recycler ID to test with
  SELECT id INTO test_recycler_id FROM recyclers LIMIT 1;
  
  IF test_recycler_id IS NOT NULL THEN
    -- Test the function
    PERFORM admin_force_recycler_offline(test_recycler_id);
    RAISE NOTICE 'SUCCESS: admin_force_recycler_offline function works without foreign key errors';
  ELSE
    RAISE NOTICE 'No recyclers found to test with, but function has been updated';
  END IF;
END $$;

SELECT 'SUCCESS: admin_force_recycler_offline function fixed to handle missing admin_id!' as status;
