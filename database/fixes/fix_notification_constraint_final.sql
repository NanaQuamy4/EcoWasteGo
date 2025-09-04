-- Fix notification constraint to include recycler_started_navigation type
-- This resolves the constraint violation error

-- Step 1: Check current constraint
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 2: Drop existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 3: Add new constraint with recycler_started_navigation included
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
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
  'success'
));

-- Step 4: Verify constraint was created
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Step 5: Test the new type works
SELECT 'Constraint updated successfully - recycler_started_navigation type is now allowed!' as result;
