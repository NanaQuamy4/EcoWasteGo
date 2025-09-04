-- Fix notifications type constraint to include 'help_response'
-- This script adds the missing 'help_response' type to the notifications table constraint

-- Step 1: Drop existing type CHECK constraint if it exists
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'notifications'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped existing type constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No existing type constraint found to drop.';
    END IF;
END $$;

-- Step 2: Add new type CHECK constraint with all required types including 'help_response'
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN ('general', 'verification', 'pickup', 'request_confirmed', 'request_accepted', 'request_rejected', 'request_completed', 'request_cancelled', 'pickup_started', 'pickup_completed', 'help_response'));

-- Step 3: Test the new constraint with all valid types
DO $$
DECLARE
    test_types TEXT[] := ARRAY['general', 'verification', 'pickup', 'request_confirmed', 'request_accepted', 'request_rejected', 'request_completed', 'request_cancelled', 'pickup_started', 'pickup_completed', 'help_response'];
    test_type TEXT;
    test_user_id UUID;
BEGIN
    -- Get an existing user_id or create a test user
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    IF test_user_id IS NULL THEN
        INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
        VALUES (gen_random_uuid(), 'test_user_for_notifications@example.com', 'dummy_password', NOW(), NOW())
        RETURNING id INTO test_user_id;
    END IF;

    FOREACH test_type IN ARRAY test_types
    LOOP
        BEGIN
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (test_user_id, 'Test Title', 'Test Message for type ' || test_type, test_type);
            DELETE FROM notifications WHERE user_id = test_user_id AND type = test_type;
            RAISE NOTICE 'Type "%" is valid', test_type;
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE 'Type "%" is INVALID', test_type;
        END;
    END LOOP;
    DELETE FROM auth.users WHERE id = test_user_id AND email = 'test_user_for_notifications@example.com';
END $$;

SELECT 'SUCCESS: notifications type constraint updated to include help_response!' as status;
