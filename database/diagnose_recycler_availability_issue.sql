-- Diagnose why recycler is online but not available
-- This will help identify the exact issue

-- 1. Check the recycler's current status
SELECT 
    '=== RECYCLER STATUS ===' as section,
    r.full_name,
    r.email,
    r.is_online,
    r.is_available,
    r.verification_status,
    r.heartbeat_at,
    r.last_seen_at,
    r.updated_at
FROM recyclers r
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 2. Count ALL requests for this recycler (all statuses)
SELECT 
    '=== ALL REQUESTS COUNT ===' as section,
    status,
    COUNT(*) as count
FROM pickup_requests 
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
GROUP BY status
ORDER BY status;

-- 3. Count pending requests (accepted, in_progress, confirmed)
SELECT 
    '=== PENDING REQUESTS COUNT ===' as section,
    COUNT(*) as pending_requests
FROM pickup_requests 
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
AND status IN ('accepted', 'in_progress', 'confirmed');

-- 4. Show recent requests
SELECT 
    '=== RECENT REQUESTS ===' as section,
    id,
    status,
    created_at,
    updated_at,
    customer_id
FROM pickup_requests 
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Test the get_online_recyclers function
SELECT 
    '=== ONLINE RECYCLERS TEST ===' as section,
    COUNT(*) as online_count
FROM get_online_recyclers()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 6. Test the get_available_recyclers_for_requests function
SELECT 
    '=== AVAILABLE RECYCLERS TEST ===' as section,
    COUNT(*) as available_count
FROM get_available_recyclers_for_requests()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 7. Show what get_available_recyclers_for_requests returns
SELECT 
    '=== AVAILABLE RECYCLERS DETAILS ===' as section,
    full_name,
    email,
    truck_size,
    rating,
    verification_status,
    is_available,
    is_online,
    pending_requests_count,
    last_seen_at,
    heartbeat_at
FROM get_available_recyclers_for_requests()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 8. Check if the recycler meets all criteria for availability
SELECT 
    '=== AVAILABILITY CRITERIA CHECK ===' as section,
    r.full_name,
    r.verification_status = 'approved' as is_verified,
    r.is_online as is_online,
    r.is_available as is_available,
    r.heartbeat_at > NOW() - INTERVAL '5 minutes' as has_recent_heartbeat,
    COALESCE(pending_counts.pending_count, 0) < 5 as has_less_than_5_pending,
    COALESCE(pending_counts.pending_count, 0) as pending_count
FROM recyclers r
LEFT JOIN (
    SELECT 
        recycler_id,
        COUNT(*) as pending_count
    FROM pickup_requests 
    WHERE status IN ('accepted', 'in_progress', 'confirmed')
    GROUP BY recycler_id
) pending_counts ON r.id = pending_counts.recycler_id
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 9. Force update the recycler to be available (if pending < 5)
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

-- 10. Check the updated status
SELECT 
    '=== UPDATED STATUS ===' as section,
    r.full_name,
    r.is_online,
    r.is_available,
    r.updated_at,
    COALESCE(pending_counts.pending_count, 0) as pending_requests
FROM recyclers r
LEFT JOIN (
    SELECT 
        recycler_id,
        COUNT(*) as pending_count
    FROM pickup_requests 
    WHERE status IN ('accepted', 'in_progress', 'confirmed')
    GROUP BY recycler_id
) pending_counts ON r.id = pending_counts.recycler_id
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 11. Final test - check if recycler now appears in available list
SELECT 
    '=== FINAL AVAILABILITY TEST ===' as section,
    COUNT(*) as available_count
FROM get_available_recyclers_for_requests()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';
