-- Create notification system for when recycler starts navigation

-- Step 1: Create function to send navigation start notification
CREATE OR REPLACE FUNCTION send_navigation_start_notification(
    p_request_id UUID,
    p_recycler_id UUID,
    p_customer_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recycler_name TEXT;
    customer_name TEXT;
    pickup_address TEXT;
BEGIN
    -- Get recycler and customer details
    SELECT r.full_name, c.full_name, pr.pickup_address
    INTO recycler_name, customer_name, pickup_address
    FROM pickup_requests pr
    JOIN recyclers r ON pr.recycler_id = r.id
    JOIN customers c ON pr.customer_id = c.id
    WHERE pr.id = p_request_id;
    
    -- Insert notification for customer
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_request_id,
        created_at
    ) VALUES (
        p_customer_id,
        'navigation_started',
        '🚀 Recycler Started Navigation',
        COALESCE(recycler_name, 'Your recycler') || ' has started navigation to your location at ' || COALESCE(pickup_address, 'your pickup location') || '. You can track their progress in real-time.',
        p_request_id,
        NOW()
    );
    
    RAISE NOTICE 'Navigation start notification sent to customer % for request %', p_customer_id, p_request_id;
END;
$$;

-- Step 2: Create trigger to automatically send notification when status changes to 'in_progress'
CREATE OR REPLACE FUNCTION trigger_navigation_start_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if status changed to 'in_progress' and recycler_id exists
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.recycler_id IS NOT NULL THEN
        -- Send notification to customer
        PERFORM send_navigation_start_notification(
            NEW.id,
            NEW.recycler_id,
            NEW.customer_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 3: Create the trigger
DROP TRIGGER IF EXISTS navigation_start_notification_trigger ON pickup_requests;
CREATE TRIGGER navigation_start_notification_trigger
    AFTER UPDATE ON pickup_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_navigation_start_notification();

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION send_navigation_start_notification(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_navigation_start_notification(UUID, UUID, UUID) TO anon;

-- Step 5: Test the function
SELECT '✅ Navigation notification system created successfully!' as result;

-- Step 6: Test with a sample request (uncomment to test)
/*
-- Update a request to in_progress to test the notification
UPDATE pickup_requests 
SET status = 'in_progress' 
WHERE id = (SELECT id FROM pickup_requests WHERE status = 'confirmed' LIMIT 1);

-- Check if notification was created
SELECT * FROM notifications WHERE type = 'navigation_started' ORDER BY created_at DESC LIMIT 5;
*/


-- Step 1: Create function to send navigation start notification
CREATE OR REPLACE FUNCTION send_navigation_start_notification(
    p_request_id UUID,
    p_recycler_id UUID,
    p_customer_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recycler_name TEXT;
    customer_name TEXT;
    pickup_address TEXT;
BEGIN
    -- Get recycler and customer details
    SELECT r.full_name, c.full_name, pr.pickup_address
    INTO recycler_name, customer_name, pickup_address
    FROM pickup_requests pr
    JOIN recyclers r ON pr.recycler_id = r.id
    JOIN customers c ON pr.customer_id = c.id
    WHERE pr.id = p_request_id;
    
    -- Insert notification for customer
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_request_id,
        created_at
    ) VALUES (
        p_customer_id,
        'navigation_started',
        '🚀 Recycler Started Navigation',
        COALESCE(recycler_name, 'Your recycler') || ' has started navigation to your location at ' || COALESCE(pickup_address, 'your pickup location') || '. You can track their progress in real-time.',
        p_request_id,
        NOW()
    );
    
    RAISE NOTICE 'Navigation start notification sent to customer % for request %', p_customer_id, p_request_id;
END;
$$;

-- Step 2: Create trigger to automatically send notification when status changes to 'in_progress'
CREATE OR REPLACE FUNCTION trigger_navigation_start_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if status changed to 'in_progress' and recycler_id exists
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.recycler_id IS NOT NULL THEN
        -- Send notification to customer
        PERFORM send_navigation_start_notification(
            NEW.id,
            NEW.recycler_id,
            NEW.customer_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 3: Create the trigger
DROP TRIGGER IF EXISTS navigation_start_notification_trigger ON pickup_requests;
CREATE TRIGGER navigation_start_notification_trigger
    AFTER UPDATE ON pickup_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_navigation_start_notification();

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION send_navigation_start_notification(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_navigation_start_notification(UUID, UUID, UUID) TO anon;

-- Step 5: Test the function
SELECT '✅ Navigation notification system created successfully!' as result;

-- Step 6: Test with a sample request (uncomment to test)
/*
-- Update a request to in_progress to test the notification
UPDATE pickup_requests 
SET status = 'in_progress' 
WHERE id = (SELECT id FROM pickup_requests WHERE status = 'confirmed' LIMIT 1);

-- Check if notification was created
SELECT * FROM notifications WHERE type = 'navigation_started' ORDER BY created_at DESC LIMIT 5;
*/
