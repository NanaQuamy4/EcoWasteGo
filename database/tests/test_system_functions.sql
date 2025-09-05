-- Complete System Test - Database Functions and Permissions
-- This script tests all functions from customer, recycler, and admin perspectives

-- Test 1: Check if all required tables exist
SELECT 
    'Table Check' as test_category,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (
    SELECT 'customers' as table_name
    UNION ALL SELECT 'recyclers'
    UNION ALL SELECT 'admins'
    UNION ALL SELECT 'pickup_requests'
    UNION ALL SELECT 'messages'
    UNION ALL SELECT 'notifications'
) t
LEFT JOIN information_schema.tables it ON it.table_name = t.table_name AND it.table_schema = 'public'
ORDER BY table_name;

-- Test 2: Check if all required functions exist
SELECT 
    'Function Check' as test_category,
    routine_name as function_name,
    routine_type,
    CASE WHEN routine_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (
    SELECT 'send_message' as routine_name, 'FUNCTION' as routine_type
    UNION ALL SELECT 'get_messages_for_request', 'FUNCTION'
    UNION ALL SELECT 'mark_messages_read', 'FUNCTION'
    UNION ALL SELECT 'get_unread_message_count', 'FUNCTION'
    UNION ALL SELECT 'get_customer_notifications', 'FUNCTION'
    UNION ALL SELECT 'get_recycler_notifications', 'FUNCTION'
    UNION ALL SELECT 'get_admin_notifications', 'FUNCTION'
    UNION ALL SELECT 'get_unread_notification_count', 'FUNCTION'
    UNION ALL SELECT 'mark_notification_read', 'FUNCTION'
    UNION ALL SELECT 'get_customer_arrival_status', 'FUNCTION'
) t
LEFT JOIN information_schema.routines ir ON ir.routine_name = t.routine_name AND ir.routine_schema = 'public'
ORDER BY function_name;

-- Test 3: Check RLS policies
SELECT 
    'RLS Policy Check' as test_category,
    tablename,
    policyname,
    permissive,
    cmd as command
FROM pg_policies 
WHERE tablename IN ('customers', 'recyclers', 'admins', 'pickup_requests', 'messages', 'notifications')
ORDER BY tablename, policyname;

-- Test 4: Check indexes for performance
SELECT 
    'Index Check' as test_category,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('customers', 'recyclers', 'pickup_requests', 'messages', 'notifications')
ORDER BY tablename, indexname;

-- Test 5: Test customer functions (if test data exists)
DO $$
DECLARE
    test_customer_id UUID;
    test_request_id UUID;
    test_message_id UUID;
    message_count INTEGER;
    unread_count INTEGER;
BEGIN
    -- Get test customer
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    
    IF test_customer_id IS NOT NULL THEN
        RAISE NOTICE 'Testing customer functions with customer ID: %', test_customer_id;
        
        -- Get test request
        SELECT id INTO test_request_id FROM pickup_requests WHERE customer_id = test_customer_id LIMIT 1;
        
        IF test_request_id IS NOT NULL THEN
            RAISE NOTICE 'Testing with request ID: %', test_request_id;
            
            -- Test send_message function
            BEGIN
                SELECT send_message(test_request_id, test_customer_id, 'customer', 'Test message from customer') INTO test_message_id;
                RAISE NOTICE 'Customer send_message: SUCCESS (Message ID: %)', test_message_id;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Customer send_message: FAILED - %', SQLERRM;
            END;
            
            -- Test get_messages_for_request function
            BEGIN
                SELECT COUNT(*) INTO message_count FROM get_messages_for_request(test_request_id, test_customer_id, 'customer');
                RAISE NOTICE 'Customer get_messages_for_request: SUCCESS (% messages)', message_count;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Customer get_messages_for_request: FAILED - %', SQLERRM;
            END;
            
            -- Test get_unread_notification_count function
            BEGIN
                SELECT get_unread_notification_count(test_customer_id) INTO unread_count;
                RAISE NOTICE 'Customer get_unread_notification_count: SUCCESS (% unread)', unread_count;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Customer get_unread_notification_count: FAILED - %', SQLERRM;
            END;
            
        ELSE
            RAISE NOTICE 'No pickup requests found for test customer';
        END IF;
    ELSE
        RAISE NOTICE 'No customers found for testing';
    END IF;
