-- Create notification triggers for customers and recyclers
-- This will automatically create notifications for various events

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_action_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_data,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_action_data,
    false,
    NOW()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Create trigger function for help message responses
CREATE OR REPLACE FUNCTION notify_help_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification when admin responds (admin_response is added)
  IF OLD.admin_response IS NULL AND NEW.admin_response IS NOT NULL THEN
    PERFORM create_notification(
      NEW.user_id,
      '💬 Help Response Received',
      'You have received a response to your help message: "' || LEFT(NEW.message, 50) || '..."',
      'help_response',
      jsonb_build_object(
        'action_type', 'view_help',
        'deep_link', '/customer-screens/Help',
        'button_text', 'View Response'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for help message responses
DROP TRIGGER IF EXISTS trigger_notify_help_response ON help_messages;
CREATE TRIGGER trigger_notify_help_response
  AFTER UPDATE ON help_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_help_response();

-- Create trigger function for verification status changes
CREATE OR REPLACE FUNCTION notify_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  action_data JSONB;
BEGIN
  -- Only create notification when verification status changes
  IF OLD.verification_status != NEW.verification_status THEN
    CASE NEW.verification_status
      WHEN 'approved' THEN
        notification_title := '✅ Verification Approved!';
        notification_message := 'Congratulations! Your recycler verification has been approved. You can now start accepting pickup requests.';
        action_data := jsonb_build_object(
          'action_type', 'view_requests',
          'deep_link', '/recycler-screens/RecyclerRequests',
          'button_text', 'View Requests'
        );
      WHEN 'rejected' THEN
        notification_title := '❌ Verification Rejected';
        notification_message := 'Your recycler verification has been rejected. Please review the feedback and resubmit your application.';
        action_data := jsonb_build_object(
          'action_type', 'retry_verification',
          'deep_link', '/recycler-screens/RecyclerEditProfileScreen',
          'button_text', 'Retry Verification'
        );
      ELSE
        RETURN NEW;
    END CASE;
    
    PERFORM create_notification(
      NEW.user_id,
      notification_title,
      notification_message,
      'verification',
      action_data
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for verification status changes
DROP TRIGGER IF EXISTS trigger_notify_verification_status ON recyclers;
CREATE TRIGGER trigger_notify_verification_status
  AFTER UPDATE ON recyclers
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_status();

-- Create trigger function for pickup request notifications
CREATE OR REPLACE FUNCTION notify_pickup_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify recyclers when a new pickup request is created
  IF TG_OP = 'INSERT' THEN
    -- This would be called when pickup_requests table is created
    -- For now, we'll create a placeholder function
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for payment notifications
CREATE OR REPLACE FUNCTION notify_payment_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify customer when payment is completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    PERFORM create_notification(
      NEW.customer_id,
      '💰 Payment Completed',
      'Your payment of GHS ' || NEW.amount || ' has been processed successfully.',
      'payment',
      jsonb_build_object(
        'action_type', 'view_history',
        'deep_link', '/customer-screens/history',
        'button_text', 'View History'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for points earned notifications
CREATE OR REPLACE FUNCTION notify_points_earned()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify customer when points are earned
  IF OLD.points != NEW.points AND NEW.points > OLD.points THEN
    PERFORM create_notification(
      NEW.user_id,
      '⭐ Points Earned!',
      'You earned ' || (NEW.points - OLD.points) || ' points for your recent activity. Keep recycling!',
      'points_earned',
      jsonb_build_object(
        'action_type', 'view_rewards',
        'deep_link', '/customer-screens/Rewards',
        'button_text', 'View Rewards'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the notification system
SELECT 'Testing notification system...' as info;

-- Test creating a notification
SELECT create_notification(
  (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'customer' LIMIT 1),
  '🎉 Welcome to EcoWasteGo!',
  'Thank you for joining our recycling community. Start your first pickup to earn points!',
  'welcome',
  jsonb_build_object(
    'action_type', 'schedule_pickup',
    'deep_link', '/',
    'button_text', 'Schedule Pickup'
  )
) as test_notification_id;
