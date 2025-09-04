-- Test distance calculation between customer and recycler
-- This simulates what the app would calculate

-- Customer location (Kumasi center)
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
  -- Calculate distance using Haversine formula (simplified)
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