END $$;

-- Test 6: Test recycler functions (if test data exists)
DO $$
DECLARE
    test_recycler_id UUID;
    test_request_id UUID;
    test_message_id UUID;
    message_count INTEGER;
    unread_count INTEGER;
BEGIN
    -- Get test recycler
    SELECT id INTO test_recycler_id FROM recyclers LIMIT 1;
    
    IF test_recycler_id IS NOT NULL THEN
        RAISE NOTICE 'Testing recycler functions with recycler ID: %', test_recycler_id;
        
        -- Get test request
        SELECT id INTO test_request_id FROM pickup_requests WHERE recycler_id = test_recycler_id LIMIT 1;
        
        IF test_request_id IS NOT NULL THEN
            RAISE NOTICE 'Testing with request ID: %', test_request_id;
            
            -- Test send_message function
            BEGIN
                SELECT send_message(test_request_id, test_recycler_id, 'recycler', 'Test message from recycler') INTO test_message_id;
                RAISE NOTICE 'Recycler send_message: SUCCESS (Message ID: %)', test_message_id;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Recycler send_message: FAILED - %', SQLERRM;
            END;
            
            -- Test get_messages_for_request function
            BEGIN
                SELECT COUNT(*) INTO message_count FROM get_messages_for_request(test_request_id, test_recycler_id, 'recycler');
                RAISE NOTICE 'Recycler get_messages_for_request: SUCCESS (% messages)', message_count;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Recycler get_messages_for_request: FAILED - %', SQLERRM;
            END;
            
            -- Test get_unread_message_count function
            BEGIN
                SELECT get_unread_message_count(test_request_id, test_recycler_id, 'recycler') INTO unread_count;
                RAISE NOTICE 'Recycler get_unread_message_count: SUCCESS (% unread)', unread_count;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Recycler get_unread_message_count: FAILED - %', SQLERRM;
            END;
            
        ELSE
            RAISE NOTICE 'No pickup requests found for test recycler';
        END IF;
    ELSE
        RAISE NOTICE 'No recyclers found for testing';
    END IF;
END $$;

-- Test 7: Test admin functions (if test data exists)
DO $$
DECLARE
    test_admin_id UUID;
    admin_notification_count INTEGER;
BEGIN
    -- Get test admin
    SELECT id INTO test_admin_id FROM admins LIMIT 1;
    
    IF test_admin_id IS NOT NULL THEN
        RAISE NOTICE 'Testing admin functions with admin ID: %', test_admin_id;
        
        -- Test get_admin_notifications function
        BEGIN
            SELECT COUNT(*) INTO admin_notification_count FROM get_admin_notifications(test_admin_id, 10);
            RAISE NOTICE 'Admin get_admin_notifications: SUCCESS (% notifications)', admin_notification_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Admin get_admin_notifications: FAILED - %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'No admins found for testing';
    END IF;
END $$;

-- Test 8: Check system health
SELECT 
    'System Health' as test_category,
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
    'System Health',
    'Active Connections',
    (SELECT COUNT(*)::text FROM pg_stat_activity WHERE state = 'active')
UNION ALL
SELECT 
    'System Health',
    'Total Tables',
    (SELECT COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public')
UNION ALL
SELECT 
    'System Health',
    'Total Functions',
    (SELECT COUNT(*)::text FROM information_schema.routines WHERE routine_schema = 'public')
UNION ALL
SELECT 
    'System Health',
    'Total Triggers',
    (SELECT COUNT(*)::text FROM information_schema.triggers WHERE trigger_schema = 'public');

-- Test 9: Check for common issues
SELECT 
    'Issue Check' as test_category,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'messages' AND indexname LIKE '%request_id%')
        THEN 'Missing request_id index on messages table'
        WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notifications' AND indexname LIKE '%user_id%')
        THEN 'Missing user_id index on notifications table'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'send_message')
        THEN 'Missing send_message function'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_messages_for_request')
        THEN 'Missing get_messages_for_request function'
        ELSE 'No obvious issues detected'
    END as potential_issue;

-- Test 10: Performance check
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT COUNT(*) FROM messages;

-- Final summary
SELECT 
    'Test Summary' as category,
    'All system tests completed' as status,
    NOW() as test_time;
