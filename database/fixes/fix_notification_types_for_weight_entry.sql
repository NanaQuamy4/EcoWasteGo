-- Fix notification types constraint to include all types used by weight entry flow
-- This fixes the error: new row for relation "notifications" violates check constraint "notifications_type_check"

-- Step 1: Check current constraint
SELECT 'Current constraint definition:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 2: Drop existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 3: Add comprehensive constraint with all notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  -- Basic types
  'general',
  'verification',
  'pickup',
  
  -- Request status types
  'new_pickup_request',
  'request_sent',
  'request_confirmed',
  'request_accepted',
  'request_rejected',
  'request_cancelled',
  'request_completed',
  
  -- Pickup process types
  'pickup_started',
  'pickup_completed',
  'recycler_started',
  'recycler_started_navigation',
  'recycler_arrived',
  
  -- Help and support types
  'help_response',
  'support_response',
  
  -- Admin types
  'admin_notification',
  'verification_submission'
));

-- Step 4: Verify constraint was created
SELECT 'New constraint definition:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 5: Test that all existing data passes
SELECT 'Testing constraint with existing data:' as info;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All existing data passes the new constraint'
    ELSE '❌ ' || COUNT(*) || ' rows violate the constraint'
  END as result
FROM notifications 
WHERE type NOT IN (
  'general', 'verification', 'pickup', 'new_pickup_request', 'request_sent', 
  'request_confirmed', 'request_accepted', 'request_rejected', 'request_cancelled', 
  'request_completed', 'pickup_started', 'pickup_completed', 'recycler_started', 
  'recycler_started_navigation', 'recycler_arrived', 'help_response', 
  'support_response', 'admin_notification', 'verification_submission'
);

-- Step 6: Success message
SELECT '✅ Notification types constraint updated successfully! All weight entry notification types are now allowed.' as result;
