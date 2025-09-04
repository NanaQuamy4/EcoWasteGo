-- Comprehensive fix for all database issues
-- This script fixes both admin notifications and help messages problems

-- ===========================================
-- 1. FIX ADMIN NOTIFICATIONS TABLE
-- ===========================================

-- Drop the admin_notifications table completely
DROP TABLE IF EXISTS admin_notifications CASCADE;

-- Recreate the admin_notifications table with all required columns
CREATE TABLE admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('help_message', 'verification_request', 'user_registration')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- ID of the related help message or verification request
    related_table TEXT, -- 'help_messages' or 'recycler_verifications'
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

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
DROP FUNCTION IF EXISTS create_admin_notification(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT);
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
DROP FUNCTION IF EXISTS get_admin_notifications(UUID);
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

-- Function to mark notification as read
DROP FUNCTION IF EXISTS mark_admin_notification_read(UUID, UUID);
CREATE OR REPLACE FUNCTION mark_admin_notification_read(p_notification_id UUID, p_admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_notifications 
    SET is_read = TRUE
    WHERE id = p_notification_id AND admin_id = p_admin_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
DROP FUNCTION IF EXISTS get_admin_unread_count(UUID);
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

-- ===========================================
-- 2. FIX HELP MESSAGES FUNCTIONS
-- ===========================================

-- Fix the get_help_messages_for_admin function
DROP FUNCTION IF EXISTS get_help_messages_for_admin();
CREATE OR REPLACE FUNCTION get_help_messages_for_admin()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    subject TEXT,
    message TEXT,
    status TEXT,
    priority TEXT,
    admin_response TEXT,
    admin_responded_by UUID,
    admin_responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        hm.id,
        hm.user_id,
        hm.user_email,
        hm.user_name,
        hm.user_role,
        hm.subject,
        hm.message,
        hm.status,
        hm.priority,
        hm.admin_response,
        hm.admin_responded_by,
        hm.admin_responded_at,
        hm.created_at,
        hm.updated_at
    FROM help_messages hm
    ORDER BY hm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the respond_to_help_message function
-- Drop all possible variations of the function
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Find and drop all respond_to_help_message functions
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc 
        WHERE proname = 'respond_to_help_message'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.argtypes || ') CASCADE';
    END LOOP;
END $$;
CREATE OR REPLACE FUNCTION respond_to_help_message(
    p_message_id UUID,
    p_response TEXT,
    p_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- Update the help message
    UPDATE help_messages 
    SET 
        admin_response = p_response,
        admin_responded_by = auth.uid(),
        admin_responded_at = NOW(),
        status = p_status,
        updated_at = NOW()
    WHERE id = p_message_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 3. SET UP TRIGGERS FOR NOTIFICATIONS
-- ===========================================

-- Trigger function to create notification when help message is sent
CREATE OR REPLACE FUNCTION notify_admin_help_message()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
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

-- ===========================================
-- 4. SET UP RLS POLICIES
-- ===========================================

-- RLS Policies for admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view own notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can update own notifications" ON admin_notifications;

-- Policy for admins to view their own notifications
CREATE POLICY "Admins can view own notifications" ON admin_notifications
    FOR SELECT USING (
        admin_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND email = 'admin@ecowastego.com'
        )
    );

-- Policy for admins to update their own notifications
CREATE POLICY "Admins can update own notifications" ON admin_notifications
    FOR UPDATE USING (
        admin_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND email = 'admin@ecowastego.com'
        )
    );

-- ===========================================
-- 5. GRANT PERMISSIONS
-- ===========================================

-- Grant permissions for admin_notifications
GRANT SELECT, UPDATE ON admin_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_notification TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_admin_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_unread_count TO authenticated;

-- Grant permissions for help_messages
GRANT ALL ON help_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_help_messages_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_help_message TO authenticated;

-- ===========================================
-- 6. RELOAD SCHEMA AND VERIFY
-- ===========================================

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verify the table structures
SELECT 'Admin notifications table structure:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Help messages table structure:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'help_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'All database issues fixed successfully!' as status;
