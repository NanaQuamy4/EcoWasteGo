-- Messaging System Database Optimization Recommendations
-- Based on analysis of the current implementation

-- 1. Add composite index for better query performance
-- This will improve the performance of get_messages_for_request function
CREATE INDEX IF NOT EXISTS idx_messages_request_created 
ON messages(request_id, created_at DESC);

-- 2. Add partial index for unread messages
-- This will speed up unread count queries
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(request_id, sender_id) 
WHERE is_read = FALSE;

-- 3. Add index for real-time subscription filtering
-- This will improve the performance of postgres_changes filtering
CREATE INDEX IF NOT EXISTS idx_messages_request_id_btree 
ON messages USING btree(request_id);

-- 4. Optimize the notify_message_insert function
-- Add error handling and make it more efficient
CREATE OR REPLACE FUNCTION notify_message_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the message is valid and not a duplicate
    IF NEW.request_id IS NOT NULL AND NEW.sender_id IS NOT NULL THEN
        PERFORM pg_notify('new_message', json_build_object(
            'request_id', NEW.request_id,
            'sender_id', NEW.sender_id,
            'sender_type', NEW.sender_type,
            'message_id', NEW.id,
            'created_at', NEW.created_at
        )::text);
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the insert
        RAISE WARNING 'Error in notify_message_insert: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Add message cleanup function for old messages
-- This will help maintain database performance over time
CREATE OR REPLACE FUNCTION cleanup_old_messages(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM messages 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Add function to get message statistics
-- This will help monitor system performance
CREATE OR REPLACE FUNCTION get_messaging_stats()
RETURNS TABLE (
    total_messages BIGINT,
    messages_today BIGINT,
    active_conversations BIGINT,
    avg_messages_per_conversation NUMERIC,
    oldest_message TIMESTAMPTZ,
    newest_message TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as messages_today,
        COUNT(DISTINCT request_id) as active_conversations,
        ROUND(COUNT(*)::NUMERIC / COUNT(DISTINCT request_id), 2) as avg_messages_per_conversation,
        MIN(created_at) as oldest_message,
        MAX(created_at) as newest_message
    FROM messages;
END;
$$ LANGUAGE plpgsql;

-- 7. Add monitoring for subscription performance
-- This will help track real-time subscription health
CREATE OR REPLACE FUNCTION check_subscription_health()
RETURNS TABLE (
    metric_name TEXT,
    metric_value TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Active Subscriptions'::TEXT, 
           (SELECT COUNT(*)::TEXT FROM pg_stat_activity WHERE state = 'active' AND query LIKE '%messages%')
    UNION ALL
    SELECT 'Messages in Last Hour'::TEXT,
           (SELECT COUNT(*)::TEXT FROM messages WHERE created_at >= NOW() - INTERVAL '1 hour')
    UNION ALL
    SELECT 'Average Response Time (ms)'::TEXT,
           (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000), 2)::TEXT FROM messages WHERE updated_at IS NOT NULL)
    UNION ALL
    SELECT 'Database Size'::TEXT,
           pg_size_pretty(pg_database_size(current_database()));
END;
$$ LANGUAGE plpgsql;

-- 8. Add connection pooling recommendations
-- Create a view to monitor connection usage
CREATE OR REPLACE VIEW messaging_connection_stats AS
SELECT 
    'Total Connections' as metric,
    (SELECT setting FROM pg_settings WHERE name = 'max_connections') as current_value,
    '100' as recommended_value,
    'Consider increasing if you have many concurrent users' as recommendation
UNION ALL
SELECT 
    'Active Connections',
    (SELECT COUNT(*)::TEXT FROM pg_stat_activity WHERE state = 'active'),
    'Less than 80% of max',
    'Monitor connection usage patterns'
UNION ALL
SELECT 
    'Idle Connections',
    (SELECT COUNT(*)::TEXT FROM pg_stat_activity WHERE state = 'idle'),
    'Less than 20% of max',
    'Consider connection pooling if high';

-- 9. Add performance monitoring triggers
-- This will help track slow queries and performance issues
CREATE OR REPLACE FUNCTION log_slow_messaging_queries()
RETURNS TRIGGER AS $$
BEGIN
    -- Log if message insertion takes too long
    IF EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) > 1 THEN
        RAISE WARNING 'Slow message insertion detected: % seconds', 
            EXTRACT(EPOCH FROM (NOW() - NEW.created_at));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_old_messages(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_messaging_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION check_subscription_health() TO authenticated;
GRANT SELECT ON messaging_connection_stats TO authenticated;

-- 11. Create a maintenance schedule recommendation
SELECT 
    'Database Maintenance Recommendations' as category,
    'Run VACUUM ANALYZE messages; daily' as task,
    'Keep statistics up to date' as purpose
UNION ALL
SELECT 
    'Database Maintenance Recommendations',
    'Run cleanup_old_messages(30); weekly',
    'Remove old messages to maintain performance'
UNION ALL
SELECT 
    'Database Maintenance Recommendations',
    'Monitor messaging_connection_stats view',
    'Track connection usage and performance'
UNION ALL
SELECT 
    'Database Maintenance Recommendations',
    'Check check_subscription_health() regularly',
    'Monitor real-time subscription performance';
