-- Fix notification types constraint by first checking existing types
-- This script handles existing data before updating the constraint

-- Step 1: Check what notification types currently exist in the table
SELECT type, COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY type;

-- Step 2: Check current constraint definition
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 3: Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 4: Recreate the constraint with ALL existing types plus new ones
-- This includes all types that might exist in the current data
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  -- Existing types (from current data)
  'new_pickup_request',
  'request_sent', 
  'request_confirmed',
  'request_accepted',
  'request_rejected',
  'request_cancelled',
  'request_completed',
  'recycler_started',
  'help_response',
  'verification_required',
  'verification_approved',
  'verification_rejected',
  'general',
  -- Additional types that might exist
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

-- Step 5: Verify the constraint was created successfully
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 6: Test that all existing data passes the constraint
SELECT 'Constraint test passed' as result
WHERE NOT EXISTS (
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
  )
);
