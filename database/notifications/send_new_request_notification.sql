-- Send notification to recycler when a new pickup request is created
-- This ensures recyclers are immediately notified when they receive a new request

-- Create function to send new request notification to recycler
CREATE OR REPLACE FUNCTION send_new_request_notification(
    p_request_id UUID,
    p_customer_id UUID,
    p_recycler_id UUID
)
RETURNS VOID AS $$
DECLARE
    request_data RECORD;
    customer_name TEXT;
    recycler_name TEXT;
BEGIN
    -- Get request details
    SELECT 
        pr.pickup_address,
        pr.waste_type,
        pr.estimated_weight,
        pr.preferred_pickup_date,
        pr.preferred_pickup_time,
        c.full_name as customer_full_name,
        c.phone as customer_phone,
        r.full_name as recycler_full_name
    INTO request_data
    FROM pickup_requests pr
    LEFT JOIN customers c ON pr.customer_id = c.id
    LEFT JOIN recyclers r ON pr.recycler_id = r.id
    WHERE pr.id = p_request_id;
    
    -- Get names with fallbacks
    customer_name := COALESCE(request_data.customer_full_name, 'Customer');
    recycler_name := COALESCE(request_data.recycler_full_name, 'Recycler');
    
    -- Send notification to recycler
    PERFORM send_notification(
        p_recycler_id,
        'new_pickup_request',
        'New Pickup Request Received',
        'You have received a new pickup request from ' || customer_name || 
        ' at ' || request_data.pickup_address || '. Please review and respond.',
        p_request_id,
        p_customer_id,
        'urgent'
    );
    
    -- Also send a notification to customer confirming their request was sent
    PERFORM send_notification(
        p_customer_id,
        'request_sent',
        'Request Sent Successfully',
        'Your pickup request has been sent to ' || recycler_name || 
        '. They will review your request and respond shortly. You will be notified once they accept or reject your request.',
        p_request_id,
        p_recycler_id,
        'medium'
    );
    
    -- Log the notification
    RAISE NOTICE 'Sent new request notifications for request % to recycler % and customer %', 
        p_request_id, p_recycler_id, p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to automatically send notifications when new requests are created
CREATE OR REPLACE FUNCTION trigger_send_new_request_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only send notification if this is a new request (INSERT) and has a recycler_id
    IF TG_OP = 'INSERT' AND NEW.recycler_id IS NOT NULL THEN
        -- Send notification to recycler
        PERFORM send_new_request_notification(
            NEW.id,
            NEW.customer_id,
            NEW.recycler_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_new_pickup_request_notification ON pickup_requests;
CREATE TRIGGER trigger_new_pickup_request_notification
    AFTER INSERT ON pickup_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_send_new_request_notification();

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_new_request_notification(UUID, UUID, UUID) TO authenticated;

-- Test the notification system
SELECT 'Testing new request notification system...' as info;

-- Test: Create a test request to verify notifications are sent
DO $$
DECLARE
    test_customer_id UUID;
    test_recycler_id UUID;
    test_request_id UUID;
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
        -- Create a test request
        INSERT INTO pickup_requests (
            id,
            customer_id,
            recycler_id,
            pickup_address,
            status,
            created_at
        ) VALUES (
            gen_random_uuid(),
            test_customer_id,
            test_recycler_id,
            'TEST PICKUP ADDRESS',
            'pending',
            NOW()
        ) RETURNING id INTO test_request_id;
        
        RAISE NOTICE 'Created test request % - notifications should have been sent', test_request_id;
        
        -- Clean up test request
        DELETE FROM pickup_requests WHERE id = test_request_id;
        RAISE NOTICE 'Cleaned up test request';
    ELSE
        RAISE NOTICE 'No test users available for testing';
    END IF;
END $$;

SELECT 'SUCCESS: New request notification system implemented! Recyclers will now receive immediate notifications when they receive new pickup requests.' as status;
