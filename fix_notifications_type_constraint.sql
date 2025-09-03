-- Fix notifications type constraint by updating existing data first
-- This script handles existing notification types before applying the new constraint

-- Step 1: Check what notification types currently exist
SELECT 'Current notification types in the table:' as info;
SELECT DISTINCT type, COUNT(*) as count 
FROM notifications 
GROUP BY type 
ORDER BY type;

-- Step 2: Update any existing notification types to match our new constraint
-- Map any unknown types to 'general'
UPDATE notifications 
SET type = 'general' 
WHERE type NOT IN ('general', 'verification', 'pickup', 'request_confirmed', 'request_accepted', 'request_rejected', 'request_completed', 'request_cancelled', 'pickup_started', 'pickup_completed');

-- Step 3: Show updated types
SELECT 'Updated notification types:' as info;
SELECT DISTINCT type, COUNT(*) as count 
FROM notifications 
GROUP BY type 
ORDER BY type;

-- Step 4: Now safely add the constraint
DO $$
BEGIN
    -- Drop existing type constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'notifications' AND constraint_type = 'CHECK' 
               AND constraint_name LIKE '%type%') THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
        RAISE NOTICE 'Dropped existing type constraint';
    END IF;
    
    -- Add new type constraint with all notification types
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('general', 'verification', 'pickup', 'request_confirmed', 'request_accepted', 'request_rejected', 'request_completed', 'request_cancelled', 'pickup_started', 'pickup_completed'));
    
    RAISE NOTICE 'Added new type constraint successfully';
END $$;

-- Step 5: Verify the constraint works
SELECT 'Testing constraint with all valid types:' as info;
DO $$
DECLARE
    test_types TEXT[] := ARRAY['general', 'verification', 'pickup', 'request_confirmed', 'request_accepted', 'request_rejected', 'request_completed', 'request_cancelled', 'pickup_started', 'pickup_completed'];
    test_type TEXT;
    test_user_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        FOREACH test_type IN ARRAY test_types
        LOOP
            BEGIN
                -- Try to insert a test record with each type
                INSERT INTO notifications (user_id, type, title, message) 
                VALUES (test_user_id, test_type, 'Test Title', 'Test message for type ' || test_type);
                
                -- If successful, delete the test record
                DELETE FROM notifications WHERE user_id = test_user_id AND type = test_type AND title = 'Test Title';
                
                RAISE NOTICE 'Type "%" is valid', test_type;
            EXCEPTION
                WHEN check_violation THEN
                    RAISE NOTICE 'Type "%" is INVALID', test_type;
            END;
        END LOOP;
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;

SELECT 'SUCCESS: Notifications type constraint fixed! All existing data has been updated and the new constraint is in place.' as status;
