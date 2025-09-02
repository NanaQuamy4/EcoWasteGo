-- Create admin notifications system for tracking pending requests
-- This system notifies admins when they have help messages or verification requests

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('help_message', 'verification_request', 'user_registration')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- ID of the related help message or verification request
    related_table TEXT, -- 'help_messages' or 'recycler_verifications'
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_action_required ON admin_notifications(action_required);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.read_at = CASE 
        WHEN OLD.is_read = FALSE AND NEW.is_read = TRUE THEN NOW()
        ELSE OLD.read_at
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_notifications_updated_at
    BEFORE UPDATE ON admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_notifications_updated_at();

-- Function to create admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
    p_admin_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_table TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO admin_notifications (
        admin_id, type, title, message, related_id, related_table, priority
    ) VALUES (
        p_admin_id, p_type, p_title, p_message, p_related_id, p_related_table, p_priority
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin notifications
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
    action_required BOOLEAN,
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
        an.action_required,
        an.created_at,
        an.read_at
    FROM admin_notifications an
    WHERE an.admin_id = p_admin_id
    ORDER BY an.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_admin_notification_read(p_notification_id UUID, p_admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_notifications 
    SET is_read = TRUE, action_required = FALSE
    WHERE id = p_notification_id AND admin_id = p_admin_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_admin_unread_count(p_admin_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM admin_notifications
    WHERE admin_id = p_admin_id AND is_read = FALSE;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to create notification when help message is sent
CREATE OR REPLACE FUNCTION notify_admin_help_message()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID (assuming there's one admin for now)
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@ecowastego.com' 
    LIMIT 1;
    
    -- If admin user exists, create notification
    IF admin_user_id IS NOT NULL THEN
        PERFORM create_admin_notification(
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for help messages
DROP TRIGGER IF EXISTS trigger_notify_admin_help_message ON help_messages;
CREATE TRIGGER trigger_notify_admin_help_message
    AFTER INSERT ON help_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_help_message();

-- Trigger function to create notification when verification request is submitted
CREATE OR REPLACE FUNCTION notify_admin_verification_request()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
    user_name TEXT;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@ecowastego.com' 
    LIMIT 1;
    
    -- Get user name from auth.users
    SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO user_name
    FROM auth.users 
    WHERE id = NEW.id;
    
    -- If admin user exists and verification status is pending, create notification
    IF admin_user_id IS NOT NULL AND NEW.verification_status = 'pending' THEN
        PERFORM create_admin_notification(
            admin_user_id,
            'verification_request',
            'New Verification Request',
            'You have a new recycler verification request from ' || COALESCE(user_name, 'Unknown User'),
            NEW.id,
            'recyclers',
            'high'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for verification requests
DROP TRIGGER IF EXISTS trigger_notify_admin_verification_request ON recyclers;
CREATE TRIGGER trigger_notify_admin_verification_request
    AFTER UPDATE OF verification_status ON recyclers
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_verification_request();

-- RLS Policies for admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view their own notifications
CREATE POLICY "Admins can view own notifications" ON admin_notifications
    FOR SELECT USING (
        admin_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@ecowastego.com'
        )
    );

-- Policy for admins to update their own notifications
CREATE POLICY "Admins can update own notifications" ON admin_notifications
    FOR UPDATE USING (
        admin_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@ecowastego.com'
        )
    );

-- Grant permissions
GRANT SELECT, UPDATE ON admin_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_notification TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_admin_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_unread_count TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

SELECT 'Admin notifications system created successfully!' as status;
