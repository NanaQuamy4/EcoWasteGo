-- Test script to verify real coordinates are being stored
-- This will help us see if the app is successfully storing real GPS coordinates

-- 1. Check current customer locations
SELECT 
    'CURRENT LOCATIONS' as status,
    id,
    full_name,
    email,
    latitude,
    longitude,
    last_location_updated,
    updated_at
FROM public.customers
WHERE latitude IS NOT NULL
ORDER BY last_location_updated DESC;

-- 2. Count how many customers have location data
SELECT 
    'LOCATION STATS' as status,
    COUNT(*) as total_customers,
    COUNT(latitude) as customers_with_latitude,
    COUNT(longitude) as customers_with_longitude,
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as customers_with_both_coords
FROM public.customers;

-- 3. Check for any customers with NULL coordinates
SELECT 
    'CUSTOMERS WITHOUT LOCATION' as status,
    id,
    full_name,
    email,
    latitude,
    longitude,
    last_location_updated
FROM public.customers
WHERE latitude IS NULL OR longitude IS NULL
ORDER BY updated_at DESC;

-- 4. Test with a realistic Ghana location (Accra)
UPDATE public.customers
SET 
    latitude = 5.6037,  -- Accra latitude
    longitude = -0.1870, -- Accra longitude
    last_location_updated = NOW(),
    updated_at = NOW()
WHERE id = (
    SELECT id FROM public.customers 
    WHERE latitude = 6.6885  -- Update one of the test records
    LIMIT 1
);

-- 5. Verify the update worked
SELECT 
    'AFTER ACCRA UPDATE' as status,
    id,
    full_name,
    latitude,
    longitude,
    last_location_updated
FROM public.customers
WHERE latitude = 5.6037 AND longitude = -0.1870;
