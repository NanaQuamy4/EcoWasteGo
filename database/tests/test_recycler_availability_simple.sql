-- Simple test script for recycler availability logic
-- This tests the availability system without calling trigger functions directly

-- 1. Check the specific recycler's current status
SELECT 
    'Current Recycler Status:' as info,
    r.full_name,
    r.email,
    r.is_online,
    r.is_available,
    r.verification_status,
    r.heartbeat_at,
    r.last_seen_at
FROM recyclers r
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 2. Count pending requests for this recycler
SELECT 
    'Pending Requests Count:' as info,
    COUNT(*) as pending_requests
FROM pickup_requests 
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
AND status IN ('accepted', 'in_progress', 'confirmed');

-- 3. Show all requests for this recycler
SELECT 
    'All Requests for Recycler:' as info,
    id,
    status,
    created_at,
    updated_at
FROM pickup_requests 
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
ORDER BY created_at DESC;

-- 4. Manually update this recycler's availability based on pending requests
UPDATE recyclers 
SET 
  is_available = CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pickup_requests 
      WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
      AND status IN ('accepted', 'in_progress', 'confirmed')
    ) >= 5 THEN false
    ELSE true
  END,
  updated_at = NOW()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 5. Check the updated status
SELECT 
    'Updated Recycler Status:' as info,
    r.full_name,
    r.email,
    r.is_online,
    r.is_available,
    (
      SELECT COUNT(*) 
      FROM pickup_requests 
      WHERE recycler_id = r.id
      AND status IN ('accepted', 'in_progress', 'confirmed')
    ) as pending_requests,
    CASE 
        WHEN r.is_online = true AND r.is_available = true THEN 'Available for new requests'
        WHEN r.is_online = true AND r.is_available = false THEN 'Online but busy'
        WHEN r.is_online = false THEN 'Offline'
        ELSE 'Unknown status'
    END as status_description
FROM recyclers r
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 6. Test if this recycler appears in available recyclers list
SELECT 
    'Available Recyclers Test:' as info,
    COUNT(*) as available_count
FROM get_available_recyclers_for_requests()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 7. Show all available recyclers
SELECT 
    'All Available Recyclers:' as info,
    full_name,
    email,
    truck_size,
    rating,
    pending_requests_count,
    is_online,
    is_available
FROM get_available_recyclers_for_requests()
ORDER BY pending_requests_count ASC, rating DESC;
