-- Fix admin response visibility for users
-- This script ensures that when admins respond to help messages, 
-- the responses are properly visible to the specific users who sent the messages

-- First, let's check if the help_messages table exists and has the right structure
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'help_messages') THEN
        RAISE NOTICE 'Creating help_messages table...';
        
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

        -- Grant basic permissions
        GRANT ALL ON help_messages TO authenticated;
        GRANT USAGE ON SCHEMA public TO authenticated;

        -- Enable RLS
        ALTER TABLE help_messages ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view own help messages" ON help_messages
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can create help messages" ON help_messages
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Admins can view all help messages" ON help_messages
            FOR SELECT USING (true);

        CREATE POLICY "Admins can update help messages" ON help_messages
            FOR UPDATE USING (true);

        RAISE NOTICE 'help_messages table created successfully!';
    ELSE
        RAISE NOTICE 'help_messages table already exists.';
    END IF;
END $$;

-- Drop and recreate the respond_to_help_message function to ensure it works properly
DROP FUNCTION IF EXISTS respond_to_help_message(UUID, TEXT);

CREATE OR REPLACE FUNCTION respond_to_help_message(
    message_id UUID,
    response_text TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user_id of the message being responded to
    SELECT user_id INTO target_user_id 
    FROM help_messages 
    WHERE id = message_id;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Help message not found';
    END IF;

    -- Update the help message with admin response
    UPDATE help_messages 
    SET 
        admin_response = response_text,
        admin_responded_by = auth.uid(),
        admin_responded_at = NOW(),
        status = 'resolved',
        updated_at = NOW()
    WHERE id = message_id;

    -- Create a notification for the user who sent the original message
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
    ) VALUES (
        target_user_id,
        'Support Response Received',
        'You have received a response to your support request. Check your help messages for details.',
        'support',
        false,
        NOW()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION respond_to_help_message(UUID, TEXT) TO authenticated;

-- Enable realtime for help_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE help_messages;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Admin response visibility fix completed successfully!' as status;
