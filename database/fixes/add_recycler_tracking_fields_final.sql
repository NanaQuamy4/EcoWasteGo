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

-- Test the new fields
SELECT 'SUCCESS: Recycler tracking fields added to pickup_requests table!' as status;
