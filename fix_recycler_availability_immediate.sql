-- Immediate fix to make the recycler available
-- This will clear their pending requests and make them available for new requests

-- 1. Check current status
SELECT 
    'BEFORE FIX:' as info,
    r.full_name,
    r.is_online,
    r.is_available,
    (
        SELECT COUNT(*) 
        FROM pickup_requests 
        WHERE recycler_id = r.id
        AND status IN ('accepted', 'in_progress', 'confirmed')
    ) as pending_requests
FROM recyclers r
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 2. Clear all pending requests (unassign them)
UPDATE pickup_requests 
SET 
    recycler_id = NULL,
    status = 'pending',
    updated_at = NOW()
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
AND status IN ('accepted', 'in_progress', 'confirmed');

-- 3. Set recycler as available
UPDATE recyclers 
SET 
    is_online = true,
    is_available = true,
    updated_at = NOW()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 4. Check updated status
SELECT 
    'AFTER FIX:' as info,
    r.full_name,
    r.is_online,
    r.is_available,
    (
        SELECT COUNT(*) 
        FROM pickup_requests 
        WHERE recycler_id = r.id
        AND status IN ('accepted', 'in_progress', 'confirmed')
    ) as pending_requests
FROM recyclers r
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 5. Test if recycler now appears in available list
SELECT 
    'AVAILABILITY TEST:' as info,
    COUNT(*) as available_count
FROM get_available_recyclers_for_requests()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 6. Show the recycler details
SELECT 
    'RECYCLER DETAILS:' as info,
    full_name,
    email,
    truck_size,
    rating,
    pending_requests_count,
    is_online,
    is_available
FROM get_available_recyclers_for_requests()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';
