-- Debug customer location update issue
-- Check if the update is working and what might be causing NULL values

-- 1. Check current customer data
SELECT 
    id,
    full_name,
    email,
    latitude,
    longitude,
    last_location_updated,
    updated_at
FROM public.customers
ORDER BY updated_at DESC
LIMIT 5;

-- 2. Test manual update to see if it works
UPDATE public.customers
SET 
    latitude = 6.6885,
    longitude = -1.6244,
    last_location_updated = NOW(),
    updated_at = NOW()
WHERE id = (
    SELECT id FROM public.customers 
    WHERE latitude IS NULL 
    LIMIT 1
);

-- 3. Check if the manual update worked
SELECT 
    id,
    full_name,
    email,
    latitude,
    longitude,
    last_location_updated,
    updated_at
FROM public.customers
WHERE latitude IS NOT NULL
ORDER BY updated_at DESC;

-- 4. Check table structure to ensure columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
AND column_name IN ('latitude', 'longitude', 'last_location_updated')
ORDER BY column_name;

-- 5. Check if there are any constraints or triggers
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'customers' 
AND tc.table_schema = 'public'
AND kcu.column_name IN ('latitude', 'longitude', 'last_location_updated');
