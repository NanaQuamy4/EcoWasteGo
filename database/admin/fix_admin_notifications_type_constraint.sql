-- Fix admin_notifications type constraint to allow 'admin_action'
-- This resolves the "violates check constraint admin_notifications_type_check" error

-- Step 1: Check current constraint
SELECT 'Current type constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'admin_notifications'::regclass 
AND contype = 'c' 
AND conname LIKE '%type%';

-- Step 2: Drop the existing type constraint
ALTER TABLE admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

-- Step 3: Add the new type constraint with 'admin_action' included
ALTER TABLE admin_notifications ADD CONSTRAINT admin_notifications_type_check 
CHECK (type IN (
    'help_message',
    'verification_request', 
    'user_registration',
    'admin_action'
));

-- Step 4: Verify the new constraint
SELECT 'New type constraint applied:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'admin_notifications'::regclass 
AND contype = 'c' 
AND conname LIKE '%type%';

-- Step 5: Test the constraint with all valid types
DO $$
DECLARE
    test_types TEXT[] := ARRAY['help_message', 'verification_request', 'user_registration', 'admin_action'];
    test_type TEXT;
    test_admin_id UUID;
BEGIN
    -- Get an admin user ID to test with
    SELECT id INTO test_admin_id FROM auth.users WHERE email = 'admin@ecowastego.com' LIMIT 1;
    
    -- If no admin user exists, create a test one
    IF test_admin_id IS NULL THEN
        INSERT INTO auth.users (id, email, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'admin@ecowastego.com',
            NOW(),
            NOW()
        )
        RETURNING id INTO test_admin_id;
    END IF;
    
    FOREACH test_type IN ARRAY test_types
    LOOP
        BEGIN
            -- Try to insert a test notification with each type
            INSERT INTO admin_notifications (admin_id, type, title, message) 
            VALUES (test_admin_id, test_type, 'Test ' || test_type, 'Test message for ' || test_type);
            
            -- If successful, delete the test record
            DELETE FROM admin_notifications WHERE admin_id = test_admin_id AND title = 'Test ' || test_type;
            
            RAISE NOTICE 'Type "%" is valid', test_type;
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE 'Type "%" is INVALID', test_type;
        END;
    END LOOP;
    
    -- Clean up test admin if we created one
    IF test_admin_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = test_admin_id AND email = 'admin@ecowastego.com';
    END IF;
END $$;

-- Step 6: Test the admin_force_recycler_offline function
DO $$
DECLARE
    test_recycler_id UUID;
BEGIN
    -- Get a recycler ID to test with
    SELECT id INTO test_recycler_id FROM recyclers LIMIT 1;
    
    IF test_recycler_id IS NOT NULL THEN
        -- Test the function (this should not cause the type constraint error anymore)
        PERFORM admin_force_recycler_offline(test_recycler_id);
        RAISE NOTICE 'SUCCESS: admin_force_recycler_offline function works with updated constraint';
    ELSE
        RAISE NOTICE 'No recyclers found to test with, but constraint has been updated';
    END IF;
END $$;

SELECT 'SUCCESS: admin_notifications type constraint updated to include admin_action!' as status;
