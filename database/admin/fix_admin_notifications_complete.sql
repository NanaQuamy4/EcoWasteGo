-- Complete fix for admin notifications system
-- This ensures notifications are created when users send help messages

-- First, ensure the admin_notifications table exists
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('help_message', 'verification_request', 'user_registration')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    related_table TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view own notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can update own notifications" ON admin_notifications;

-- Create RLS policies
CREATE POLICY "Admins can view own notifications" ON admin_notifications
    FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY "Admins can update own notifications" ON admin_notifications
    FOR UPDATE USING (auth.uid() = admin_id);

-- Grant permissions
GRANT ALL ON admin_notifications TO authenticated;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_admin_notification(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_admin_notifications(UUID);
DROP FUNCTION IF EXISTS mark_admin_notification_read(UUID, UUID);
DROP FUNCTION IF EXISTS get_admin_unread_count(UUID);

-- Create RPC function to create admin notifications
CREATE OR REPLACE FUNCTION create_admin_notification(
    p_admin_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_table TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'medium'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO admin_notifications (
        admin_id,
        type,
        title,
        message,
        related_id,
        related_table,
        priority
    ) VALUES (
        p_admin_id,
        p_type,
        p_title,
        p_message,
        p_related_id,
        p_related_table,
        p_priority
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get admin notifications
CREATE OR REPLACE FUNCTION get_admin_notifications(p_admin_id UUID)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    related_id UUID,
    related_table TEXT,
    priority TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        an.id,
        an.type,
        an.title,
        an.message,
        an.related_id,
        an.related_table,
        an.priority,
        an.is_read,
        an.created_at,
        an.read_at
    FROM admin_notifications an
    WHERE an.admin_id = p_admin_id
    ORDER BY an.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to mark notification as read
CREATE OR REPLACE FUNCTION mark_admin_notification_read(
    p_notification_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_notifications 
    SET 
        is_read = TRUE,
        read_at = NOW()
    WHERE id = p_notification_id AND admin_id = p_admin_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get unread count
CREATE OR REPLACE FUNCTION get_admin_unread_count(p_admin_id UUID)
RETURNS TABLE (
    help_messages INTEGER,
    verifications INTEGER,
    total INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'help_message' AND NOT is_read THEN 1 ELSE 0 END), 0)::INTEGER as help_messages,
        COALESCE(SUM(CASE WHEN type = 'verification_request' AND NOT is_read THEN 1 ELSE 0 END), 0)::INTEGER as verifications,
        COALESCE(SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END), 0)::INTEGER as total
    FROM admin_notifications
    WHERE admin_id = p_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_admin_notification(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_admin_notification_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_unread_count(UUID) TO authenticated;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_admin_help_message ON help_messages;
DROP TRIGGER IF EXISTS notify_admin_verification_request ON recyclers;

-- Create trigger function for help messages
CREATE OR REPLACE FUNCTION notify_admin_help_message()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the first admin user (you can modify this logic as needed)
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin' 
    LIMIT 1;
    
    -- If no admin found, use a default admin ID or skip
    IF admin_user_id IS NULL THEN
        -- You can set a specific admin ID here or create a default admin
        -- For now, we'll skip if no admin is found
        RETURN NEW;
    END IF;
    
    -- Create notification for admin
    INSERT INTO admin_notifications (
        admin_id,
        type,
        title,
        message,
        related_id,
        related_table,
        priority
    ) VALUES (
        admin_user_id,
        'help_message',
        'New Help Message',
        'You have received a new help message from ' || NEW.user_name || ' (' || NEW.user_role || ')',
        NEW.id,
        'help_messages',
        CASE 
            WHEN NEW.priority = 'urgent' THEN 'urgent'
            WHEN NEW.priority = 'high' THEN 'high'
            ELSE 'medium'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for help messages
CREATE TRIGGER notify_admin_help_message
    AFTER INSERT ON help_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_help_message();

-- Create trigger function for verification requests
CREATE OR REPLACE FUNCTION notify_admin_verification_request()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Only trigger on status change to 'pending'
    IF NEW.verification_status = 'pending' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'pending') THEN
        -- Get the first admin user
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin' 
        LIMIT 1;
        
        -- If no admin found, skip
        IF admin_user_id IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Create notification for admin
        INSERT INTO admin_notifications (
            admin_id,
            type,
            title,
            message,
            related_id,
            related_table,
            priority
        ) VALUES (
            admin_user_id,
            'verification_request',
            'New Verification Request',
            'A new recycler verification request has been submitted',
            NEW.id,
            'recyclers',
            'medium'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verification requests
CREATE TRIGGER notify_admin_verification_request
    AFTER UPDATE ON recyclers
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_verification_request();

-- Enable realtime for admin_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Admin notifications system setup completed successfully!' as status;
