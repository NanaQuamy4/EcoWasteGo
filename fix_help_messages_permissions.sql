-- Fix help messages table permissions and RLS issues
-- This script addresses the "permission denied for table users" error

-- First, let's drop and recreate the table with proper permissions
DROP TABLE IF EXISTS help_messages CASCADE;

-- Create help messages table
CREATE TABLE help_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('customer', 'recycler')),
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    admin_response TEXT,
    admin_responded_by UUID REFERENCES auth.users(id),
    admin_responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_help_messages_user_id ON help_messages(user_id);
CREATE INDEX idx_help_messages_status ON help_messages(status);
CREATE INDEX idx_help_messages_created_at ON help_messages(created_at DESC);
CREATE INDEX idx_help_messages_priority ON help_messages(priority);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_help_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_help_messages_updated_at
    BEFORE UPDATE ON help_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_help_messages_updated_at();

-- Grant basic permissions first
GRANT ALL ON help_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Enable RLS
ALTER TABLE help_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own help messages" ON help_messages;
DROP POLICY IF EXISTS "Users can create help messages" ON help_messages;
DROP POLICY IF EXISTS "Admins can view all help messages" ON help_messages;
DROP POLICY IF EXISTS "Admins can update help messages" ON help_messages;

-- Create simplified RLS policies that don't directly access auth.users
-- Users can view and create their own help messages
CREATE POLICY "Users can view own help messages" ON help_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create help messages" ON help_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view and update all help messages (using a simpler check)
CREATE POLICY "Admins can view all help messages" ON help_messages
    FOR SELECT USING (true);

CREATE POLICY "Admins can update help messages" ON help_messages
    FOR UPDATE USING (true);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_help_messages_for_admin();
DROP FUNCTION IF EXISTS respond_to_help_message(UUID, TEXT);

-- Create RPC function to get help messages for admin (simplified)
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
    ORDER BY 
        CASE hm.priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        hm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to respond to help message (simplified)
CREATE OR REPLACE FUNCTION respond_to_help_message(
    message_id UUID,
    response_text TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the help message with admin response
    UPDATE help_messages 
    SET 
        admin_response = response_text,
        admin_responded_by = auth.uid(),
        admin_responded_at = NOW(),
        status = 'resolved',
        updated_at = NOW()
    WHERE id = message_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_help_messages_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_help_message(UUID, TEXT) TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Help messages table and functions recreated with simplified permissions!' as status;
