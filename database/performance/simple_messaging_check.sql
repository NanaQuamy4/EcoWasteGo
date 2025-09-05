-- Simple Database Performance Check for Messaging System
-- This is a simplified version that should work without errors

-- 1. Check if messages table exists and get basic info
SELECT 
    'Table Exists' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') 
         THEN 'YES' 
         ELSE 'NO' 
    END as result;

-- 2. Get table size and row count
SELECT 
    'Table Size' as metric,
    pg_size_pretty(pg_total_relation_size('messages')) as value
UNION ALL
SELECT 
    'Row Count',
    COUNT(*)::text
FROM messages;

-- 3. Check indexes
SELECT 
    'Indexes' as check_type,
    indexname as index_name,
    indexdef as definition
FROM pg_indexes 
WHERE tablename = 'messages'
ORDER BY indexname;

-- 4. Check functions exist
SELECT 
    'Functions' as check_type,
    routine_name as function_name,
    routine_type as type
FROM information_schema.routines 
WHERE routine_name IN ('send_message', 'get_messages_for_request', 'mark_messages_read', 'get_unread_message_count')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 5. Check triggers
SELECT 
    'Triggers' as check_type,
    trigger_name,
    event_manipulation as event,
    action_timing as timing
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
ORDER BY trigger_name;

-- 6. Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    policyname as policy_name,
    cmd as command,
    permissive
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;

-- 7. Test basic query performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT COUNT(*) FROM messages;

-- 8. Check recent message activity
SELECT 
    'Recent Activity' as check_type,
    'Messages in last hour' as metric,
    COUNT(*)::text as value
FROM messages 
WHERE created_at >= NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'Recent Activity',
    'Messages today',
    COUNT(*)::text
FROM messages 
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT 
    'Recent Activity',
    'Total messages',
    COUNT(*)::text
FROM messages;

-- 9. Check for potential issues
SELECT 
    'Potential Issues' as check_type,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'messages' AND indexname LIKE '%request_id%')
        THEN 'Missing request_id index - may cause slow queries'
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'messages' AND indexname LIKE '%created_at%')
        THEN 'Missing created_at index - may cause slow ordering'
        ELSE 'No obvious indexing issues found'
    END as issue;

-- 10. Database connection info
SELECT 
    'Database Info' as check_type,
    'Max Connections' as setting,
    setting as value
FROM pg_settings 
WHERE name = 'max_connections'
UNION ALL
SELECT 
    'Database Info',
    'Current Connections',
    (SELECT COUNT(*)::text FROM pg_stat_activity WHERE state = 'active')
UNION ALL
SELECT 
    'Database Info',
    'Database Size',
    pg_size_pretty(pg_database_size(current_database()));
