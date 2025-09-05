-- Enable Real-time for Recycler Earnings Table
-- This script adds the recycler_earnings table to the supabase_realtime publication

-- Check if recycler_earnings table exists
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recycler_earnings') THEN
        -- Check if table is already in realtime publication
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'recycler_earnings'
        ) THEN
            -- Add table to realtime publication
            ALTER PUBLICATION supabase_realtime ADD TABLE recycler_earnings;
            RAISE NOTICE 'Added recycler_earnings table to realtime publication';
        ELSE
            RAISE NOTICE 'recycler_earnings table already in realtime publication';
        END IF;
    ELSE
        RAISE NOTICE 'recycler_earnings table does not exist. Please run create_recycler_earnings_table.sql first.';
    END IF;
END $$;

-- Enable REPLICA IDENTITY for real-time subscriptions
-- This is required for real-time to work properly
ALTER TABLE recycler_earnings REPLICA IDENTITY FULL;

-- Verify the setup
SELECT 
    'recycler_earnings realtime setup completed' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'recycler_earnings'
        ) THEN 'SUCCESS: Table is in realtime publication'
        ELSE 'ERROR: Table not in realtime publication'
    END as publication_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = 'recycler_earnings' 
            AND relreplident = 'f'
        ) THEN 'SUCCESS: REPLICA IDENTITY FULL enabled'
        ELSE 'ERROR: REPLICA IDENTITY not properly set'
    END as replica_identity_status;
