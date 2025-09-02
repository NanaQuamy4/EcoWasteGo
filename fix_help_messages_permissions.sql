-- Fix help_messages table permissions and RLS policies
-- This resolves the "permission denied for table users" error in HelpScreen

-- 1. First, check if help_messages table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'help_messages') THEN
        RAISE NOTICE 'Creating help_messages table...';
        
        -- Create help messages table
        CREATE TABLE help_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            user_email TEXT NOT NULL,
            user_name TEXT NOT NULL,
            user_role TEXT NOT NULL DEFAULT 'customer',
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
            priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
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

        RAISE NOTICE 'help_messages table created successfully!';
    ELSE
        RAISE NOTICE 'help_messages table already exists.';
    END IF;
END $$;

-- 2. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_help_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create updated_at trigger
DROP TRIGGER IF EXISTS trigger_update_help_messages_updated_at ON help_messages;
CREATE TRIGGER trigger_update_help_messages_updated_at
    BEFORE UPDATE ON help_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_help_messages_updated_at();

-- 4. Grant basic permissions
GRANT ALL ON help_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Enable RLS
ALTER TABLE help_messages ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own help messages" ON help_messages;
DROP POLICY IF EXISTS "Users can create help messages" ON help_messages;
DROP POLICY IF EXISTS "Admins can view all help messages" ON help_messages;
DROP POLICY IF EXISTS "Admins can update help messages" ON help_messages;
DROP POLICY IF EXISTS "help_messages_all_access" ON help_messages;

-- 7. Create new RLS policies
CREATE POLICY "help_messages_all_access" ON help_messages
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 8. Enable realtime for help_messages table
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE help_messages;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'help_messages table already in realtime publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding help_messages table: %', SQLERRM;
END $$;

-- 9. Create admin notification function for help messages
CREATE OR REPLACE FUNCTION notify_admin_help_message()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the first admin user
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
    LIMIT 1;
    
    -- If admin user exists, create notification
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO admin_notifications (
            admin_id,
            type,
            title,
            message,
            related_id,
            related_table,
            priority,
            is_read,
            created_at
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
            END,
            false,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for help messages
DROP TRIGGER IF EXISTS notify_admin_help_message ON help_messages;
CREATE TRIGGER notify_admin_help_message
    AFTER INSERT ON help_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_help_message();

-- 11. Test the table by inserting a test message
INSERT INTO help_messages (
    user_id,
    user_email,
    user_name,
    user_role,
    message,
    status,
    priority
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Test User'),
    COALESCE(u.raw_user_meta_data->>'role', 'customer'),
    'Test help message to verify permissions',
    'pending',
    'medium'
FROM auth.users u
WHERE u.email = 'nquamy7@gmail.com'
LIMIT 1;

-- 12. Verify the test message was inserted
SELECT 
    'Test message inserted:' as info,
    id,
    user_name,
    message,
    status,
    created_at
FROM help_messages
WHERE message = 'Test help message to verify permissions'
ORDER BY created_at DESC
LIMIT 1;

-- 13. Clean up test message
DELETE FROM help_messages 
WHERE message = 'Test help message to verify permissions';

-- 14. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 15. Final verification
SELECT 
    'help_messages table setup complete!' as status,
    COUNT(*) as total_messages
FROM help_messages;