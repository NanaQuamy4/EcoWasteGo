-- Setup notification system for recyclers
-- This ensures notifications are created for verification events

-- 1. Enable realtime for notifications table (if not already added)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'notifications table already in realtime publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding notifications table: %', SQLERRM;
END $$;

-- 2. Create or replace the verification notification function
CREATE OR REPLACE FUNCTION notify_verification_changes()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    action_data JSONB;
BEGIN
    -- Handle different verification status changes
    IF NEW.verification_status != OLD.verification_status THEN
        CASE NEW.verification_status
            WHEN 'approved' THEN
                notification_title := '🎉 Verification Approved!';
                notification_message := 'Congratulations! Your recycler account has been verified. You can now start accepting waste collection requests from customers.';
                action_data := jsonb_build_object(
                    'action_type', 'view_profile',
                    'deep_link', '/recycler-screens/RecyclerEditProfileScreen',
                    'button_text', 'View Profile'
                );
            WHEN 'rejected' THEN
                notification_title := '❌ Verification Rejected';
                notification_message := 'Your verification request has been rejected. Please check the admin feedback and resubmit your application with the required corrections.';
                action_data := jsonb_build_object(
                    'action_type', 'retry_verification',
                    'deep_link', '/recycler-screens/RecyclerEditProfileScreen',
                    'button_text', 'Retry Verification'
                );
            WHEN 'pending' THEN
                notification_title := '📋 Verification Under Review';
                notification_message := 'Your verification request is now under review by our admin team. You will be notified once the review is complete.';
                action_data := jsonb_build_object(
                    'action_type', 'view_status',
                    'deep_link', '/recycler-screens/RecyclerEditProfileScreen',
                    'button_text', 'View Status'
                );
        END CASE;

        -- Insert notification
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            is_read,
            action_data,
            created_at
        ) VALUES (
            NEW.id,
            notification_title,
            notification_message,
            'verification',
            false,
            action_data,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS recycler_verification_notification_trigger ON recyclers;

-- 4. Create the trigger
CREATE TRIGGER recycler_verification_notification_trigger
    AFTER UPDATE ON recyclers
    FOR EACH ROW
    EXECUTE FUNCTION notify_verification_changes();

-- 5. Create RLS policy for notifications if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'notifications_user_access'
    ) THEN
        CREATE POLICY "notifications_user_access" ON notifications
            FOR ALL TO authenticated
            USING (user_id = auth.uid());
    END IF;
END $$;

-- 6. Test the trigger by updating a recycler's verification status
-- (This will create a notification if the status changes)
UPDATE recyclers 
SET verification_status = 'approved', updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'nquamy7@gmail.com')
AND verification_status != 'approved';

-- 7. Verify the notification was created
SELECT 
    'Notification created:' as info,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.created_at
FROM notifications n
JOIN auth.users u ON n.user_id = u.id
WHERE u.email = 'nquamy7@gmail.com'
ORDER BY n.created_at DESC
LIMIT 5;
