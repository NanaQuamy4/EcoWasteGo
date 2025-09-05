-- Test different tracking states for the customer tracking screen

-- Step 1: Check current pickup request statuses
SELECT 'Step 1: Current pickup request statuses:' as info;
SELECT 
  id,
  customer_id,
  recycler_id,
  status,
  created_at,
  updated_at
FROM pickup_requests 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 2: Update a request to 'confirmed' status (recycler accepted but not started navigation)
SELECT 'Step 2: Setting a request to confirmed status...' as info;
UPDATE pickup_requests 
SET status = 'confirmed', updated_at = NOW()
WHERE id IN (
  SELECT id FROM pickup_requests 
  WHERE status IN ('pending', 'assigned') 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Step 3: Update a request to 'in_progress' status (recycler started navigation)
SELECT 'Step 3: Setting a request to in_progress status...' as info;
UPDATE pickup_requests 
SET status = 'in_progress', updated_at = NOW()
WHERE id IN (
  SELECT id FROM pickup_requests 
  WHERE status = 'confirmed' 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Step 4: Update a request to 'arrived' status (recycler arrived)
SELECT 'Step 4: Setting a request to arrived status...' as info;
UPDATE pickup_requests 
SET status = 'arrived', arrived_at = NOW(), updated_at = NOW()
WHERE id IN (
  SELECT id FROM pickup_requests 
  WHERE status = 'in_progress' 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Step 5: Show final status distribution
SELECT 'Step 5: Final status distribution:' as info;
SELECT 
  status,
  COUNT(*) as count
FROM pickup_requests 
GROUP BY status
ORDER BY count DESC;

-- Step 6: Test the tracking function with different statuses
SELECT 'Step 6: Testing tracking function with different statuses...' as info;
WITH test_customers AS (
  SELECT DISTINCT customer_id 
  FROM pickup_requests 
  WHERE customer_id IS NOT NULL
  LIMIT 3
)
SELECT 
  'Customer ID:' as test_info,
  customer_id,
  'Status:' as status_label,
  status,
  'Is Arrived:' as arrived_label,
  (status = 'arrived') as is_arrived
FROM test_customers, LATERAL get_customer_arrival_status(test_customers.customer_id);

-- Success message
SELECT '✅ Tracking states test completed! Now test the tracking screen with different statuses.' as result;
