-- Check the current pickup request that was created
-- This will help understand the flow

-- 1. Show the most recent pickup request
SELECT 
    'MOST RECENT PICKUP REQUEST:' as info,
    id,
    customer_id,
    recycler_id,
    pickup_address,
    waste_type,
    waste_quantity,
    estimated_weight,
    status,
    created_at,
    updated_at
FROM pickup_requests 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Show all pickup requests for the customer
SELECT 
    'ALL CUSTOMER REQUESTS:' as info,
    id,
    recycler_id,
    pickup_address,
    status,
    created_at
FROM pickup_requests 
WHERE customer_id = '10740f49-fb42-4773-8015-cc3774dc523a'
ORDER BY created_at DESC;

-- 3. Count requests by status
SELECT 
    'REQUESTS BY STATUS:' as info,
    status,
    COUNT(*) as count
FROM pickup_requests 
GROUP BY status
ORDER BY status;

-- 4. Check if there are any requests assigned to the recycler
SELECT 
    'REQUESTS ASSIGNED TO RECYCLER:' as info,
    COUNT(*) as assigned_requests
FROM pickup_requests 
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 5. Show all requests assigned to the recycler
SELECT 
    'RECYCLER ASSIGNED REQUESTS:' as info,
    id,
    customer_id,
    status,
    created_at,
    updated_at
FROM pickup_requests 
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
ORDER BY created_at DESC;
