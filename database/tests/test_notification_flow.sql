-- Test the complete notification flow for pickup requests
-- This script tests that notifications are sent at the right times

-- Test 1: Check current notification system status
SELECT 'Testing notification system...' as test_name;

-- Test 2: Create a test pickup request and verify notifications are sent
DO $$
DECLARE
    test_customer_id UUID;
    test_recycler_id UUID;
    test_request_id UUID;
    notification_count_before INTEGER;
    notification_count_after INTEGER;
    notification RECORD;
BEGIN
    -- Get test user IDs
    SELECT id INTO test_customer_id FROM auth.users WHERE email LIKE '%customer%' LIMIT 1;
    SELECT id INTO test_recycler_id FROM auth.users WHERE email LIKE '%recycler%' LIMIT 1;
    
    -- If no specific test users, get any users
    IF test_customer_id IS NULL THEN
        SELECT id INTO test_customer_id FROM auth.users LIMIT 1;
    END IF;
    
    IF test_recycler_id IS NULL THEN
        SELECT id INTO test_recycler_id FROM auth.users OFFSET 1 LIMIT 1;
    END IF;
    
    -- If we have both customer and recycler
    IF test_customer_id IS NOT NULL AND test_recycler_id IS NOT NULL THEN
        -- Count notifications before
        SELECT COUNT(*) INTO notification_count_before FROM notifications;
        
        -- Create a test request (this should trigger new request notification)
        INSERT INTO pickup_requests (
            id,
            customer_id,
            recycler_id,
            pickup_address,
            waste_type,
            estimated_weight,
            status,
            preferred_pickup_date,
            preferred_pickup_time,
            created_at
        ) VALUES (
            gen_random_uuid(),
            test_customer_id,
            test_recycler_id,
            'TEST PICKUP ADDRESS - Notification Test',
            'Mixed Waste',
            20.0,
            'pending',
            CURRENT_DATE,
            '15:00'::time,
            NOW()
        ) RETURNING id INTO test_request_id;
        
        -- Count notifications after creation
        SELECT COUNT(*) INTO notification_count_after FROM notifications;
        
        RAISE NOTICE 'Created test request % - Notifications before: %, after: %', 
            test_request_id, notification_count_before, notification_count_after;
        
        -- Check what notifications were created
        RAISE NOTICE 'New Request Notifications:';
        FOR notification IN 
            SELECT n.type, n.title, n.priority, n.created_at
            FROM notifications n
            WHERE n.related_request_id = test_request_id
            ORDER BY n.created_at DESC
        LOOP
            RAISE NOTICE '  Type: %, Title: %, Priority: %, Created: %', 
                notification.type, notification.title, notification.priority, notification.created_at;
        END LOOP;
        
        -- Now update status to confirmed (this should trigger confirmation notifications)
        UPDATE pickup_requests 
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = test_request_id;
        
        -- Check what additional notifications were created
        RAISE NOTICE 'Confirmation Notifications:';
        FOR notification IN 
            SELECT n.type, n.title, n.priority, n.created_at
            FROM notifications n
            WHERE n.related_request_id = test_request_id
            ORDER BY n.created_at DESC
        LOOP
            RAISE NOTICE '  Type: %, Title: %, Priority: %, Created: %', 
                notification.type, notification.title, notification.priority, notification.created_at;
        END LOOP;
        
        -- Clean up test request and notifications
        DELETE FROM notifications WHERE related_request_id = test_request_id;
        DELETE FROM pickup_requests WHERE id = test_request_id;
        
        RAISE NOTICE 'Cleaned up test request and notifications';
    ELSE
        RAISE NOTICE 'No test users available for testing';
    END IF;
END $$;

-- Test 3: Check notification system functions
DO $$
BEGIN
    RAISE NOTICE 'Notification System Status:';
    RAISE NOTICE '  send_notification function: %', 
        CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_notification') 
             THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  send_new_request_notification function: %', 
        CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_new_request_notification') 
             THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  New request trigger: %', 
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_new_pickup_request_notification') 
             THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  Status change trigger: %', 
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_pickup_request_notifications') 
             THEN 'EXISTS' ELSE 'MISSING' END;
END $$;

-- Test 4: Check recent notifications (if any exist)
DO $$
DECLARE
    notification RECORD;
    notification_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notification_count FROM notifications;
    RAISE NOTICE 'Recent Notifications (Total: %):', notification_count;
    
    FOR notification IN 
        SELECT n.type, n.title, n.priority, n.created_at
        FROM notifications n
        ORDER BY n.created_at DESC
        LIMIT 5
    LOOP
        RAISE NOTICE '  Type: %, Title: %, Priority: %, Created: %', 
            notification.type, notification.title, notification.priority, notification.created_at;
    END LOOP;
END $$;

SELECT 'Notification flow test completed!' as status;
