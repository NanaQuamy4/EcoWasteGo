-- Test the messaging system to ensure it's working properly
-- This will help debug why messages aren't loading in the text screens

-- Step 1: Check if messages table exists and has data
SELECT 'Checking messages table...' as status;
SELECT COUNT(*) as message_count FROM messages;

-- Step 2: Check if pickup_requests table has data
SELECT 'Checking pickup_requests table...' as status;
SELECT COUNT(*) as request_count FROM pickup_requests;

-- Step 3: Test the get_messages_for_request function
SELECT 'Testing get_messages_for_request function...' as status;
DO $$
DECLARE
    test_request_id UUID;
    test_customer_id UUID;
    test_recycler_id UUID;
    message_count INTEGER;
BEGIN
    -- Get a test request
    SELECT id, customer_id, recycler_id 
    INTO test_request_id, test_customer_id, test_recycler_id
    FROM pickup_requests 
    WHERE customer_id IS NOT NULL AND recycler_id IS NOT NULL 
    LIMIT 1;
    
    IF test_request_id IS NOT NULL THEN
        RAISE NOTICE 'Found test request: %', test_request_id;
        RAISE NOTICE 'Customer ID: %', test_customer_id;
        RAISE NOTICE 'Recycler ID: %', test_recycler_id;
        
        -- Test customer access
        BEGIN
            SELECT COUNT(*) INTO message_count
            FROM get_messages_for_request(test_request_id, test_customer_id, 'customer');
            RAISE NOTICE 'Customer can access % messages', message_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Customer access failed: %', SQLERRM;
        END;
        
        -- Test recycler access
        BEGIN
            SELECT COUNT(*) INTO message_count
            FROM get_messages_for_request(test_request_id, test_recycler_id, 'recycler');
            RAISE NOTICE 'Recycler can access % messages', message_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Recycler access failed: %', SQLERRM;
        END;
        
        -- Show actual messages
        RAISE NOTICE 'Messages for this request:';
        -- Just count the messages instead of looping
        SELECT COUNT(*) INTO message_count
        FROM get_messages_for_request(test_request_id, test_customer_id, 'customer');
        RAISE NOTICE 'Total messages found: %', message_count;
        
    ELSE
        RAISE NOTICE 'No test data available';
    END IF;
END $$;

-- Step 4: Check if send_message function works
SELECT 'Testing send_message function...' as status;
DO $$
DECLARE
    test_request_id UUID;
    test_customer_id UUID;
    test_recycler_id UUID;
    message_id UUID;
BEGIN
    -- Get a test request
    SELECT id, customer_id, recycler_id 
    INTO test_request_id, test_customer_id, test_recycler_id
    FROM pickup_requests 
    WHERE customer_id IS NOT NULL AND recycler_id IS NOT NULL 
    LIMIT 1;
    
    IF test_request_id IS NOT NULL THEN
        -- Test sending a message
        SELECT send_message(test_request_id, test_customer_id, 'customer', 'Test message from database') INTO message_id;
        RAISE NOTICE 'Test message sent with ID: %', message_id;
        
        -- Check if message was created
        IF EXISTS (SELECT 1 FROM messages WHERE id = message_id) THEN
            RAISE NOTICE 'SUCCESS: Message was created in database';
        ELSE
            RAISE NOTICE 'ERROR: Message was not created in database';
        END IF;
        
        -- Check if notification was created
        IF EXISTS (SELECT 1 FROM notifications WHERE related_request_id = test_request_id AND type = 'message_received') THEN
            RAISE NOTICE 'SUCCESS: Notification was created';
        ELSE
            RAISE NOTICE 'WARNING: No notification found';
        END IF;
        
    ELSE
        RAISE NOTICE 'No test data available for send_message test';
    END IF;
END $$;

-- Step 5: Show recent messages
SELECT 'Recent messages:' as status;
SELECT 
    m.id,
    m.sender_type,
    LEFT(m.message, 50) as message_preview,
    m.created_at,
    pr.customer_id,
    pr.recycler_id
FROM messages m
JOIN pickup_requests pr ON m.request_id = pr.id
ORDER BY m.created_at DESC
LIMIT 10;

-- Step 6: Show recent notifications
SELECT 'Recent notifications:' as status;
SELECT 
    n.id,
    n.type,
    n.title,
    LEFT(n.message, 50) as message_preview,
    n.created_at,
    n.user_id
FROM notifications n
WHERE n.type = 'message_received'
ORDER BY n.created_at DESC
LIMIT 10;

SELECT 'Messaging system test completed!' as status;
