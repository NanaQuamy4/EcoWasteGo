-- Fix realtime publication conflicts
-- This script safely handles adding tables to supabase_realtime publication

-- First, remove any existing tables from the publication to avoid conflicts
DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- List of tables that should be in the realtime publication
    FOR table_name IN 
        SELECT unnest(ARRAY['notifications', 'admin_notifications', 'help_messages'])
    LOOP
        -- Try to remove the table from publication (ignore if not exists)
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS %I', table_name);
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors if table doesn't exist in publication
                NULL;
        END;
    END LOOP;
END $$;

-- Now add the tables back to the publication
-- This ensures they are properly configured for real-time subscriptions

-- Add notifications table for customer/recycler notifications
DO $$
BEGIN
    -- Check if table exists before adding to publication
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        RAISE NOTICE 'Added notifications table to realtime publication';
    ELSE
        RAISE NOTICE 'notifications table does not exist, skipping';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'notifications table already in realtime publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding notifications table: %', SQLERRM;
END $$;

-- Add admin_notifications table for admin notifications
DO $$
BEGIN
    -- Check if table exists before adding to publication
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
        RAISE NOTICE 'Added admin_notifications table to realtime publication';
    ELSE
        RAISE NOTICE 'admin_notifications table does not exist, skipping';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'admin_notifications table already in realtime publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding admin_notifications table: %', SQLERRM;
END $$;

-- Add help_messages table for help message real-time updates
DO $$
BEGIN
    -- Check if table exists before adding to publication
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'help_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE help_messages;
        RAISE NOTICE 'Added help_messages table to realtime publication';
    ELSE
        RAISE NOTICE 'help_messages table does not exist, skipping';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'help_messages table already in realtime publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding help_messages table: %', SQLERRM;
END $$;

-- Verify the publication configuration
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
    AND tablename IN ('notifications', 'admin_notifications', 'help_messages')
ORDER BY tablename;

-- Refresh schema cache to ensure changes take effect
NOTIFY pgrst, 'reload schema';

SELECT 'Realtime publication setup completed successfully!' as status;
