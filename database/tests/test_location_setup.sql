-- Test script to set up location data for testing
-- First, let's add the location fields if they don't exist
ALTER TABLE recyclers 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Set a test location for the recycler (Kumasi coordinates with slight offset)
UPDATE recyclers 
SET 
  latitude = 6.6885 + (RANDOM() - 0.5) * 0.01,  -- Random offset within ~500m
  longitude = -1.6244 + (RANDOM() - 0.5) * 0.01
WHERE email = 'nquamy7@gmail.com';

-- Check the updated location
SELECT 
  full_name,
  email,
  latitude,
  longitude,
  is_online,
  is_available
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';
