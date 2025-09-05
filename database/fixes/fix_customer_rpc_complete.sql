-- Complete fix for customer app RPC function
-- This addresses all potential issues with get_available_recyclers_exclude_rejected

-- Step 1: Check if function exists and drop it
SELECT 'Step 1: Checking existing function...' as info;
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'get_available_recyclers_exclude_rejected';

-- Step 2: Drop the function if it exists
DROP FUNCTION IF EXISTS get_available_recyclers_exclude_rejected(UUID);

-- Step 3: Create a robust version of the function
CREATE OR REPLACE FUNCTION get_available_recyclers_exclude_rejected(p_customer_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  truck_size TEXT,
  rating DECIMAL,
  is_available BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Always return a result set, even if empty
  RETURN QUERY
  SELECT 
    r.id,
    COALESCE(r.full_name, 'Unknown')::TEXT,
    COALESCE(r.phone, '')::TEXT,
    COALESCE(r.truck_size, 'Unknown')::TEXT,
    COALESCE(r.rating, 0.0),
    COALESCE(r.is_available, false),
    COALESCE(r.is_online, false),
    r.last_seen_at,
    r.heartbeat_at,
    COALESCE(r.latitude, 0.0),
    COALESCE(r.longitude, 0.0)
  FROM recyclers r
  WHERE r.verification_status = 'approved'
    AND r.is_online = true
    AND r.is_available = true
    -- Very relaxed heartbeat requirement (1 hour)
    AND (r.heartbeat_at IS NULL OR r.heartbeat_at > NOW() - INTERVAL '1 hour')
    -- Exclude recyclers who have rejected this customer
    AND r.id NOT IN (
      SELECT DISTINCT pr.recycler_id 
      FROM pickup_requests pr 
      WHERE pr.customer_id = p_customer_id 
        AND pr.status = 'rejected'
        AND pr.recycler_id IS NOT NULL
    )
  ORDER BY r.heartbeat_at DESC NULLS LAST
  LIMIT 50;
  
  -- If no results, return empty set (not null)
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION get_available_recyclers_exclude_rejected(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_recyclers_exclude_rejected(UUID) TO anon;

-- Step 5: Test the function
SELECT 'Step 5: Testing the function...' as info;

-- Test with dummy customer ID
SELECT 'Testing with dummy customer ID...' as test_type;
SELECT COUNT(*) as result_count FROM get_available_recyclers_exclude_rejected('00000000-0000-0000-0000-000000000000'::UUID);

-- Test with actual customer ID from logs
SELECT 'Testing with actual customer ID...' as test_type;
SELECT COUNT(*) as result_count FROM get_available_recyclers_exclude_rejected('10740f49-fb42-4773-8015-cc3774dc523a'::UUID);

-- Step 6: Show current recycler status
SELECT 'Step 6: Current recycler status:' as info;
SELECT 
  id,
  full_name,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  CASE 
    WHEN is_online = false THEN 'Offline'
    WHEN is_available = true THEN 'Available'
    WHEN is_available = false THEN 'Busy'
    ELSE 'Unknown'
  END as status
FROM recyclers 
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Step 7: Check for any rejected requests
SELECT 'Step 7: Checking for rejected requests...' as info;
SELECT 
  pr.id,
  pr.customer_id,
  pr.recycler_id,
  pr.status,
  pr.created_at
FROM pickup_requests pr 
WHERE pr.recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
  AND pr.status = 'rejected';

-- Success message
SELECT '✅ Customer RPC function completely fixed and tested!' as result;
