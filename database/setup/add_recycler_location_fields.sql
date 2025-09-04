-- Add latitude and longitude fields to the recyclers table
ALTER TABLE recyclers 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_recyclers_location ON recyclers(latitude, longitude);

-- Update existing recycler with default Kumasi coordinates (you can change this)
UPDATE recyclers 
SET latitude = 6.6885, longitude = -1.6244 
WHERE latitude IS NULL OR longitude IS NULL;

-- Add comment to document the fields
COMMENT ON COLUMN recyclers.latitude IS 'Recycler current latitude coordinate';
COMMENT ON COLUMN recyclers.longitude IS 'Recycler current longitude coordinate';
