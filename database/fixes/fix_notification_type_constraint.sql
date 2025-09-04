-- Fix notification type constraint to include all notification types
-- This fixes the error: new row for relation "notifications" violates check constraint "notifications_type_check"

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with all notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
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
    'new_pickup_request',
    'request_sent',
    'help_response'
));

-- Verify the constraint was updated
SELECT 'Notification type constraint updated successfully!' as status;
