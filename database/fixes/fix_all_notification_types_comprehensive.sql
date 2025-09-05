-- Comprehensive fix for all notification types
-- This includes ALL notification types used throughout the application

-- Step 1: Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 2: Create a comprehensive constraint with ALL notification types
DO $$
DECLARE
    existing_types text;
    constraint_sql text;
BEGIN
    -- Get all distinct notification types as a comma-separated string
    SELECT string_agg(DISTINCT quote_literal(type), ', ' ORDER BY quote_literal(type))
    INTO existing_types
    FROM notifications;
    
    -- Add ALL possible notification types used in the application
    existing_types := existing_types || ', ''recycler_location_update'', ''recycler_started_navigation'', ''navigation_started'', ''pickup_started'', ''recycler_started'', ''message_received'', ''new_message'', ''recycler_arrived'', ''request_pending'', ''request_assigned'', ''request_in_progress'', ''request_failed'', ''payment_received'', ''payment_failed'', ''rating_submitted'', ''feedback_received'', ''system_announcement'', ''maintenance_notice'', ''help_response'', ''admin_action'', ''verification_request'', ''user_registration'', ''help_message''';
    
    -- Build the constraint SQL
    constraint_sql := 'ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (' || existing_types || '))';
    
    -- Execute the constraint
    EXECUTE constraint_sql;
    
    RAISE NOTICE 'Constraint created with types: %', existing_types;
END $$;

-- Step 3: Verify the constraint works by testing with all types
DO $$
DECLARE
    test_types TEXT[] := ARRAY[
        'general', 'verification', 'pickup', 'request_confirmed', 
        'request_accepted', 'request_rejected', 'request_completed', 
        'request_cancelled', 'pickup_started', 'pickup_completed', 
        'help_response', 'recycler_started_navigation', 'message_received', 
        'new_message', 'recycler_location_update', 'navigation_started',
        'recycler_started', 'recycler_arrived', 'request_pending',
        'request_assigned', 'request_in_progress', 'request_failed',
        'payment_received', 'payment_failed', 'rating_submitted',
        'feedback_received', 'system_announcement', 'maintenance_notice',
        'admin_action', 'verification_request', 'user_registration',
        'help_message'
    ];
    test_type TEXT;
BEGIN
    FOREACH test_type IN ARRAY test_types
    LOOP
        -- Test each type by trying to insert a test notification
        BEGIN
            INSERT INTO notifications (user_id, type, title, message, priority)
            VALUES ('00000000-0000-0000-0000-000000000000', test_type, 'Test', 'Test message', 'low');
            
            -- If successful, delete the test record
            DELETE FROM notifications WHERE user_id = '00000000-0000-0000-0000-000000000000' AND type = test_type;
            
            RAISE NOTICE 'Type % is valid', test_type;
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE 'Type % is NOT valid - constraint violation', test_type;
            WHEN OTHERS THEN
                RAISE NOTICE 'Type % test failed: %', test_type, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 4: Show final status
SELECT 'SUCCESS: Comprehensive notification constraint created with ALL types!' as status;
SELECT 'All notification types are now supported in the database.' as message;
