-- Fix the recycler location to be much closer to the customer location
-- Set a realistic distance (within 1-2 km of Kumasi center)

UPDATE recyclers 
SET 
  latitude = 6.6885 + (RANDOM() - 0.5) * 0.002,  -- Much smaller offset: ~100-200m
  longitude = -1.6244 + (RANDOM() - 0.5) * 0.002
WHERE email = 'nquamy7@gmail.com';

-- Check the updated location and calculate realistic distance
WITH customer_location AS (
  SELECT 6.6885 as lat, -1.6244 as lon
),
recycler_location AS (
  SELECT 
    latitude as lat, 
    longitude as lon,
    full_name
  FROM recyclers 
  WHERE email = 'nquamy7@gmail.com'
)
SELECT 
  r.full_name,
  r.lat as recycler_lat,
  r.lon as recycler_lon,
  c.lat as customer_lat,
  c.lon as customer_lon,
  -- Calculate distance using Haversine formula
  ROUND(
    6371 * acos(
      cos(radians(c.lat)) * 
      cos(radians(r.lat)) * 
      cos(radians(r.lon) - radians(c.lon)) + 
      sin(radians(c.lat)) * 
      sin(radians(r.lat))
    )::numeric, 2
  ) as distance_km,
  -- Calculate ETA (assuming 30 km/h average speed)
  ROUND(
    (6371 * acos(
      cos(radians(c.lat)) * 
      cos(radians(r.lat)) * 
      cos(radians(r.lon) - radians(c.lon)) + 
      sin(radians(c.lat)) * 
      sin(radians(r.lat))
    ) / 30 * 60)::numeric, 0
  ) as eta_minutes
FROM customer_location c, recycler_location r;
