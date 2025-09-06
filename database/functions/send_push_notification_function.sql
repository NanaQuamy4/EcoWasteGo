-- Create function to send push notifications when recycler arrives
CREATE OR REPLACE FUNCTION send_push_notification_on_arrival(
    p_request_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
    customer_token RECORD;
    notification_sent BOOLEAN := FALSE;
BEGIN
    -- Get request details with customer info
    SELECT 
        pr.id,
        pr.customer_id,
        pr.recycler_id,
        pr.pickup_address,
        pr.status,
        pr.arrived_at,
        c.full_name as customer_name,
        c.phone as customer_phone,
        r.full_name as recycler_name,
        r.phone as recycler_phone
    INTO request_record
    FROM pickup_requests pr
    LEFT JOIN customers c ON pr.customer_id = c.id
    LEFT JOIN recyclers r ON pr.recycler_id = r.id
    WHERE pr.id = p_request_id;
    
    -- Check if request exists and is in arrived status
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pickup request % not found', p_request_id;
    END IF;
    
    IF request_record.status != 'arrived' THEN
        RAISE EXCEPTION 'Request % is not in arrived status (current: %)', p_request_id, request_record.status;
    END IF;
    
    -- Get customer's push token
    SELECT push_token INTO customer_token
    FROM user_push_tokens
    WHERE user_id = request_record.customer_id
    AND is_active = TRUE
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If customer has push token, send notification
    IF FOUND AND customer_token.push_token IS NOT NULL THEN
        -- Send push notification via HTTP request to Expo Push API
        PERFORM send_expo_push_notification(
            customer_token.push_token,
            '🎯 Recycler Has Arrived!',
            'Your recycler ' || COALESCE(request_record.recycler_name, 'Recycler') || 
            ' has arrived at your pickup location (' || request_record.pickup_address || '). ' ||
            'Please prepare your waste for collection.',
            json_build_object(
                'type', 'recycler_arrived',
                'request_id', p_request_id,
                'recycler_name', request_record.recycler_name,
                'pickup_address', request_record.pickup_address
            )
        );
        
        notification_sent := TRUE;
        RAISE NOTICE 'Push notification sent to customer % for request %', 
            request_record.customer_id, p_request_id;
    ELSE
        RAISE NOTICE 'No push token found for customer %', request_record.customer_id;
    END IF;
    
    RETURN notification_sent;
END;
$$ LANGUAGE plpgsql;

-- Create function to send Expo push notifications via HTTP
CREATE OR REPLACE FUNCTION send_expo_push_notification(
    p_push_token TEXT,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    request_body TEXT;
    response_status INTEGER;
    response_body TEXT;
BEGIN
    -- Build request body
    request_body := json_build_object(
        'to', p_push_token,
        'title', p_title,
        'body', p_body,
        'sound', 'default',
        'badge', 1,
        'data', COALESCE(p_data, '{}'::jsonb)
    )::text;
    
    -- Send HTTP request to Expo Push API
    SELECT status, content INTO response_status, response_body
    FROM http((
        'POST',
        'https://exp.host/--/api/v2/push/send',
        ARRAY[
            http_header('Accept', 'application/json'),
            http_header('Accept-encoding', 'gzip, deflate'),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        request_body
    ));
    
    -- Check if request was successful
    IF response_status = 200 THEN
        RAISE NOTICE 'Push notification sent successfully: %', response_body;
        RETURN TRUE;
    ELSE
        RAISE WARNING 'Failed to send push notification. Status: %, Response: %', 
            response_status, response_body;
        RETURN FALSE;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error sending push notification: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to send push notification for payment received
CREATE OR REPLACE FUNCTION send_push_notification_on_payment(
    p_request_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
    customer_token RECORD;
    payment_record RECORD;
    notification_sent BOOLEAN := FALSE;
BEGIN
    -- Get request and payment details
    SELECT 
        pr.id,
        pr.customer_id,
        pr.recycler_id,
        c.full_name as customer_name,
        r.full_name as recycler_name,
        ps.base_amount,
        ps.platform_fee,
        ps.total_amount
    INTO request_record
    FROM pickup_requests pr
    LEFT JOIN customers c ON pr.customer_id = c.id
    LEFT JOIN recyclers r ON pr.recycler_id = r.id
    LEFT JOIN payment_summaries ps ON pr.id = ps.request_id
    WHERE pr.id = p_request_id;
    
    -- Check if request and payment exist
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pickup request or payment % not found', p_request_id;
    END IF;
    
    -- Get customer's push token
    SELECT push_token INTO customer_token
    FROM user_push_tokens
    WHERE user_id = request_record.customer_id
    AND is_active = TRUE
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If customer has push token, send notification
    IF FOUND AND customer_token.push_token IS NOT NULL THEN
        -- Send push notification
        PERFORM send_expo_push_notification(
            customer_token.push_token,
            '💰 Payment Received!',
            'You''ve received ₵' || COALESCE(request_record.total_amount, 0) || 
            ' from ' || COALESCE(request_record.recycler_name, 'Recycler') || 
            ' for your waste collection.',
            json_build_object(
                'type', 'payment_received',
                'request_id', p_request_id,
                'amount', request_record.total_amount,
                'recycler_name', request_record.recycler_name
            )
        );
        
        notification_sent := TRUE;
        RAISE NOTICE 'Payment notification sent to customer % for request %', 
            request_record.customer_id, p_request_id;
    ELSE
        RAISE NOTICE 'No push token found for customer %', request_record.customer_id;
    END IF;
    
    RETURN notification_sent;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_push_notification_on_arrival(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_push_notification_on_arrival(UUID) TO anon;
GRANT EXECUTE ON FUNCTION send_expo_push_notification(TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION send_expo_push_notification(TEXT, TEXT, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION send_push_notification_on_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_push_notification_on_payment(UUID) TO anon;
