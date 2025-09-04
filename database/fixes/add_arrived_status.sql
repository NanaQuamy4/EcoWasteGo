-- Add 'arrived' status to pickup_requests table
-- This enables proper arrival detection and status tracking

-- Step 1: Check current status constraint
SELECT 'Current status constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'pickup_requests'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';

-- Step 2: Drop the existing status constraint
ALTER TABLE pickup_requests DROP CONSTRAINT IF EXISTS pickup_requests_status_check;

-- Step 3: Add the new status constraint with 'arrived' status
ALTER TABLE pickup_requests ADD CONSTRAINT pickup_requests_status_check 
CHECK (status IN (
    'pending',      -- Initial state when request is created
    'assigned',     -- When recycler is selected in SelectTruck
    'confirmed',    -- When customer confirms in RecyclerProfileDetails
    'accepted',     -- When recycler accepts in RecyclerRequests
    'in_progress',  -- When recycler starts pickup (en route)
    'arrived',      -- When recycler reaches pickup location
    'completed',    -- When pickup is finished
    'cancelled',    -- When customer cancels
    'rejected'      -- When recycler rejects
));

-- Step 4: Add arrival timestamp field if it doesn't exist
ALTER TABLE pickup_requests 
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;

-- Step 5: Add arrival location verification fields
ALTER TABLE pickup_requests 
ADD COLUMN IF NOT EXISTS arrival_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS arrival_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS arrival_verified BOOLEAN DEFAULT FALSE;

-- Step 6: Update the status transition validation function
CREATE OR REPLACE FUNCTION validate_pickup_request_status_transition(
    current_status TEXT,
    new_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Define valid transitions including 'arrived'
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
            RETURN new_status IN ('arrived', 'cancelled');
        WHEN 'arrived' THEN
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

-- Step 7: Update the trigger function
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
    
    -- Set arrived_at timestamp when status changes to 'arrived'
    IF NEW.status = 'arrived' AND OLD.status != 'arrived' THEN
        NEW.arrived_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Recreate the trigger
DROP TRIGGER IF EXISTS pickup_request_status_transition_trigger ON pickup_requests;
CREATE TRIGGER pickup_request_status_transition_trigger
    BEFORE UPDATE ON pickup_requests
    FOR EACH ROW
    EXECUTE FUNCTION check_pickup_request_status_transition();

-- Step 9: Test the new status constraint
DO $$
DECLARE
    test_statuses TEXT[] := ARRAY['pending', 'assigned', 'confirmed', 'accepted', 'in_progress', 'arrived', 'completed', 'cancelled', 'rejected'];
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

-- Step 10: Update the column comment
COMMENT ON COLUMN pickup_requests.status IS 'Request status: pending → assigned → confirmed → accepted → in_progress → arrived → completed. Can also be cancelled or rejected at any stage.';
COMMENT ON COLUMN pickup_requests.arrived_at IS 'Timestamp when recycler arrived at pickup location';
COMMENT ON COLUMN pickup_requests.arrival_latitude IS 'Latitude where recycler arrived (for verification)';
COMMENT ON COLUMN pickup_requests.arrival_longitude IS 'Longitude where recycler arrived (for verification)';
COMMENT ON COLUMN pickup_requests.arrival_verified IS 'Whether arrival location has been verified';

-- Step 11: Verify the changes
SELECT 'New status constraint applied:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'pickup_requests'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';

-- Step 12: Show new columns
SELECT 'New columns added:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
AND column_name IN ('arrived_at', 'arrival_latitude', 'arrival_longitude', 'arrival_verified')
ORDER BY column_name;

-- Final verification
SELECT 'SUCCESS: arrived status and arrival tracking fields added to pickup_requests!' as status;
