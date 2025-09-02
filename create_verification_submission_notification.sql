-- Create notification system for recycler verification form submission
-- This will notify recyclers when they submit their verification form

-- Create trigger function to notify recycler when verification form is submitted
CREATE OR REPLACE FUNCTION notify_verification_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification when verification status changes to 'pending'
  -- This happens when a recycler submits their verification form
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status 
     AND NEW.verification_status = 'pending' THEN
    
    -- Create notification for the recycler
    PERFORM create_notification(
      NEW.id,
      '📋 Verification Form Received',
      'Thank you for submitting your recycler verification form! We have received your application and our admin team will review it within 24-48 hours. You will receive another notification once the review is complete.',
      'verification_submitted',
      jsonb_build_object(
        'action_type', 'view_status',
        'deep_link', '/recycler-screens/RecyclerEditProfileScreen',
        'button_text', 'View Status'
      )
    );
    
    RAISE NOTICE 'Verification submission notification created for user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_verification_submission ON recyclers;

-- Create trigger for verification form submission
CREATE TRIGGER trigger_notify_verification_submission
  AFTER UPDATE ON recyclers
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_submission();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION notify_verification_submission() TO authenticated;

-- Test the notification system
SELECT 'Verification submission notification system created successfully!' as status;

-- Optional: Test with a sample notification (uncomment to test)
-- SELECT create_notification(
--   (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'recycler' LIMIT 1),
--   '📋 Verification Form Received',
--   'Thank you for submitting your recycler verification form! We have received your application and our admin team will review it within 24-48 hours.',
--   'verification_submitted',
--   jsonb_build_object(
--     'action_type', 'view_status',
--     'deep_link', '/recycler-screens/RecyclerEditProfileScreen',
--     'button_text', 'View Status'
--   )
-- ) as test_notification_id;
