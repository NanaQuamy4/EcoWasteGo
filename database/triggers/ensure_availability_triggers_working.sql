-- Ensure availability triggers are working properly
-- This script verifies and fixes the automatic availability updates

-- 1. Check if the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_recycler_availability';

-- 2. Check if the function exists
SELECT 
    routine_name, 
    routine_type, 
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_recycler_availability_based_on_requests';

-- 3. Manually update all recyclers' availability based on their current pending requests
-- (This simulates what the trigger would do)
UPDATE recyclers 
SET 
  is_available = CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pickup_requests 
      WHERE recycler_id = recyclers.id 
      AND status IN ('accepted', 'in_progress', 'confirmed')
    ) >= 5 THEN false
    ELSE true
  END,
  updated_at = NOW()
WHERE verification_status = 'approved';

SELECT 'Updated all recyclers availability based on pending requests' as trigger_simulation;

-- 4. Show current recycler status with pending request counts
SELECT 
    r.full_name,
    r.email,
    r.is_online,
    r.is_available,
    COALESCE(pending_counts.pending_count, 0) as pending_requests,
    CASE 
        WHEN r.verification_status != 'approved' THEN 'Unverified'
        WHEN r.is_online = false THEN 'Offline'
        WHEN r.heartbeat_at < NOW() - INTERVAL '5 minutes' THEN 'Inactive'
        WHEN COALESCE(pending_counts.pending_count, 0) >= 5 THEN 'Busy (5+ Requests)'
        WHEN r.is_available = false THEN 'Busy'
        ELSE 'Available'
    END as status_category
FROM recyclers r
LEFT JOIN (
    SELECT 
        recycler_id,
        COUNT(*) as pending_count
    FROM pickup_requests 
    WHERE status IN ('accepted', 'in_progress', 'confirmed')
    GROUP BY recycler_id
) pending_counts ON r.id = pending_counts.recycler_id
ORDER BY pending_counts.pending_count DESC NULLS LAST;

-- 5. Test the get_available_recyclers_for_requests function
SELECT 
    'Available Recyclers for New Requests:' as info,
    COUNT(*) as count
FROM get_available_recyclers_for_requests();

-- 6. Show detailed available recyclers
SELECT 
    full_name,
    email,
    truck_size,
    rating,
    pending_requests_count,
    is_online,
    is_available
FROM get_available_recyclers_for_requests()
ORDER BY pending_requests_count ASC, rating DESC;

-- 7. Verify the trigger is working by checking a specific recycler
-- Replace 'e9e096bf-7c7b-4338-a619-124d7ae699b6' with the actual recycler ID
SELECT 
    'Recycler Status Check:' as info,
    r.full_name,
    r.is_online,
    r.is_available,
    COALESCE(pending_counts.pending_count, 0) as pending_requests,
    CASE 
        WHEN COALESCE(pending_counts.pending_count, 0) >= 5 THEN 'Should be busy'
        WHEN r.is_online = true AND COALESCE(pending_counts.pending_count, 0) < 5 THEN 'Should be available'
        ELSE 'Should be offline/unavailable'
    END as expected_status
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
