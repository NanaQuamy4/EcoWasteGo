-- Complete fix for verification notification triggers
-- This ensures all old triggers are removed and new ones are created correctly

-- Drop ALL existing verification-related triggers and functions
DROP TRIGGER IF EXISTS trigger_notify_verification_status ON recyclers;
DROP TRIGGER IF EXISTS trigger_notify_verification_submission ON recyclers;
DROP TRIGGER IF EXISTS trigger_notify_verification_changes ON recyclers;
DROP FUNCTION IF EXISTS notify_verification_status();
DROP FUNCTION IF EXISTS notify_verification_submission();
DROP FUNCTION IF EXISTS notify_verification_changes();

-- Create the correct verification notification function
CREATE OR REPLACE FUNCTION notify_verification_changes()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  action_data JSONB;
BEGIN
  -- Only create notification when verification status changes
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    CASE NEW.verification_status
      WHEN 'pending' THEN
        -- This happens when recycler submits verification form
        notification_title := '📋 Verification Form Received';
        notification_message := 'Thank you for submitting your recycler verification form! We have received your application and our admin team will review it within 24-48 hours. You will receive another notification once the review is complete.';
        action_data := jsonb_build_object(
          'action_type', 'view_status',
          'deep_link', '/recycler-screens/RecyclerEditProfileScreen',
          'button_text', 'View Status'
        );
      WHEN 'approved' THEN
        -- This happens when admin approves verification
        notification_title := '✅ Verification Approved!';
        notification_message := 'Congratulations! Your recycler verification has been approved. You can now start accepting pickup requests and begin earning from your recycling services.';
        action_data := jsonb_build_object(
          'action_type', 'view_requests',
          'deep_link', '/recycler-screens/RecyclerRequests',
          'button_text', 'View Requests'
        );
      WHEN 'rejected' THEN
        -- This happens when admin rejects verification
        notification_title := '❌ Verification Rejected';
        notification_message := 'Your recycler verification has been rejected. Please review the feedback and resubmit your application with the required corrections.';
        action_data := jsonb_build_object(
          'action_type', 'retry_verification',
          'deep_link', '/recycler-screens/RecyclerEditProfileScreen',
          'button_text', 'Retry Verification'
        );
      ELSE
        -- For any other status changes, just return
        RETURN NEW;
    END CASE;
    
    -- Create the notification using NEW.id (which is the user ID)
    PERFORM create_notification(
      NEW.id,
      notification_title,
      notification_message,
      'verification',
      action_data
    );
    
    RAISE NOTICE 'Verification notification created for user % with status %', NEW.id, NEW.verification_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_notify_verification_changes
  AFTER UPDATE ON recyclers
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_changes();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION notify_verification_changes() TO authenticated;

-- Verify the trigger was created
SELECT 
  'Verification notification system created successfully!' as status,
  'Trigger: trigger_notify_verification_changes' as trigger_name,
  'Function: notify_verification_changes()' as function_name;

-- Show what notifications will be created for different status changes
SELECT 
  'pending' as status,
  '📋 Verification Form Received' as title,
  'Thank you for submitting your recycler verification form! We have received your application and our admin team will review it within 24-48 hours.' as message
UNION ALL
SELECT 
  'approved' as status,
  '✅ Verification Approved!' as title,
  'Congratulations! Your recycler verification has been approved. You can now start accepting pickup requests.' as message
UNION ALL
SELECT 
  'rejected' as status,
  '❌ Verification Rejected' as title,
  'Your recycler verification has been rejected. Please review the feedback and resubmit your application.' as message;
