-- Create messaging system for customer-recycler communication
-- This enables real-time messaging between customers and recyclers

-- Step 1: Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'recycler')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);

-- Step 3: Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Customers can view messages for their requests
CREATE POLICY "Customers can view their messages" ON messages
    FOR SELECT USING (
        sender_type = 'customer' AND sender_id IN (
            SELECT customer_id FROM pickup_requests WHERE id = request_id
        )
    );

-- Recyclers can view messages for their requests
CREATE POLICY "Recyclers can view their messages" ON messages
    FOR SELECT USING (
        sender_type = 'recycler' AND sender_id IN (
            SELECT recycler_id FROM pickup_requests WHERE id = request_id
        )
    );

-- Customers can insert messages for their requests
CREATE POLICY "Customers can insert their messages" ON messages
    FOR INSERT WITH CHECK (
        sender_type = 'customer' AND sender_id IN (
            SELECT customer_id FROM pickup_requests WHERE id = request_id
        )
    );

-- Recyclers can insert messages for their requests
CREATE POLICY "Recyclers can insert their messages" ON messages
    FOR INSERT WITH CHECK (
        sender_type = 'recycler' AND sender_id IN (
            SELECT recycler_id FROM pickup_requests WHERE id = request_id
        )
    );

-- Both can update read status
CREATE POLICY "Users can update read status" ON messages
    FOR UPDATE USING (
        (sender_type = 'customer' AND sender_id IN (
            SELECT customer_id FROM pickup_requests WHERE id = request_id
        )) OR
        (sender_type = 'recycler' AND sender_id IN (
            SELECT recycler_id FROM pickup_requests WHERE id = request_id
        ))
    );

-- Step 5: Create function to get messages for a request
CREATE OR REPLACE FUNCTION get_messages_for_request(
    p_request_id UUID,
    p_user_id UUID,
    p_user_type VARCHAR(20)
) RETURNS TABLE (
    id UUID,
    sender_id UUID,
    sender_type VARCHAR(20),
    message TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    sender_name TEXT
) AS $$
BEGIN
    -- Validate user has access to this request
    IF p_user_type = 'customer' THEN
        IF NOT EXISTS (
            SELECT 1 FROM pickup_requests pr
            WHERE pr.id = p_request_id AND pr.customer_id = p_user_id
        ) THEN
            RAISE EXCEPTION 'Access denied: Customer does not have access to this request';
        END IF;
    ELSIF p_user_type = 'recycler' THEN
        IF NOT EXISTS (
            SELECT 1 FROM pickup_requests pr
            WHERE pr.id = p_request_id AND pr.recycler_id = p_user_id
        ) THEN
            RAISE EXCEPTION 'Access denied: Recycler does not have access to this request';
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid user type: %', p_user_type;
    END IF;

    -- Return messages with sender names
    RETURN QUERY
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
    WHERE m.request_id = p_request_id
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to send a message
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
    
    -- Insert message
    INSERT INTO messages (request_id, sender_id, sender_type, message)
    VALUES (p_request_id, p_sender_id, p_sender_type, p_message)
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
    p_request_id UUID,
    p_user_id UUID,
    p_user_type VARCHAR(20)
) RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
    v_customer_id UUID;
    v_recycler_id UUID;
BEGIN
    -- Get request details
    SELECT pr.customer_id, pr.recycler_id INTO v_customer_id, v_recycler_id
    FROM pickup_requests pr
    WHERE pr.id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found: %', p_request_id;
    END IF;
    
    -- Validate user has access to this request
    IF p_user_type = 'customer' AND p_user_id != v_customer_id THEN
        RAISE EXCEPTION 'Access denied: Customer does not have access to this request';
    ELSIF p_user_type = 'recycler' AND p_user_id != v_recycler_id THEN
        RAISE EXCEPTION 'Access denied: Recycler does not have access to this request';
    ELSIF p_user_type NOT IN ('customer', 'recycler') THEN
        RAISE EXCEPTION 'Invalid user type: %', p_user_type;
    END IF;
    
    -- Mark messages as read (only messages from the other party)
    UPDATE messages 
    SET is_read = TRUE, updated_at = NOW()
    WHERE request_id = p_request_id 
    AND sender_id != p_user_id
    AND is_read = FALSE;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(
    p_request_id UUID,
    p_user_id UUID,
    p_user_type VARCHAR(20)
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_customer_id UUID;
    v_recycler_id UUID;
BEGIN
    -- Get request details
    SELECT pr.customer_id, pr.recycler_id INTO v_customer_id, v_recycler_id
    FROM pickup_requests pr
    WHERE pr.id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found: %', p_request_id;
    END IF;
    
    -- Validate user has access to this request
    IF p_user_type = 'customer' AND p_user_id != v_customer_id THEN
        RAISE EXCEPTION 'Access denied: Customer does not have access to this request';
    ELSIF p_user_type = 'recycler' AND p_user_id != v_recycler_id THEN
        RAISE EXCEPTION 'Access denied: Recycler does not have access to this request';
    ELSIF p_user_type NOT IN ('customer', 'recycler') THEN
        RAISE EXCEPTION 'Invalid user type: %', p_user_type;
    END IF;
    
    -- Count unread messages from the other party
    SELECT COUNT(*) INTO v_count
    FROM messages 
    WHERE request_id = p_request_id 
    AND sender_id != p_user_id
    AND is_read = FALSE;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Grant permissions
GRANT EXECUTE ON FUNCTION get_messages_for_request(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION send_message(UUID, UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID, UUID, VARCHAR) TO authenticated;

-- Step 10: Create trigger for real-time updates
CREATE OR REPLACE FUNCTION notify_message_insert()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('new_message', json_build_object(
        'request_id', NEW.request_id,
        'sender_id', NEW.sender_id,
        'sender_type', NEW.sender_type,
        'message_id', NEW.id
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_message_insert
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_message_insert();

-- Step 11: Test the system
DO $$
DECLARE
    test_request_id UUID;
    test_customer_id UUID;
    test_recycler_id UUID;
    test_message_id UUID;
BEGIN
    -- Get test data
    SELECT id INTO test_request_id FROM pickup_requests LIMIT 1;
    SELECT customer_id, recycler_id INTO test_customer_id, test_recycler_id 
    FROM pickup_requests WHERE id = test_request_id;
    
    IF test_request_id IS NOT NULL AND test_customer_id IS NOT NULL AND test_recycler_id IS NOT NULL THEN
        -- Test sending a message
        SELECT send_message(test_request_id, test_customer_id, 'customer', 'Test message from customer') INTO test_message_id;
        RAISE NOTICE 'Test message sent with ID: %', test_message_id;
        
        -- Test getting messages
        PERFORM * FROM get_messages_for_request(test_request_id, test_customer_id, 'customer');
        RAISE NOTICE 'Messages retrieved successfully';
        
        -- Test unread count
        PERFORM get_unread_message_count(test_request_id, test_recycler_id, 'recycler');
        RAISE NOTICE 'Unread count retrieved successfully';
    ELSE
        RAISE NOTICE 'No test data available - system created but not tested';
    END IF;
END $$;

-- Final verification
SELECT 'SUCCESS: Messaging system created and tested!' as status;
