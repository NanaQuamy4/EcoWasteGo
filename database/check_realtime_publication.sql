-- Check current realtime publication configuration
-- This helps diagnose realtime subscription issues

-- Check what tables are currently in the supabase_realtime publication
SELECT 
    'Current tables in supabase_realtime publication:' as info;

SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Check if specific tables exist
SELECT 
    'Table existence check:' as info;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime'
        ) THEN 'IN PUBLICATION'
        ELSE 'NOT IN PUBLICATION'
    END as publication_status
FROM (
    SELECT unnest(ARRAY['notifications', 'admin_notifications', 'help_messages']) as table_name
) t
WHERE EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = t.table_name
);

-- Check for any duplicate entries (should not happen but good to verify)
SELECT 
    'Duplicate check:' as info;

SELECT 
    tablename,
    COUNT(*) as count
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
GROUP BY tablename
HAVING COUNT(*) > 1;
