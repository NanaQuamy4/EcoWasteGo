-- Update notification types to include new types for request acceptance and recycler movement
-- This script adds the new notification types to the existing constraint

-- First, check current constraint
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Recreate the constraint with all notification types
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
  'help_response',
  'verification_required',
  'verification_approved',
  'verification_rejected',
  'general'
));

-- Verify the constraint was created
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';
