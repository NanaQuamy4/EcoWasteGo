-- Database functions for arrival detection and location verification
-- This provides server-side arrival detection capabilities

-- Step 1: Create distance calculation function
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(10, 3) AS $$
DECLARE
    R DECIMAL := 6371; -- Earth's radius in kilometers
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
    distance DECIMAL(10, 3);
BEGIN
    -- Convert degrees to radians
    dLat := (lat2 - lat1) * PI() / 180;
    dLon := (lon2 - lon1) * PI() / 180;
    
    -- Haversine formula
    a := SIN(dLat/2) * SIN(dLat/2) + 
         COS(lat1 * PI() / 180) * COS(lat2 * PI() / 180) * 
         SIN(dLon/2) * SIN(dLon/2);
    
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    distance := R * c;
    
    RETURN distance;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create arrival detection function
CREATE OR REPLACE FUNCTION check_recycler_arrival(
    p_request_id UUID,
    p_recycler_latitude DECIMAL(10, 8),
    p_recycler_longitude DECIMAL(11, 8),
    p_arrival_threshold DECIMAL DEFAULT 0.05 -- 50 meters in kilometers
) RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
    distance_km DECIMAL(10, 3);
BEGIN
    -- Get pickup request details
    SELECT 
        id,
        customer_id,
        recycler_id,
        pickup_latitude,
        pickup_longitude,
        status
    INTO request_record
    FROM pickup_requests
    WHERE id = p_request_id;
    
    -- Check if request exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pickup request % not found', p_request_id;
    END IF;
    
    -- Check if request is in correct status
    IF request_record.status != 'in_progress' THEN
        RAISE EXCEPTION 'Request % is not in progress (current status: %)', p_request_id, request_record.status;
    END IF;
    
    -- Check if pickup location is available
    IF request_record.pickup_latitude IS NULL OR request_record.pickup_longitude IS NULL THEN
        RAISE EXCEPTION 'Pickup location coordinates not available for request %', p_request_id;
    END IF;
    
    -- Calculate distance
    distance_km := calculate_distance(
        p_recycler_latitude,
        p_recycler_longitude,
        request_record.pickup_latitude,
        request_record.pickup_longitude
    );
    
    -- Check if within arrival threshold
    RETURN distance_km <= p_arrival_threshold;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create function to update pickup status on arrival
CREATE OR REPLACE FUNCTION update_pickup_status_on_arrival(
    p_request_id UUID,
    p_recycler_latitude DECIMAL(10, 8),
    p_recycler_longitude DECIMAL(11, 8),
    p_arrival_threshold DECIMAL DEFAULT 0.05
) RETURNS BOOLEAN AS $$
DECLARE
    is_arrived BOOLEAN;
    request_record RECORD;
BEGIN
    -- Check if recycler has arrived
    is_arrived := check_recycler_arrival(
        p_request_id,
        p_recycler_latitude,
        p_recycler_longitude,
        p_arrival_threshold
    );
    
    -- If arrived, update the status
    IF is_arrived THEN
        UPDATE pickup_requests
        SET 
            status = 'arrived',
            arrived_at = NOW(),
            arrival_latitude = p_recycler_latitude,
            arrival_longitude = p_recycler_longitude,
            arrival_verified = TRUE,
            updated_at = NOW()
        WHERE id = p_request_id;
        
        -- Get updated request details for logging
        SELECT * INTO request_record FROM pickup_requests WHERE id = p_request_id;
        
        -- Send arrival notification to customer
        PERFORM send_arrival_notification(p_request_id);
        
        RAISE NOTICE 'Recycler arrived at pickup location for request %', p_request_id;
        RAISE NOTICE 'Arrival coordinates: %, %', p_recycler_latitude, p_recycler_longitude;
        RAISE NOTICE 'Arrival time: %', request_record.arrived_at;
        RAISE NOTICE 'Arrival notification sent to customer';
        
        RETURN TRUE;
    ELSE
        -- Get current distance for logging
        SELECT 
            calculate_distance(
                p_recycler_latitude,
                p_recycler_longitude,
                pickup_latitude,
                pickup_longitude
            ) as current_distance
        INTO request_record
        FROM pickup_requests
        WHERE id = p_request_id;
        
        RAISE NOTICE 'Recycler not yet arrived. Current distance: % km (threshold: % km)', 
            request_record.current_distance, p_arrival_threshold;
        
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to send arrival notification
CREATE OR REPLACE FUNCTION send_arrival_notification(
    p_request_id UUID
) RETURNS UUID AS $$
DECLARE
    request_record RECORD;
    notification_id UUID;
