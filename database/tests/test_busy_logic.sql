-- Test the new recycler busy logic
-- This script tests different scenarios to ensure the busy logic works correctly

-- Test 1: Check current status of all online recyclers
SELECT 
    'Current Status Check' as test_name,
    r.id,
    r.full_name,
    r.is_online,
    r.is_available,
    (SELECT COUNT(*) FROM pickup_requests pr 
     WHERE pr.recycler_id = r.id 
     AND pr.status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress')) as pending_requests,
    CASE 
        WHEN r.is_online = false THEN 'Offline'
        WHEN r.is_available = true THEN 'Available'
        WHEN r.is_available = false THEN 'Busy (5+ pending)'
        ELSE 'Unknown'
    END as status
FROM recyclers r
WHERE r.is_online = true
ORDER BY r.full_name;

-- Test 2: Create test pickup requests to test the busy logic
-- (Replace 'YOUR_RECYCLER_ID' with actual recycler ID)
DO $$
DECLARE
    test_recycler_id uuid := 'e9e096bf-7c7b-4338-a619-124d7ae699b6'; -- Replace with your recycler ID
    i integer;
BEGIN
    -- Clear existing test requests for this recycler
    UPDATE pickup_requests 
    SET status = 'cancelled' 
    WHERE recycler_id = test_recycler_id 
    AND pickup_address LIKE 'TEST%';
    
    -- Create 3 test requests (should still be available)
    FOR i IN 1..3 LOOP
        INSERT INTO pickup_requests (
            id,
            customer_id,
            recycler_id,
            pickup_address,
            waste_type,
            estimated_weight,
            status,
            created_at
        ) VALUES (
            gen_random_uuid(),
            test_recycler_id, -- Using recycler ID as customer for test
            test_recycler_id,
            'TEST PICKUP ' || i,
            'Mixed Waste',
            10.0,
            'pending',
            NOW()
        );
    END LOOP;
    
    -- Created 3 test requests for recycler - should still be available
    
    -- Check status after 3 requests
    PERFORM update_specific_recycler_availability(test_recycler_id);
    
    -- Create 2 more requests (total 5, should become busy)
    FOR i IN 4..5 LOOP
        INSERT INTO pickup_requests (
            id,
            customer_id,
            recycler_id,
            pickup_address,
            waste_type,
            estimated_weight,
            status,
            created_at
        ) VALUES (
            gen_random_uuid(),
            test_recycler_id,
            test_recycler_id,
            'TEST PICKUP ' || i,
            'Mixed Waste',
            10.0,
            'pending',
            NOW()
        );
    END LOOP;
    
    -- Created 2 more test requests (total 5) - should now be busy
    
    -- Check status after 5 requests
    PERFORM update_specific_recycler_availability(test_recycler_id);
    
    -- Create 1 more request (total 6, should still be busy)
    INSERT INTO pickup_requests (
        id,
        customer_id,
        recycler_id,
        pickup_address,
        waste_type,
        estimated_weight,
        status,
        created_at
    ) VALUES (
        gen_random_uuid(),
        test_recycler_id,
        test_recycler_id,
        'TEST PICKUP 6',
        'Mixed Waste',
        10.0,
        'pending',
        NOW()
    );
    
    -- Created 1 more test request (total 6) - should still be busy
    
    -- Check final status
    PERFORM update_specific_recycler_availability(test_recycler_id);
    
END $$;

-- Test 3: Check the test results
SELECT 
    'After Test Requests' as test_name,
    r.id,
    r.full_name,
    r.is_online,
    r.is_available,
    (SELECT COUNT(*) FROM pickup_requests pr 
     WHERE pr.recycler_id = r.id 
     AND pr.status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress')) as pending_requests,
    CASE 
        WHEN r.is_online = false THEN 'Offline'
        WHEN r.is_available = true THEN 'Available'
        WHEN r.is_available = false THEN 'Busy (5+ pending)'
        ELSE 'Unknown'
    END as status
FROM recyclers r
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'; -- Replace with your recycler ID

-- Test 4: Complete some requests and check if recycler becomes available again
DO $$
DECLARE
    test_recycler_id uuid := 'e9e096bf-7c7b-4338-a619-124d7ae699b6'; -- Replace with your recycler ID
BEGIN
    -- Complete 2 requests (should have 4 pending, become available)
    UPDATE pickup_requests 
    SET status = 'completed', updated_at = NOW()
    WHERE recycler_id = test_recycler_id 
    AND pickup_address LIKE 'TEST%'
    AND status = 'pending'
    LIMIT 2;
    
    -- Completed 2 test requests - should now be available again
    
    -- Update availability
    PERFORM update_specific_recycler_availability(test_recycler_id);
    
END $$;

-- Test 5: Final status check
SELECT 
    'After Completing 2 Requests' as test_name,
    r.id,
    r.full_name,
    r.is_online,
    r.is_available,
    (SELECT COUNT(*) FROM pickup_requests pr 
     WHERE pr.recycler_id = r.id 
     AND pr.status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress')) as pending_requests,
    CASE 
        WHEN r.is_online = false THEN 'Offline'
        WHEN r.is_available = true THEN 'Available'
        WHEN r.is_available = false THEN 'Busy (5+ pending)'
        ELSE 'Unknown'
    END as status
FROM recyclers r
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'; -- Replace with your recycler ID

-- Clean up test data
UPDATE pickup_requests 
SET status = 'cancelled' 
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6' 
AND pickup_address LIKE 'TEST%';

-- Test completed. Cleaned up test data.
