-- Add messaging notification types to the notifications table
-- This enables notifications when customers and recyclers send messages to each other

-- Step 1: Check current notification types constraint
SELECT 'Current notification types constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 2: Drop existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 3: Add new constraint with messaging notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  -- Existing types
  'general',
  'verification',
  'pickup',
  'request_confirmed',
  'request_accepted',
  'request_rejected',
  'request_completed',
  'request_cancelled',
  'pickup_started',
  'pickup_completed',
  'help_response',
  'recycler_started_navigation',
  'pickup_arrived',
  'weight_entry_completed',
  'payment_summary_ready',
  'navigation_started',
  'arrival_detected',
  -- New messaging types
  'message_received',
  'new_message'
));

-- Step 4: Verify the constraint was created
SELECT 'New constraint created:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 5: Test that the new types are accepted
SELECT 'Testing new notification types...' as info;

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

SELECT 'SUCCESS: Messaging notification types added successfully!' as status;
