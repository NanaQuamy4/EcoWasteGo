-- Test the tracking system to ensure it's working properly

-- Step 1: Check if the arrival detection function exists
SELECT 'Step 1: Checking arrival detection function...' as info;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'get_customer_arrival_status';

-- Step 2: Check current pickup requests
SELECT 'Step 2: Current pickup requests:' as info;
SELECT 
  id,
  customer_id,
  recycler_id,
  status,
  created_at,
  arrived_at
FROM pickup_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 3: Test the arrival detection function with a real customer ID
SELECT 'Step 3: Testing arrival detection function...' as info;
-- Get a customer ID from recent requests
WITH recent_customer AS (
  SELECT customer_id 
  FROM pickup_requests 
  WHERE customer_id IS NOT NULL
  ORDER BY created_at DESC 
  LIMIT 1
)
SELECT 
  'Testing with customer ID:' as test_info,
  customer_id
FROM recent_customer;

-- Step 4: Test the function with the customer ID
WITH recent_customer AS (
  SELECT customer_id 
  FROM pickup_requests 
  WHERE customer_id IS NOT NULL
  ORDER BY created_at DESC 
  LIMIT 1
)
SELECT 
  'Arrival status result:' as test_info,
  *
FROM recent_customer, LATERAL get_customer_arrival_status(recent_customer.customer_id);

-- Step 5: Check if there are any requests with 'arrived' status
SELECT 'Step 5: Requests with arrived status:' as info;
SELECT 
  id,
  customer_id,
  recycler_id,
  status,
  arrived_at
FROM pickup_requests 
WHERE status = 'arrived'
ORDER BY arrived_at DESC;

-- Success message
SELECT '✅ Tracking system test completed!' as result;
