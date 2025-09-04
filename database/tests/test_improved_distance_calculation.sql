-- Test the improved distance calculation with realistic coordinates
-- This script tests various scenarios to ensure accurate distance calculations

-- Test 1: Very close locations (should show in meters)
-- Customer: Kumasi city center
-- Recycler: 200m away (walking distance)
SELECT 
  'Test 1: Very Close (200m)' as test_case,
  6.6885 as customer_lat,
  -1.6244 as customer_lon,
  6.6905 as recycler_lat,  -- ~200m north
  -1.6244 as recycler_lon,
  -- Haversine calculation
  ROUND(
    6371 * acos(
      cos(radians(6.6885)) * cos(radians(6.6905)) * 
      cos(radians(-1.6244) - radians(-1.6244)) + 
      sin(radians(6.6885)) * sin(radians(6.6905))
    ) * 1000
  ) as distance_meters,
  'Should show ~200m' as expected;

-- Test 2: Short distance (1-3km)
-- Customer: Kumasi city center  
-- Recycler: 2km away
SELECT 
  'Test 2: Short Distance (2km)' as test_case,
  6.6885 as customer_lat,
  -1.6244 as customer_lon,
  6.7065 as recycler_lat,  -- ~2km north
  -1.6244 as recycler_lon,
  ROUND(
    6371 * acos(
      cos(radians(6.6885)) * cos(radians(6.7065)) * 
      cos(radians(-1.6244) - radians(-1.6244)) + 
      sin(radians(6.6885)) * sin(radians(6.7065))
    ) * 1000
  ) as distance_meters,
  'Should show ~2.0km' as expected;

-- Test 3: Medium distance (5-10km)
-- Customer: Kumasi city center
-- Recycler: 7km away
SELECT 
  'Test 3: Medium Distance (7km)' as test_case,
  6.6885 as customer_lat,
  -1.6244 as customer_lon,
  6.7505 as recycler_lat,  -- ~7km north
  -1.6244 as recycler_lon,
  ROUND(
    6371 * acos(
      cos(radians(6.6885)) * cos(radians(6.7505)) * 
      cos(radians(-1.6244) - radians(-1.6244)) + 
      sin(radians(6.6885)) * sin(radians(6.7505))
    ) * 1000
  ) as distance_meters,
  'Should show ~7.0km' as expected;

-- Test 4: Same location (should show 0m)
SELECT 
  'Test 4: Same Location' as test_case,
  6.6885 as customer_lat,
  -1.6244 as customer_lon,
  6.6885 as recycler_lat,
  -1.6244 as recycler_lon,
  ROUND(
    6371 * acos(
      cos(radians(6.6885)) * cos(radians(6.6885)) * 
      cos(radians(-1.6244) - radians(-1.6244)) + 
      sin(radians(6.6885)) * sin(radians(6.6885))
    ) * 1000
  ) as distance_meters,
  'Should show 0m' as expected;

-- Test 5: Diagonal distance (both lat and lon different)
-- Customer: Kumasi city center
-- Recycler: 1km northeast
SELECT 
  'Test 5: Diagonal (1km NE)' as test_case,
  6.6885 as customer_lat,
  -1.6244 as customer_lon,
  6.6975 as recycler_lat,  -- ~1km north
  -1.6154 as recycler_lon, -- ~1km east
  ROUND(
    6371 * acos(
      cos(radians(6.6885)) * cos(radians(6.6975)) * 
      cos(radians(-1.6244) - radians(-1.6154)) + 
      sin(radians(6.6885)) * sin(radians(6.6975))
    ) * 1000
  ) as distance_meters,
  'Should show ~1.4km' as expected;

-- Update a test recycler with realistic close coordinates
UPDATE recyclers 
SET 
  latitude = 6.6905,  -- ~200m north of Kumasi center
  longitude = -1.6244,
  updated_at = now()
WHERE email = 'nquamy7@gmail.com';

-- Verify the update
SELECT 
  'Updated Recycler Location' as info,
  full_name,
  email,
  latitude,
  longitude,
  is_online,
  is_available,
  updated_at
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';
