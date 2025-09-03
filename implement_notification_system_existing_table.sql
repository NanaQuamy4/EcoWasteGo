-- Implement notification system using existing notifications table
-- This system sends notifications to both recycler and customer when requests are confirmed

-- Step 1: Add missing columns to existing notifications table if they don't exist
DO $$
BEGIN
    -- Add related_request_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'related_request_id') THEN
        ALTER TABLE notifications ADD COLUMN related_request_id UUID REFERENCES pickup_requests(id) ON DELETE CASCADE;
    END IF;
    
    -- Add related_user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'related_user_id') THEN
        ALTER TABLE notifications ADD COLUMN related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'priority') THEN
        ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;
    
    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Step 2: Update the type constraint to include new notification types
DO $$
BEGIN
    -- Drop existing type constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'notifications' AND constraint_type = 'CHECK' 
               AND constraint_name LIKE '%type%') THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    END IF;
    
    -- Add new type constraint with all notification types
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('general', 'verification', 'pickup', 'request_confirmed', 'request_accepted', 'request_rejected', 'request_completed', 'request_cancelled', 'pickup_started', 'pickup_completed'));
END $$;

-- Step 3: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_notifications_related_request_id ON notifications(related_request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_user_id ON notifications(related_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Step 4: Create function to send notification to user
CREATE OR REPLACE FUNCTION send_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_related_request_id UUID DEFAULT NULL,
    p_related_user_id UUID DEFAULT NULL,
    p_priority VARCHAR(20) DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_request_id,
        related_user_id,
        priority
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_related_request_id,
        p_related_user_id,
        p_priority
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to send request confirmation notifications
CREATE OR REPLACE FUNCTION send_request_confirmation_notifications(
    p_request_id UUID,
    p_customer_id UUID,
    p_recycler_id UUID
)
RETURNS VOID AS $$
DECLARE
    request_data RECORD;
    customer_name TEXT;
    recycler_name TEXT;
BEGIN
    -- Get request details
    SELECT 
        pr.pickup_address,
        pr.waste_type,
        pr.estimated_weight,
        c.full_name as customer_full_name,
        r.full_name as recycler_full_name
    INTO request_data
    FROM pickup_requests pr
    LEFT JOIN customers c ON pr.customer_id = c.id
    LEFT JOIN recyclers r ON pr.recycler_id = r.id
    WHERE pr.id = p_request_id;
    
    -- Get names with fallbacks
    customer_name := COALESCE(request_data.customer_full_name, 'Customer');
    recycler_name := COALESCE(request_data.recycler_full_name, 'Recycler');
    
    -- Send notification to recycler
    PERFORM send_notification(
        p_recycler_id,
        'request_confirmed',
        'New Pickup Request Confirmed',
        'You have received a new pickup request from ' || customer_name || 
        ' for ' || request_data.waste_type || ' (' || request_data.estimated_weight || 'kg) at ' || 
        request_data.pickup_address || '. Please accept or reject this request.',
        p_request_id,
        p_customer_id,
        'high'
    );
    
    -- Send notification to customer
    PERFORM send_notification(
        p_customer_id,
        'request_confirmed',
        'Request Sent to Recycler',
        'Your pickup request has been sent to ' || recycler_name || 
        '. Please wait for their response. You will be notified once they accept or reject your request.',
        p_request_id,
        p_recycler_id,
        'medium'
    );
    
    RAISE NOTICE 'Sent confirmation notifications for request %', p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to send request status change notifications
CREATE OR REPLACE FUNCTION send_request_status_notification(
    p_request_id UUID,
    p_new_status TEXT,
    p_updated_by_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    request_data RECORD;
    customer_name TEXT;
    recycler_name TEXT;
    notification_title VARCHAR(255);
    notification_message TEXT;
    notification_type VARCHAR(50);
BEGIN
    -- Get request details
    SELECT 
        pr.customer_id,
        pr.recycler_id,
        pr.pickup_address,
        pr.waste_type,
        pr.estimated_weight,
        c.full_name as customer_full_name,
        r.full_name as recycler_full_name
    INTO request_data
    FROM pickup_requests pr
    LEFT JOIN customers c ON pr.customer_id = c.id
    LEFT JOIN recyclers r ON pr.recycler_id = r.id
    WHERE pr.id = p_request_id;
    
    -- Get names with fallbacks
    customer_name := COALESCE(request_data.customer_full_name, 'Customer');
    recycler_name := COALESCE(request_data.recycler_full_name, 'Recycler');
    
    -- Determine notification details based on status
    CASE p_new_status
        WHEN 'accepted' THEN
            notification_type := 'request_accepted';
            notification_title := 'Request Accepted!';
            notification_message := recycler_name || ' has accepted your pickup request. They are on their way to ' || request_data.pickup_address || '.';
            
            -- Send to customer
            PERFORM send_notification(
                request_data.customer_id,
                notification_type,
                notification_title,
                notification_message,
                p_request_id,
                request_data.recycler_id,
                'high'
            );
            
        WHEN 'rejected' THEN
            notification_type := 'request_rejected';
            notification_title := 'Request Rejected';
            notification_message := recycler_name || ' has rejected your pickup request. You can select another recycler.';
            
            -- Send to customer
            PERFORM send_notification(
                request_data.customer_id,
                notification_type,
                notification_title,
                notification_message,
                p_request_id,
                request_data.recycler_id,
                'medium'
            );
            
        WHEN 'in_progress' THEN
            notification_type := 'pickup_started';
            notification_title := 'Pickup Started';
            notification_message := recycler_name || ' has started collecting your waste at ' || request_data.pickup_address || '.';
            
            -- Send to customer
            PERFORM send_notification(
                request_data.customer_id,
                notification_type,
                notification_title,
                notification_message,
                p_request_id,
                request_data.recycler_id,
                'medium'
            );
            
        WHEN 'completed' THEN
            notification_type := 'request_completed';
            notification_title := 'Pickup Completed!';
            notification_message := 'Your pickup has been completed by ' || recycler_name || '. Thank you for using EcoWasteGo!';
            
            -- Send to customer
            PERFORM send_notification(
                request_data.customer_id,
                notification_type,
                notification_title,
                notification_message,
                p_request_id,
                request_data.recycler_id,
                'medium'
            );
            
        WHEN 'cancelled' THEN
            notification_type := 'request_cancelled';
            notification_title := 'Request Cancelled';
            notification_message := 'The pickup request has been cancelled.';
            
            -- Send to both parties
            PERFORM send_notification(
                request_data.customer_id,
                notification_type,
                notification_title,
                notification_message,
                p_request_id,
                request_data.recycler_id,
                'low'
            );
            
            IF request_data.recycler_id IS NOT NULL THEN
                PERFORM send_notification(
                    request_data.recycler_id,
                    notification_type,
                    notification_title,
                    notification_message,
                    p_request_id,
                    request_data.customer_id,
                    'low'
                );
            END IF;
    END CASE;
    
    RAISE NOTICE 'Sent status notification for request % with status %', p_request_id, p_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger to automatically send notifications on status changes
CREATE OR REPLACE FUNCTION trigger_send_status_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Only send notifications if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Send confirmation notifications when status changes to 'confirmed'
        IF NEW.status = 'confirmed' AND OLD.status = 'assigned' THEN
            PERFORM send_request_confirmation_notifications(
                NEW.id,
                NEW.customer_id,
                NEW.recycler_id
            );
        END IF;
        
        -- Send status change notifications for other status changes
        IF NEW.status IN ('accepted', 'rejected', 'in_progress', 'completed', 'cancelled') THEN
            PERFORM send_request_status_notification(
                NEW.id,
                NEW.status,
                auth.uid()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create the trigger
DROP TRIGGER IF EXISTS trigger_pickup_request_notifications ON pickup_requests;
CREATE TRIGGER trigger_pickup_request_notifications
    AFTER UPDATE ON pickup_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_send_status_notifications();

-- Step 9: Create function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    related_request_id UUID,
    related_user_id UUID,
    is_read BOOLEAN,
    priority VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.related_request_id,
        n.related_user_id,
        n.is_read,
        n.priority,
        n.created_at,
        n.read_at
    FROM notifications n
    WHERE n.user_id = COALESCE(p_user_id, auth.uid())
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET 
        is_read = TRUE,
        read_at = NOW()
    WHERE id = p_notification_id 
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = COALESCE(p_user_id, auth.uid())
        AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Grant permissions
GRANT EXECUTE ON FUNCTION send_notification(UUID, VARCHAR(50), VARCHAR(255), TEXT, UUID, UUID, VARCHAR(20)) TO authenticated;
GRANT EXECUTE ON FUNCTION send_request_confirmation_notifications(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_request_status_notification(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- Step 13: Enable real-time for notifications (if not already enabled)
DO $$
BEGIN
    -- Check if notifications table is already in realtime publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

-- Step 14: Test the notification system
SELECT 'Testing notification system with existing notifications table...' as info;

-- Test: Create a test notification
DO $$
DECLARE
    test_user_id UUID;
    notification_id UUID;
BEGIN
    -- Get a test user ID (first user in auth.users)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Create a test notification
        SELECT send_notification(
            test_user_id,
            'request_confirmed',
            'Test Notification',
            'This is a test notification to verify the system is working with the existing notifications table.',
            NULL,
            NULL,
            'medium'
        ) INTO notification_id;
        
        RAISE NOTICE 'Created test notification with ID: %', notification_id;
        
        -- Clean up test notification
        DELETE FROM notifications WHERE id = notification_id;
        RAISE NOTICE 'Cleaned up test notification';
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;

SELECT 'SUCCESS: Notification system implemented using existing notifications table! Users will now receive notifications for request confirmations and status changes.' as status;
