-- Fixed Database Performance Check for Messaging System
-- This version fixes all column reference errors

-- 1. Check table structure
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    a.attname as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
    a.attnotnull as not_null,
    a.attnum as column_number
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'messages'
AND a.attnum > 0
AND NOT a.attisdropped
ORDER BY a.attnum;

-- 2. Check indexes on messages table
SELECT 
    indexname,
    indexdef,
    schemaname,
    tablename
FROM pg_indexes 
WHERE tablename = 'messages'
ORDER BY indexname;

-- 3. Check table statistics
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE relname = 'messages';

-- 4. Check function performance
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('send_message', 'get_messages_for_request', 'mark_messages_read', 'get_unread_message_count')
AND routine_schema = 'public';

-- 5. Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'messages';

-- 6. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'messages';

-- 7. Test query performance with EXPLAIN
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    m.id,
    m.sender_id,
    m.sender_type,
    m.message,
    m.is_read,
    m.created_at,
    CASE 
        WHEN m.sender_type = 'customer' THEN c.full_name
        WHEN m.sender_type = 'recycler' THEN r.full_name
        ELSE 'Unknown'
    END as sender_name
FROM messages m
LEFT JOIN customers c ON m.sender_type = 'customer' AND m.sender_id = c.id
LEFT JOIN recyclers r ON m.sender_type = 'recycler' AND m.sender_id = r.id
WHERE m.request_id = (SELECT id FROM pickup_requests LIMIT 1)
ORDER BY m.created_at ASC;

-- 8. Check for potential performance issues
SELECT 
    'Table Size' as metric,
    pg_size_pretty(pg_total_relation_size('messages')) as value
UNION ALL
SELECT 
    'Index Size',
    pg_size_pretty(pg_indexes_size('messages'))
UNION ALL
SELECT 
    'Row Count',
    COUNT(*)::text
FROM messages
UNION ALL
SELECT 
    'Average Message Length',
    AVG(LENGTH(message))::text
FROM messages;

-- 9. Check for missing indexes that might improve performance
SELECT 
    'Missing Index Check' as check_type,
    'Consider adding composite index on (request_id, created_at)' as recommendation
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'messages' 
    AND indexdef LIKE '%request_id%created_at%'
);

-- 10. Check connection and subscription limits
SELECT 
    'Max Connections' as setting,
    setting as value
FROM pg_settings 
WHERE name = 'max_connections'
UNION ALL
SELECT 
    'Shared Buffers',
    setting
FROM pg_settings 
WHERE name = 'shared_buffers'
UNION ALL
SELECT 
    'Work Memory',
    setting
FROM pg_settings 
WHERE name = 'work_mem';

-- 11. Simple performance test
SELECT 
    'Performance Test' as test_type,
    'Message Count' as metric,
    COUNT(*)::text as value
FROM messages
UNION ALL
SELECT 
    'Performance Test',
    'Recent Messages (1 hour)',
    COUNT(*)::text
FROM messages 
WHERE created_at >= NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'Performance Test',
    'Database Size',
    pg_size_pretty(pg_database_size(current_database()));
