-- Add 'recycler_started_navigation' notification type to the database constraint
-- This allows the new notification type to be stored in the notifications table

-- Step 1: Check current constraint definition
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 2: Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 3: Recreate the constraint with the new notification type added
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  -- Existing types
  'new_pickup_request',
  'request_sent', 
  'request_confirmed',
  'request_accepted',
  'request_rejected',
  'request_cancelled',
  'request_completed',
  'recycler_started',
  'recycler_started_navigation',  -- NEW TYPE ADDED
  'help_response',
  'verification_required',
  'verification_approved',
  'verification_rejected',
  'general',
  'pickup_request',
  'request_status',
  'status_update',
  'notification',
  'alert',
  'message',
  'update',
  'info',
  'warning',
  'error',
  'success'
));

-- Step 4: Verify the constraint was created successfully
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 5: Test that the new type is accepted
INSERT INTO notifications (
  user_id, 
  type, 
  title, 
  message, 
  priority
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),  -- Use any existing user
  'recycler_started_navigation',
  'Test Notification',
  'This is a test of the new notification type',
  'high'
);

-- Clean up test data
DELETE FROM notifications 
WHERE type = 'recycler_started_navigation' 
AND title = 'Test Notification';

-- Success message
SELECT 'recycler_started_navigation notification type added successfully!' as result;
