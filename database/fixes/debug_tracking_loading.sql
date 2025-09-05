-- Debug why tracking screen is stuck on "Loading tracking information..."

-- Step 1: Check if there are any pickup requests
SELECT 'Step 1: Checking pickup requests...' as info;
SELECT 
  id,
  customer_id,
  recycler_id,
  status,
  created_at
FROM pickup_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 2: Check if there are customers
SELECT 'Step 2: Checking customers...' as info;
SELECT 
  id,
  full_name,
  phone
FROM customers 
LIMIT 5;

-- Step 3: Check if there are recyclers
SELECT 'Step 3: Checking recyclers...' as info;
SELECT 
  id,
  full_name,
  phone,
  latitude,
  longitude
FROM recyclers 
LIMIT 5;

-- Step 4: Test the exact query that's failing
SELECT 'Step 4: Testing the tracking query...' as info;
-- Get a request ID to test with
WITH test_request AS (
  SELECT id 
  FROM pickup_requests 
  ORDER BY created_at DESC 
  LIMIT 1
)
SELECT 
  'Testing with request ID:' as test_info,
  id
FROM test_request;

-- Step 5: Test the join query
WITH test_request AS (
  SELECT id 
  FROM pickup_requests 
  ORDER BY created_at DESC 
  LIMIT 1
)
SELECT 
  pr.id,
  pr.customer_id,
  pr.recycler_id,
  pr.pickup_address,
  pr.status,
  c.full_name as customer_name,
  r.full_name as recycler_name
FROM pickup_requests pr
LEFT JOIN customers c ON pr.customer_id = c.id
LEFT JOIN recyclers r ON pr.recycler_id = r.id
CROSS JOIN test_request tr
WHERE pr.id = tr.id;

-- Success message
SELECT '✅ Tracking loading debug completed!' as result;
