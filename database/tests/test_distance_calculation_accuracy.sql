-- Test distance calculation accuracy with real Ghana coordinates
-- This will verify the Haversine formula is working correctly

-- Create a function to calculate distance (same as in the app)
CREATE OR REPLACE FUNCTION calculate_distance_test(
    lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
AS $$
DECLARE
    R CONSTANT DOUBLE PRECISION := 6371; -- Earth's radius in kilometers
    dLat DOUBLE PRECISION;
    dLon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);

    a := SIN(dLat / 2) * SIN(dLat / 2) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dLon / 2) * SIN(dLon / 2);

    c := 2 * ATAN2(SQRT(a), SQRT(1 - a));

    RETURN R * c;
END;
$$;

-- Test with real Ghana locations
SELECT 
    'DISTANCE TESTS' as test_type,
    'Accra to Kumasi' as route,
    5.6037 as customer_lat, -0.1870 as customer_lon,
    6.6885 as recycler_lat, -1.6244 as recycler_lon,
    calculate_distance_test(5.6037, -0.1870, 6.6885, -1.6244) as distance_km,
    ROUND((calculate_distance_test(5.6037, -0.1870, 6.6885, -1.6244) / 25) * 60) as eta_minutes_25kmh

UNION ALL

SELECT 
    'DISTANCE TESTS' as test_type,
    'Kumasi to Tamale' as route,
    6.6885 as customer_lat, -1.6244 as customer_lon,
    9.4008 as recycler_lat, -0.8393 as recycler_lon,
    calculate_distance_test(6.6885, -1.6244, 9.4008, -0.8393) as distance_km,
    ROUND((calculate_distance_test(6.6885, -1.6244, 9.4008, -0.8393) / 25) * 60) as eta_minutes_25kmh

UNION ALL

SELECT 
    'DISTANCE TESTS' as test_type,
    'Same Location (Accra)' as route,
    5.6037 as customer_lat, -0.1870 as customer_lon,
    5.6037 as recycler_lat, -0.1870 as recycler_lon,
    calculate_distance_test(5.6037, -0.1870, 5.6037, -0.1870) as distance_km,
    ROUND((calculate_distance_test(5.6037, -0.1870, 5.6037, -0.1870) / 25) * 60) as eta_minutes_25kmh;

-- Test with current customer and recycler data
SELECT 
    'CURRENT DATA' as test_type,
    c.full_name as customer_name,
    c.latitude as customer_lat,
    c.longitude as customer_lon,
    r.full_name as recycler_name,
    r.latitude as recycler_lat,
    r.longitude as recycler_lon,
    CASE 
        WHEN c.latitude IS NOT NULL AND c.longitude IS NOT NULL 
             AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
        THEN calculate_distance_test(c.latitude, c.longitude, r.latitude, r.longitude)
        ELSE NULL
    END as distance_km
FROM public.customers c
CROSS JOIN public.recyclers r
WHERE c.latitude IS NOT NULL 
  AND c.longitude IS NOT NULL
  AND r.latitude IS NOT NULL 
  AND r.longitude IS NOT NULL
LIMIT 5;
