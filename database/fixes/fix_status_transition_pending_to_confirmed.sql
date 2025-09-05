-- Fix status transition to allow pending → confirmed
-- The customer app is trying to go directly from pending to confirmed
-- but the current validation only allows pending → assigned → confirmed

-- Update the status transition validation function
CREATE OR REPLACE FUNCTION validate_pickup_request_status_transition(
    current_status TEXT,
    new_status TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Define valid transitions including direct pending → confirmed
    CASE current_status
        WHEN 'pending' THEN
            RETURN new_status IN ('assigned', 'confirmed', 'cancelled'); -- Added 'confirmed'
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

-- Test the updated function
SELECT 'Testing updated status transition function...' as info;

-- Test pending → confirmed (should now be allowed)
SELECT 
    'pending' as current_status,
    'confirmed' as new_status,
    validate_pickup_request_status_transition('pending', 'confirmed') as is_valid;

-- Test other valid transitions
SELECT 
    'pending' as current_status,
    'assigned' as new_status,
    validate_pickup_request_status_transition('pending', 'assigned') as is_valid;

SELECT 
    'assigned' as current_status,
    'confirmed' as new_status,
    validate_pickup_request_status_transition('assigned', 'confirmed') as is_valid;

-- Test invalid transition (should still be blocked)
SELECT 
    'completed' as current_status,
    'pending' as new_status,
    validate_pickup_request_status_transition('completed', 'pending') as is_valid;

-- Success message
SELECT '✅ Status transition updated! pending → confirmed is now allowed.' as result;
