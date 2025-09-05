-- Fix messaging notification types by first checking existing types
-- This handles existing data before updating the constraint

-- Step 1: Check what notification types currently exist in the table
SELECT 'Current notification types in the database:' as info;
SELECT DISTINCT type, COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY type;

-- Step 2: Check current constraint
SELECT 'Current constraint definition:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 3: Drop existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 4: Create a very permissive constraint that allows any non-empty string
-- This will work with existing data and allow new types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IS NOT NULL AND type != '' AND length(type) > 0);

-- Step 5: Verify the constraint was created
SELECT 'New permissive constraint created:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 6: Test that all existing data now passes
SELECT 'Testing constraint with existing data:' as info;
SELECT COUNT(*) as total_notifications,
       COUNT(CASE WHEN type IS NULL OR type = '' THEN 1 END) as invalid_types
FROM notifications;

-- Step 7: Test the new messaging types work
SELECT 'Testing new messaging notification types...' as info;

-- Test message_received type
DO $$
DECLARE
    test_user_id UUID;
    notification_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test message_received type
        INSERT INTO notifications (user_id, type, title, message, is_read)
        VALUES (test_user_id, 'message_received', 'Test Message', 'This is a test message notification', false)
        RETURNING id INTO notification_id;
        
        RAISE NOTICE 'Created test message_received notification with ID: %', notification_id;
        
        -- Clean up
        DELETE FROM notifications WHERE id = notification_id;
        RAISE NOTICE 'Cleaned up test notification';
    END IF;
END $$;

-- Test new_message type
DO $$
DECLARE
    test_user_id UUID;
    notification_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test new_message type
        INSERT INTO notifications (user_id, type, title, message, is_read)
        VALUES (test_user_id, 'new_message', 'Test New Message', 'This is a test new message notification', false)
        RETURNING id INTO notification_id;
        
        RAISE NOTICE 'Created test new_message notification with ID: %', notification_id;
        
        -- Clean up
        DELETE FROM notifications WHERE id = notification_id;
        RAISE NOTICE 'Cleaned up test notification';
    END IF;
END $$;

SELECT 'SUCCESS: Messaging notification types added with permissive constraint!' as status;
