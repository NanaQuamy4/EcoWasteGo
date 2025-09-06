-- IMPLEMENT CUSTOMER REQUEST VALIDATION
-- Prevent customers from placing multiple pickup requests when they have active ones

-- ===== 1. CREATE FUNCTION TO CHECK CUSTOMER REQUEST ELIGIBILITY =====
CREATE OR REPLACE FUNCTION can_customer_place_request(customer_id_param uuid)
RETURNS TABLE (
  can_place_request boolean,
  active_request_id uuid,
  active_request_status text,
  message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  active_request record;
BEGIN
  -- Check for active requests (pending, assigned, confirmed, accepted, in_progress)
  SELECT 
    id,
    status,
    created_at
  INTO active_request
  FROM pickup_requests 
  WHERE customer_id = customer_id_param
    AND status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no active request found, customer can place new request
  IF active_request IS NULL THEN
    RETURN QUERY SELECT 
      true as can_place_request,
      NULL::uuid as active_request_id,
      NULL::text as active_request_status,
      'Customer can place new request' as message;
    RETURN;
  END IF;
  
  -- If active request exists, customer cannot place new request
  RETURN QUERY SELECT 
    false as can_place_request,
    active_request.id as active_request_id,
    active_request.status::text as active_request_status,
    CASE 
      WHEN active_request.status = 'pending' THEN 'You have a pending request waiting for recycler confirmation'
      WHEN active_request.status = 'assigned' THEN 'You have an assigned request waiting for recycler confirmation'
      WHEN active_request.status = 'confirmed' THEN 'You have a confirmed request waiting for recycler acceptance'
      WHEN active_request.status = 'accepted' THEN 'You have an accepted request in progress'
      WHEN active_request.status = 'in_progress' THEN 'You have a request currently being processed'
      ELSE 'You have an active request that must be completed first'
    END as message;
END;
$$;

-- ===== 2. CREATE FUNCTION TO GET CUSTOMER'S ACTIVE REQUEST =====
CREATE OR REPLACE FUNCTION get_customer_active_request(customer_id_param uuid)
RETURNS TABLE (
  id uuid,
  status text,
  recycler_id uuid,
  recycler_name text,
  pickup_address text,
  waste_type text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.status::text,
    pr.recycler_id,
    r.full_name as recycler_name,
    pr.pickup_address,
    pr.waste_type,
    pr.created_at,
    pr.updated_at
  FROM pickup_requests pr
  LEFT JOIN recyclers r ON pr.recycler_id = r.id
  WHERE pr.customer_id = customer_id_param
    AND pr.status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress')
  ORDER BY pr.created_at DESC
  LIMIT 1;
END;
$$;

-- ===== 3. CREATE FUNCTION TO CANCEL CUSTOMER'S ACTIVE REQUEST =====
CREATE OR REPLACE FUNCTION cancel_customer_active_request(customer_id_param uuid)
RETURNS TABLE (
  success boolean,
  cancelled_request_id uuid,
  message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  active_request record;
BEGIN
  -- Get the active request
  SELECT id, status
  INTO active_request
  FROM pickup_requests 
  WHERE customer_id = customer_id_param
    AND status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no active request found
  IF active_request IS NULL THEN
    RETURN QUERY SELECT 
      false as success,
      NULL::uuid as cancelled_request_id,
      'No active request found to cancel' as message;
    RETURN;
  END IF;
  
  -- Cancel the active request
  UPDATE pickup_requests 
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = active_request.id;
  
  -- Update recycler availability if request was accepted or in_progress
  IF active_request.status IN ('accepted', 'in_progress') THEN
    UPDATE recyclers 
    SET 
      is_available = true,
      updated_at = NOW()
    WHERE id = (
      SELECT recycler_id FROM pickup_requests WHERE id = active_request.id
    );
  END IF;
  
  RETURN QUERY SELECT 
    true as success,
    active_request.id as cancelled_request_id,
    'Request cancelled successfully' as message;
END;
$$;

-- ===== 4. TEST THE FUNCTIONS =====
-- Test with a customer ID (replace with actual customer ID)
-- SELECT * FROM can_customer_place_request('your-customer-id-here');

-- Test getting active request
-- SELECT * FROM get_customer_active_request('your-customer-id-here');

-- Test cancelling active request
-- SELECT * FROM cancel_customer_active_request('your-customer-id-here');

-- ===== 5. VERIFY FUNCTIONS WERE CREATED =====
SELECT 
  'Functions Created Successfully' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN (
  'can_customer_place_request',
  'get_customer_active_request', 
  'cancel_customer_active_request'
)
ORDER BY routine_name;
