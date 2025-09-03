-- Quick fix to make the recycler available immediately
-- This will clear their pending requests and set them as available

-- 1. First, let's see what requests they have
SELECT 
    'BEFORE: Current requests' as info,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status IN ('accepted', 'in_progress', 'confirmed') THEN 1 END) as pending_requests
FROM pickup_requests 
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 2. Clear all pending requests (set them back to pending and unassign recycler)
UPDATE pickup_requests 
SET 
    recycler_id = NULL,
    status = 'pending',
    updated_at = NOW()
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
AND status IN ('accepted', 'in_progress', 'confirmed');

-- 3. Set the recycler as available
UPDATE recyclers 
SET 
    is_online = true,
    is_available = true,
    updated_at = NOW()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 4. Check the updated status
SELECT 
    'AFTER: Updated status' as info,
    r.full_name,
    r.is_online,
    r.is_available,
    r.updated_at
FROM recyclers r
WHERE r.id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 5. Verify they now appear in available recyclers
SELECT 
    'VERIFICATION: Available recyclers count' as info,
    COUNT(*) as available_count
FROM get_available_recyclers_for_requests()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- 6. Show the recycler in available list
SELECT 
    'VERIFICATION: Available recycler details' as info,
    full_name,
    email,
    truck_size,
    rating,
    pending_requests_count,
    is_online,
    is_available
FROM get_available_recyclers_for_requests()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';
