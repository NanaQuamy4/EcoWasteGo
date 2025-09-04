-- Simple script to add recycler_started_navigation notification type
-- Drop and recreate the constraint with the new type

-- Drop existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with recycler_started_navigation type
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
