-- Check existing notification types and fix constraint
-- This handles existing data before updating the constraint

-- Step 1: Check what notification types currently exist in the table
SELECT 'Current notification types in database:' as info;
SELECT type, COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY type;

-- Step 2: Check current constraint definition
SELECT 'Current constraint definition:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 3: Drop the existing constraint
SELECT 'Dropping existing constraint...' as info;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 4: Add new constraint with ALL existing types plus the new one
SELECT 'Adding new constraint with all types...' as info;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  -- Types found in existing data
  'new_pickup_request',
  'request_sent', 
  'request_confirmed',
  'request_accepted',
  'request_rejected',
  'request_cancelled',
  'request_completed',
  'recycler_started',
  'recycler_started_navigation',  -- NEW TYPE
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
  'success',
  -- Additional common types that might exist
  'pickup_started',
  'pickup_completed',
  'verification',
  'pickup'
));

-- Step 5: Verify the constraint was created successfully
SELECT 'New constraint definition:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 6: Test that all existing data passes the constraint
SELECT 'Testing constraint with existing data...' as info;
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM notifications 
      WHERE type NOT IN (
        'new_pickup_request',
        'request_sent', 
        'request_confirmed',
        'request_accepted',
        'request_rejected',
        'request_cancelled',
        'request_completed',
        'recycler_started',
        'recycler_started_navigation',
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
        'success',
        'pickup_started',
        'pickup_completed',
        'verification',
        'pickup'
      )
    ) THEN '❌ Some data still violates the constraint'
    ELSE '✅ All existing data passes the new constraint'
  END as constraint_test_result;

-- Step 7: Show any problematic types
SELECT 'Problematic types (if any):' as info;
SELECT DISTINCT type as problematic_type
FROM notifications 
WHERE type NOT IN (
  'new_pickup_request',
  'request_sent', 
  'request_confirmed',
  'request_accepted',
  'request_rejected',
  'request_cancelled',
  'request_completed',
  'recycler_started',
  'recycler_started_navigation',
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
  'success',
  'pickup_started',
  'pickup_completed',
  'verification',
  'pickup'
);
