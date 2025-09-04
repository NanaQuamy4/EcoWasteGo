-- Database triggers for automatic arrival detection
-- This provides real-time arrival detection and notifications

-- Step 1: Create trigger function for arrival detection
CREATE OR REPLACE FUNCTION trigger_arrival_detection()
RETURNS TRIGGER AS $$
DECLARE
    is_arrived BOOLEAN;
    notification_id UUID;
    request_record RECORD;
BEGIN
    -- Only process if recycler location is being updated
    IF TG_OP = 'UPDATE' AND (
        OLD.latitude IS DISTINCT FROM NEW.latitude OR 
        OLD.longitude IS DISTINCT FROM NEW.longitude
    ) THEN
        -- Check if recycler has any in_progress requests
        IF EXISTS (
            SELECT 1 FROM pickup_requests 
            WHERE recycler_id = NEW.id 
            AND status = 'in_progress'
        ) THEN
            -- Check arrival for each in_progress request
            FOR request_record IN 
                SELECT pr.id, pr.pickup_latitude, pr.pickup_longitude
                FROM pickup_requests pr
                WHERE pr.recycler_id = NEW.id 
                AND pr.status = 'in_progress'
                AND pr.pickup_latitude IS NOT NULL 
                AND pr.pickup_longitude IS NOT NULL
            LOOP
                -- Check if recycler has arrived
                is_arrived := check_recycler_arrival(
                    request_record.id,
                    NEW.latitude,
                    NEW.longitude,
                    0.05 -- 50 meters threshold
                );
                
                -- If arrived, update status and send notification
                IF is_arrived THEN
                    -- Update pickup request status
                    UPDATE pickup_requests
                    SET 
                        status = 'arrived',
                        arrived_at = NOW(),
                        arrival_latitude = NEW.latitude,
                        arrival_longitude = NEW.longitude,
                        arrival_verified = TRUE,
                        updated_at = NOW()
                    WHERE id = request_record.id;
                    
                    -- Send arrival notification
                    notification_id := send_arrival_notification(request_record.id);
                    
                    RAISE NOTICE 'Recycler % arrived at pickup location for request %', NEW.id, request_record.id;
                END IF;
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on recyclers table
DROP TRIGGER IF EXISTS trigger_recycler_arrival_detection ON recyclers;
CREATE TRIGGER trigger_recycler_arrival_detection
    AFTER UPDATE OF latitude, longitude ON recyclers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_arrival_detection();

-- Step 3: Create trigger function for arrival notifications
CREATE OR REPLACE FUNCTION trigger_send_arrival_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Only process if status changed to 'arrived'
    IF TG_OP = 'UPDATE' AND OLD.status != 'arrived' AND NEW.status = 'arrived' THEN
        -- Send arrival notification
        notification_id := send_arrival_notification(NEW.id);
        
        RAISE NOTICE 'Arrival notification sent for request %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger on pickup_requests table
DROP TRIGGER IF EXISTS trigger_pickup_arrival_notification ON pickup_requests;
CREATE TRIGGER trigger_pickup_arrival_notification
    AFTER UPDATE OF status ON pickup_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_send_arrival_notification();

-- Step 5: Create function to manually trigger arrival detection
CREATE OR REPLACE FUNCTION trigger_manual_arrival_detection(
    p_recycler_id UUID
) RETURNS TABLE (
    request_id UUID,
    is_arrived BOOLEAN,
    distance_km DECIMAL(10, 3)
) AS $$
DECLARE
    recycler_record RECORD;
    request_record RECORD;
    distance_km DECIMAL(10, 3);
    is_arrived BOOLEAN;
BEGIN
    -- Get recycler current location
    SELECT latitude, longitude INTO recycler_record
    FROM recyclers
    WHERE id = p_recycler_id;
    
    -- Check if recycler location is available
    IF recycler_record.latitude IS NULL OR recycler_record.longitude IS NULL THEN
        RAISE EXCEPTION 'Recycler % location not available', p_recycler_id;
    END IF;
    
    -- Check each in_progress request
    FOR request_record IN 
        SELECT pr.id, pr.pickup_latitude, pr.pickup_longitude
        FROM pickup_requests pr
        WHERE pr.recycler_id = p_recycler_id 
        AND pr.status = 'in_progress'
        AND pr.pickup_latitude IS NOT NULL 
        AND pr.pickup_longitude IS NOT NULL
    LOOP
        -- Calculate distance
        distance_km := calculate_distance(
            recycler_record.latitude,
            recycler_record.longitude,
            request_record.pickup_latitude,
            request_record.pickup_longitude
        );
        
        -- Check if arrived
        is_arrived := distance_km <= 0.05; -- 50 meters
        
        -- Return result
        request_id := request_record.id;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to get recycler arrival status
CREATE OR REPLACE FUNCTION get_recycler_arrival_status(
    p_recycler_id UUID
) RETURNS TABLE (
    request_id UUID,
    customer_name TEXT,
    pickup_address TEXT,
    status VARCHAR(20),
    is_arrived BOOLEAN,
    arrived_at TIMESTAMPTZ,
    current_distance_km DECIMAL(10, 3),
    recycler_latitude DECIMAL(10, 8),
    recycler_longitude DECIMAL(11, 8)
) AS $$
DECLARE
    recycler_record RECORD;