BEGIN
    -- Get request details with customer and recycler info
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
    
    -- Send notification to customer
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_request_id,
        related_user_id,
        priority
    ) VALUES (
        request_record.customer_id,
        'recycler_arrived',
        '🎯 Recycler Has Arrived!',
        'Your recycler ' || COALESCE(request_record.recycler_name, 'Recycler') || 
        ' has arrived at your pickup location (' || request_record.pickup_address || '). ' ||
        'Please prepare your waste for collection.',
        p_request_id,
        request_record.recycler_id,
        'high'
    ) RETURNING id INTO notification_id;
    
    -- Send notification to recycler
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_request_id,
        related_user_id,
        priority
    ) VALUES (
        request_record.recycler_id,
        'recycler_arrived',
        '🎯 You Have Arrived!',
        'You have arrived at the pickup location (' || request_record.pickup_address || '). ' ||
        'Please contact the customer and begin waste collection.',
        p_request_id,
        request_record.customer_id,
        'high'
    );
    
    RAISE NOTICE 'Arrival notifications sent to customer % and recycler % for request %', 
        request_record.customer_id, request_record.recycler_id, p_request_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to validate arrival location
CREATE OR REPLACE FUNCTION validate_arrival_location(
    p_request_id UUID,
    p_recycler_latitude DECIMAL(10, 8),
    p_recycler_longitude DECIMAL(11, 8),
    p_verification_threshold DECIMAL DEFAULT 0.01 -- 10 meters
) RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
    distance_km DECIMAL(10, 3);
BEGIN
    -- Get request details
    SELECT 
        id,
        pickup_latitude,
        pickup_longitude,
        arrival_latitude,
        arrival_longitude,
        status
    INTO request_record
    FROM pickup_requests
    WHERE id = p_request_id;
    
    -- Check if request exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pickup request % not found', p_request_id;
    END IF;
    
    -- Check if request is in arrived status
    IF request_record.status != 'arrived' THEN
        RAISE EXCEPTION 'Request % is not in arrived status (current: %)', p_request_id, request_record.status;
    END IF;
    
    -- Check if arrival coordinates exist
    IF request_record.arrival_latitude IS NULL OR request_record.arrival_longitude IS NULL THEN
        RAISE EXCEPTION 'Arrival coordinates not recorded for request %', p_request_id;
    END IF;
    
    -- Calculate distance between current location and recorded arrival location
    distance_km := calculate_distance(
        p_recycler_latitude,
        p_recycler_longitude,
        request_record.arrival_latitude,
        request_record.arrival_longitude
    );
    
    -- Verify if within threshold
    RETURN distance_km <= p_verification_threshold;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to get arrival status
CREATE OR REPLACE FUNCTION get_arrival_status(
    p_request_id UUID
) RETURNS TABLE (
    request_id UUID,
    status VARCHAR(20),
    is_arrived BOOLEAN,
    arrived_at TIMESTAMPTZ,
    arrival_latitude DECIMAL(10, 8),
    arrival_longitude DECIMAL(11, 8),
    arrival_verified BOOLEAN,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.status,
        (pr.status = 'arrived') as is_arrived,
        pr.arrived_at,
        pr.arrival_latitude,
        pr.arrival_longitude,
        pr.arrival_verified,
        pr.pickup_latitude,
        pr.pickup_longitude
    FROM pickup_requests pr
    WHERE pr.id = p_request_id;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION check_recycler_arrival(UUID, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION update_pickup_status_on_arrival(UUID, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION send_arrival_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_arrival_location(UUID, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_arrival_status(UUID) TO authenticated;

-- Step 8: Test the functions
DO $$
DECLARE
    test_customer_id UUID;
    test_recycler_id UUID;
    test_request_id UUID;
    is_arrived BOOLEAN;
    notification_id UUID;
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
    
    -- Test arrival detection (recycler at same location)
    is_arrived := check_recycler_arrival(test_request_id, 6.6734, -1.5714, 0.05);
    RAISE NOTICE 'Arrival detection test (same location): %', is_arrived;
    
    -- Test arrival detection (recycler far away)
    is_arrived := check_recycler_arrival(test_request_id, 6.6834, -1.5814, 0.05);
    RAISE NOTICE 'Arrival detection test (far away): %', is_arrived;
    
    -- Test status update on arrival
    is_arrived := update_pickup_status_on_arrival(test_request_id, 6.6734, -1.5714, 0.05);
    RAISE NOTICE 'Status update on arrival: %', is_arrived;
    
    -- Test arrival notification
    IF is_arrived THEN
        notification_id := send_arrival_notification(test_request_id);
        RAISE NOTICE 'Arrival notification sent: %', notification_id;
    END IF;
    
    -- Test arrival status
    PERFORM * FROM get_arrival_status(test_request_id);
    RAISE NOTICE 'Arrival status retrieved successfully';
    
    -- Clean up test data
    DELETE FROM notifications WHERE related_request_id = test_request_id;
    DELETE FROM pickup_requests WHERE id = test_request_id;
    DELETE FROM customers WHERE id = test_customer_id AND full_name = 'Test Customer';
    DELETE FROM recyclers WHERE id = test_recycler_id AND full_name = 'Test Recycler';
    
    RAISE NOTICE 'Test completed and cleaned up';
END $$;

-- Final verification
SELECT 'SUCCESS: Arrival detection functions created and tested!' as status;
