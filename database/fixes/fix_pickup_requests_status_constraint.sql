-- Fix pickup_requests status constraint to support our application flow
-- This adds the missing 'assigned' and 'confirmed' statuses

-- Step 1: Check current status constraint
SELECT 'Current status constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'pickup_requests'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';

-- Step 2: Drop the existing status constraint
ALTER TABLE pickup_requests DROP CONSTRAINT IF EXISTS pickup_requests_status_check;

-- Step 3: Add the new status constraint with all required statuses
ALTER TABLE pickup_requests ADD CONSTRAINT pickup_requests_status_check 
CHECK (status IN (
    'pending',      -- Initial state when request is created
    'assigned',     -- When recycler is selected in SelectTruck
    'confirmed',    -- When customer confirms in RecyclerProfileDetails
    'accepted',     -- When recycler accepts in RecyclerRequests
    'in_progress',  -- When recycler starts pickup
    'completed',    -- When pickup is finished
    'cancelled',    -- When customer cancels
    'rejected'      -- When recycler rejects
));

-- Step 4: Verify the new constraint
SELECT 'New status constraint applied:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'pickup_requests'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';

-- Step 5: Test the constraint with all valid statuses
DO $$
DECLARE
    test_statuses TEXT[] := ARRAY['pending', 'assigned', 'confirmed', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'];
    test_status TEXT;
    test_customer_id UUID;
BEGIN
    -- Get an existing customer_id or create a test customer
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    
    -- If no customers exist, create a test customer
    IF test_customer_id IS NULL THEN
        INSERT INTO customers (id, full_name, phone, email, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Test Customer',
            '+233000000000',
            'test@example.com',
            NOW(),
            NOW()
        )
        RETURNING id INTO test_customer_id;
    END IF;
    
    FOREACH test_status IN ARRAY test_statuses
    LOOP
        BEGIN
            -- Try to insert a test record with each status
            INSERT INTO pickup_requests (customer_id, pickup_address, status, waste_type, waste_quantity) 
            VALUES (test_customer_id, 'Test Address', test_status, 'plastic', 'small');
            
            -- If successful, delete the test record
            DELETE FROM pickup_requests WHERE customer_id = test_customer_id AND pickup_address = 'Test Address';
            
            RAISE NOTICE 'Status "%" is valid', test_status;
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE 'Status "%" is INVALID', test_status;
        END;
    END LOOP;
    
    -- Clean up test customer if we created one
    IF test_customer_id IS NOT NULL THEN
        DELETE FROM customers WHERE id = test_customer_id AND full_name = 'Test Customer';
    END IF;
END $$;

-- Step 6: Add comment to document the status flow
COMMENT ON COLUMN pickup_requests.status IS 'Request status: pending → assigned → confirmed → accepted → in_progress → completed. Can also be cancelled or rejected at any stage.';

-- Step 7: Create a function to validate status transitions
CREATE OR REPLACE FUNCTION validate_pickup_request_status_transition(
    current_status TEXT,
    new_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Define valid transitions
    CASE current_status
        WHEN 'pending' THEN
            RETURN new_status IN ('assigned', 'cancelled');
        WHEN 'assigned' THEN
            RETURN new_status IN ('confirmed', 'cancelled');
        WHEN 'confirmed' THEN
            RETURN new_status IN ('accepted', 'rejected', 'cancelled');
        WHEN 'accepted' THEN
            RETURN new_status IN ('in_progress', 'cancelled');
        WHEN 'in_progress' THEN
            RETURN new_status IN ('completed', 'cancelled');
        WHEN 'completed' THEN
            RETURN FALSE; -- Terminal state
        WHEN 'cancelled' THEN
            RETURN FALSE; -- Terminal state
        WHEN 'rejected' THEN
            RETURN FALSE; -- Terminal state
        ELSE
            RETURN FALSE; -- Unknown current status
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create a trigger to validate status transitions
CREATE OR REPLACE FUNCTION check_pickup_request_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check if status is being changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Allow the transition if it's valid
        IF NOT validate_pickup_request_status_transition(OLD.status, NEW.status) THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create the trigger
DROP TRIGGER IF EXISTS pickup_request_status_transition_trigger ON pickup_requests;
CREATE TRIGGER pickup_request_status_transition_trigger
    BEFORE UPDATE ON pickup_requests
    FOR EACH ROW
    EXECUTE FUNCTION check_pickup_request_status_transition();

-- Step 10: Test the trigger with valid and invalid transitions
DO $$
DECLARE
    test_customer_id UUID;
    test_request_id UUID;
BEGIN
    -- Get an existing customer_id or create a test customer
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    
    -- If no customers exist, create a test customer
    IF test_customer_id IS NULL THEN
        INSERT INTO customers (id, full_name, phone, email, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Test Customer',
            '+233000000000',
            'test@example.com',
            NOW(),
            NOW()
        )
        RETURNING id INTO test_customer_id;
    END IF;
    
    -- Create a test pickup request with pending status
    INSERT INTO pickup_requests (customer_id, pickup_address, status, waste_type, waste_quantity)
    VALUES (test_customer_id, 'Test Address for Trigger', 'pending', 'plastic', 'small')
    RETURNING id INTO test_request_id;
    
    -- Test valid transition: pending → assigned
    BEGIN
        UPDATE pickup_requests 
        SET status = 'assigned' 
        WHERE id = test_request_id;
        RAISE NOTICE 'Valid transition test passed: pending → assigned';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Valid transition test failed: %', SQLERRM;
    END;
    
    -- Test invalid transition: assigned → completed (should fail)
    BEGIN
        UPDATE pickup_requests 
        SET status = 'completed' 
        WHERE id = test_request_id;
        RAISE NOTICE 'Invalid transition test FAILED: assigned → completed (should have failed)';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Invalid transition test passed: assigned → completed correctly rejected';
    END;
    
    -- Clean up test data
    DELETE FROM pickup_requests WHERE id = test_request_id;
    DELETE FROM customers WHERE id = test_customer_id AND full_name = 'Test Customer';
END $$;

-- Final verification
SELECT 'SUCCESS: pickup_requests status constraint updated with full application flow support!' as status;