BEGIN
    -- Get recycler current location
    SELECT latitude, longitude INTO recycler_record
    FROM recyclers
    WHERE id = p_recycler_id;
    
    -- Return request details with arrival status
    RETURN QUERY
    SELECT 
        pr.id,
        COALESCE(c.full_name, 'Unknown Customer') as customer_name,
        pr.pickup_address,
        pr.status,
        (pr.status = 'arrived') as is_arrived,
        pr.arrived_at,
        CASE 
            WHEN pr.pickup_latitude IS NOT NULL AND pr.pickup_longitude IS NOT NULL 
                 AND recycler_record.latitude IS NOT NULL AND recycler_record.longitude IS NOT NULL
            THEN calculate_distance(
                recycler_record.latitude,
                recycler_record.longitude,
                pr.pickup_latitude,
                pr.pickup_longitude
            )
            ELSE NULL
        END as current_distance_km,
        recycler_record.latitude,
        recycler_record.longitude
    FROM pickup_requests pr
    LEFT JOIN customers c ON pr.customer_id = c.id
    WHERE pr.recycler_id = p_recycler_id
    AND pr.status IN ('in_progress', 'arrived')
    ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to get customer arrival status
CREATE OR REPLACE FUNCTION get_customer_arrival_status(
    p_customer_id UUID
) RETURNS TABLE (
    request_id UUID,
    recycler_name TEXT,
    pickup_address TEXT,
    status VARCHAR(20),
    is_arrived BOOLEAN,
    arrived_at TIMESTAMPTZ,
    current_distance_km DECIMAL(10, 3),
    recycler_latitude DECIMAL(10, 8),
    recycler_longitude DECIMAL(11, 8)
) AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get the most recent active request for customer
    SELECT pr.*, r.latitude, r.longitude, r.full_name as recycler_name
    INTO request_record
    FROM pickup_requests pr
    LEFT JOIN recyclers r ON pr.recycler_id = r.id
    WHERE pr.customer_id = p_customer_id
    AND pr.status IN ('in_progress', 'arrived')
    ORDER BY pr.created_at DESC
    LIMIT 1;
    
    -- If no active request found
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Return request details with arrival status
    RETURN QUERY
    SELECT 
        request_record.id,
        COALESCE(request_record.recycler_name, 'Unknown Recycler') as recycler_name,
        request_record.pickup_address,
        request_record.status,
        (request_record.status = 'arrived') as is_arrived,
        request_record.arrived_at,
        CASE 
            WHEN request_record.pickup_latitude IS NOT NULL AND request_record.pickup_longitude IS NOT NULL 
                 AND request_record.latitude IS NOT NULL AND request_record.longitude IS NOT NULL
            THEN calculate_distance(
                request_record.latitude,
                request_record.longitude,
                request_record.pickup_latitude,
                request_record.pickup_longitude
            )
            ELSE NULL
        END as current_distance_km,
        request_record.latitude,
        request_record.longitude;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION trigger_manual_arrival_detection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_arrival_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_arrival_status(UUID) TO authenticated;

-- Step 9: Test the triggers
DO $$
DECLARE
    test_customer_id UUID;
    test_recycler_id UUID;
    test_request_id UUID;
    test_notification_id UUID;
BEGIN
    -- Get test users
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    SELECT id INTO test_recycler_id FROM recyclers LIMIT 1;
    
    -- If no test users exist, create them
    IF test_customer_id IS NULL THEN
        INSERT INTO customers (id, full_name, phone, email, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Test Customer', '+233000000000', 'test@example.com', NOW(), NOW())
        RETURNING id INTO test_customer_id;
    END IF;
    
    IF test_recycler_id IS NULL THEN
        INSERT INTO recyclers (id, full_name, phone, email, verification_status, is_online, is_available, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Test Recycler', '+233000000001', 'recycler@example.com', 'approved', true, true, NOW(), NOW())
        RETURNING id INTO test_recycler_id;
    END IF;
    
    -- Create a test request
    INSERT INTO pickup_requests (
        id,
        customer_id,
        recycler_id,
        pickup_address,
        pickup_latitude,
        pickup_longitude,
        status,
        waste_type,
        waste_quantity,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        test_customer_id,
        test_recycler_id,
        'Test Pickup Location',
        6.6734, -- Kumasi coordinates
        -1.5714,
        'in_progress',
        'plastic',
        'small',
        NOW(),
        NOW()
    ) RETURNING id INTO test_request_id;
    
    -- Test manual arrival detection
    PERFORM * FROM trigger_manual_arrival_detection(test_recycler_id);
    RAISE NOTICE 'Manual arrival detection test completed';
    
    -- Test recycler arrival status
    PERFORM * FROM get_recycler_arrival_status(test_recycler_id);
    RAISE NOTICE 'Recycler arrival status test completed';
    
    -- Test customer arrival status
    PERFORM * FROM get_customer_arrival_status(test_customer_id);
    RAISE NOTICE 'Customer arrival status test completed';
    
    -- Clean up test data
    DELETE FROM notifications WHERE related_request_id = test_request_id;
    DELETE FROM pickup_requests WHERE id = test_request_id;
    DELETE FROM customers WHERE id = test_customer_id AND full_name = 'Test Customer';
    DELETE FROM recyclers WHERE id = test_recycler_id AND full_name = 'Test Recycler';
    
    RAISE NOTICE 'Trigger test completed and cleaned up';
END $$;

-- Final verification
SELECT 'SUCCESS: Arrival detection triggers created and tested!' as status;
