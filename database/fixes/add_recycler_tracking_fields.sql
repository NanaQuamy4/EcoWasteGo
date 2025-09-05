-- Add recycler tracking fields to pickup_requests table
-- This allows customers to track recycler location in real-time

-- Add recycler location tracking fields
ALTER TABLE pickup_requests 
ADD COLUMN IF NOT EXISTS recycler_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS recycler_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS recycler_location_updated_at TIMESTAMPTZ;

-- Add index for efficient location queries
CREATE INDEX IF NOT EXISTS idx_pickup_requests_recycler_location 
ON pickup_requests(recycler_latitude, recycler_longitude) 
WHERE recycler_latitude IS NOT NULL AND recycler_longitude IS NOT NULL;

-- Add index for location update time queries
CREATE INDEX IF NOT EXISTS idx_pickup_requests_recycler_location_updated 
ON pickup_requests(recycler_location_updated_at) 
WHERE recycler_location_updated_at IS NOT NULL;

-- Add recycler_location_update notification type
-- First check if the constraint exists and what types are currently allowed
DO $$
DECLARE
    constraint_exists boolean;
    current_types text[];
BEGIN
    -- Check if the constraint exists
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_type_check'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        -- Get current allowed types
        SELECT array_agg(unnest) INTO current_types
        FROM (
            SELECT unnest(string_to_array(
                regexp_replace(
                    pg_get_constraintdef(oid), 
                    '.*CHECK \(type IN \(([^)]+)\).*', 
                    '\1'
                ), 
                ', '
            ))
            FROM pg_constraint 
            WHERE conname = 'notifications_type_check'
        ) t;
        
        -- Add recycler_location_update if not already present
        IF NOT ('recycler_location_update' = ANY(current_types)) THEN
            -- Drop and recreate constraint with new type
            ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
            ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
            CHECK (type IN (
                'general', 'verification', 'pickup', 'request_confirmed', 
                'request_accepted', 'request_rejected', 'request_completed', 
                'request_cancelled', 'pickup_started', 'pickup_completed', 
                'help_response', 'recycler_started_navigation', 'message_received', 
                'new_message', 'recycler_location_update'
            ));
        END IF;
    END IF;
END $$;

-- Test the new fields
SELECT 'SUCCESS: Recycler tracking fields added to pickup_requests table!' as status;
