-- Fix message notifications - add notification sending to message system
-- This will ensure recipients get notified when they receive messages

-- Step 1: Update the send_message function to send notifications
CREATE OR REPLACE FUNCTION send_message(
    p_request_id UUID,
    p_sender_id UUID,
    p_sender_type VARCHAR(20),
    p_message TEXT
) RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
    v_customer_id UUID;
    v_recycler_id UUID;
    v_recipient_id UUID;
    v_sender_name TEXT;
    v_recipient_type VARCHAR(20);
BEGIN
    -- Get request details
    SELECT pr.customer_id, pr.recycler_id INTO v_customer_id, v_recycler_id
    FROM pickup_requests pr
    WHERE pr.id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found: %', p_request_id;
    END IF;
    
    -- Validate sender has access to this request
    IF p_sender_type = 'customer' AND p_sender_id != v_customer_id THEN
        RAISE EXCEPTION 'Access denied: Customer does not have access to this request';
    ELSIF p_sender_type = 'recycler' AND p_sender_id != v_recycler_id THEN
        RAISE EXCEPTION 'Access denied: Recycler does not have access to this request';
    ELSIF p_sender_type NOT IN ('customer', 'recycler') THEN
        RAISE EXCEPTION 'Invalid sender type: %', p_sender_type;
    END IF;
    
    -- Determine recipient and sender name
    IF p_sender_type = 'customer' THEN
        v_recipient_id := v_recycler_id;
        v_recipient_type := 'recycler';
        -- Get customer name
        SELECT full_name INTO v_sender_name FROM customers WHERE id = p_sender_id;
    ELSE
        v_recipient_id := v_customer_id;
        v_recipient_type := 'customer';
        -- Get recycler name
        SELECT full_name INTO v_sender_name FROM recyclers WHERE id = p_sender_id;
    END IF;
    
    -- Insert message
    INSERT INTO messages (request_id, sender_id, sender_type, message)
    VALUES (p_request_id, p_sender_id, p_sender_type, p_message)
    RETURNING id INTO v_message_id;
    
    -- Send notification to recipient
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        related_request_id,
        related_user_id,
        priority
    ) VALUES (
        v_recipient_id,
        'message_received',
        'New Message from ' || COALESCE(v_sender_name, 'Unknown'),
        'You received a message: "' || LEFT(p_message, 100) || CASE WHEN LENGTH(p_message) > 100 THEN '..."' ELSE '"' END,
        false,
        p_request_id,
        p_sender_id,
        'medium'
    );
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a function to send message notifications (for existing messages)
CREATE OR REPLACE FUNCTION send_message_notification(
    p_message_id UUID
) RETURNS VOID AS $$
DECLARE
    v_message_record RECORD;
    v_recipient_id UUID;
    v_sender_name TEXT;
    v_recipient_type VARCHAR(20);
BEGIN
    -- Get message details
    SELECT 
        m.request_id,
        m.sender_id,
        m.sender_type,
        m.message,
        pr.customer_id,
        pr.recycler_id
    INTO v_message_record
    FROM messages m
    JOIN pickup_requests pr ON m.request_id = pr.id
    WHERE m.id = p_message_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Message not found: %', p_message_id;
    END IF;
    
    -- Determine recipient
    IF v_message_record.sender_type = 'customer' THEN
        v_recipient_id := v_message_record.recycler_id;
        v_recipient_type := 'recycler';
        -- Get customer name
        SELECT full_name INTO v_sender_name FROM customers WHERE id = v_message_record.sender_id;
    ELSE
        v_recipient_id := v_message_record.customer_id;
        v_recipient_type := 'customer';
        -- Get recycler name
        SELECT full_name INTO v_sender_name FROM recyclers WHERE id = v_message_record.sender_id;
    END IF;
    
    -- Send notification to recipient
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        related_request_id,
        related_user_id,
        priority
    ) VALUES (
        v_recipient_id,
        'message_received',
        'New Message from ' || COALESCE(v_sender_name, 'Unknown'),
        'You received a message: "' || LEFT(v_message_record.message, 100) || CASE WHEN LENGTH(v_message_record.message) > 100 THEN '..."' ELSE '"' END,
        false,
        v_message_record.request_id,
        v_message_record.sender_id,
        'medium'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION send_message(UUID, UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message_notification(UUID) TO authenticated;

-- Step 4: Test the updated function
DO $$
DECLARE
    test_request_id UUID;
    test_customer_id UUID;
    test_recycler_id UUID;
    test_message_id UUID;
BEGIN
    -- Get test data
    SELECT id, customer_id, recycler_id 
    INTO test_request_id, test_customer_id, test_recycler_id
    FROM pickup_requests 
    WHERE customer_id IS NOT NULL AND recycler_id IS NOT NULL 
    LIMIT 1;
    
    IF test_request_id IS NOT NULL THEN
        -- Test sending a message (this should now create a notification)
        SELECT send_message(test_request_id, test_customer_id, 'customer', 'Test message with notification') INTO test_message_id;
        RAISE NOTICE 'Test message sent with ID: %', test_message_id;
        
        -- Check if notification was created
        IF EXISTS (SELECT 1 FROM notifications WHERE related_request_id = test_request_id AND type = 'message_received') THEN
            RAISE NOTICE 'SUCCESS: Message notification was created!';
        ELSE
            RAISE NOTICE 'WARNING: No message notification found';
        END IF;
    ELSE
        RAISE NOTICE 'No test data available for testing';
    END IF;
END $$;

-- Step 5: Show success message
SELECT 'SUCCESS: Message notification system updated!' as status;
SELECT 'Messages will now send notifications to recipients.' as message;
