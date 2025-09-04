-- Test customer location update functionality
-- This will help identify why latitude/longitude are showing as NULL

-- 1. First, let's see the current state
SELECT 'BEFORE UPDATE' as status, id, full_name, latitude, longitude, last_location_updated 
FROM public.customers 
WHERE latitude IS NULL 
LIMIT 1;

-- 2. Test update with a specific customer ID
-- Replace 'YOUR_CUSTOMER_ID_HERE' with an actual customer ID from your table
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

-- 3. Check if the update worked
SELECT 'AFTER UPDATE' as status, id, full_name, latitude, longitude, last_location_updated 
FROM public.customers 
WHERE latitude IS NOT NULL 
ORDER BY last_location_updated DESC 
LIMIT 1;

-- 4. Check if there are any RLS policies blocking the update
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'customers';

-- 5. Test if we can insert a new customer with location data
INSERT INTO public.customers (id, full_name, email, latitude, longitude, last_location_updated)
VALUES (
    gen_random_uuid(),
    'Test Customer',
    'test@example.com',
    6.6885,
    -1.6244,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. Verify the insert worked
SELECT 'INSERT TEST' as status, id, full_name, latitude, longitude, last_location_updated 
FROM public.customers 
WHERE email = 'test@example.com';
