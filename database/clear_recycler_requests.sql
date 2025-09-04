-- Clear pickup requests for recycler nquamy7@gmail.com (Osei Adutwum)
-- This will make the recycler available for new requests

-- First, let's see what requests exist for this recycler
SELECT 
    pr.id,
    pr.status,
    pr.created_at,
    pr.customer_id,
    r.full_name as recycler_name,
    r.email as recycler_email
FROM pickup_requests pr
LEFT JOIN recyclers r ON pr.recycler_id = r.id
WHERE r.email = 'nquamy7@gmail.com' OR pr.recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'
ORDER BY pr.created_at DESC;

-- Count total requests for this recycler
SELECT COUNT(*) as total_requests
FROM pickup_requests pr
LEFT JOIN recyclers r ON pr.recycler_id = r.id
WHERE r.email = 'nquamy7@gmail.com' OR pr.recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Clear all pickup requests for this recycler
-- This will set them back to 'pending' status and remove the recycler assignment
UPDATE pickup_requests 
SET 
    recycler_id = NULL,
    status = 'pending',
    updated_at = NOW()
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Alternative: If you want to completely delete the requests instead of just unassigning them
-- DELETE FROM pickup_requests 
-- WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Set the recycler as available again
UPDATE recyclers 
SET 
    is_available = true,
    updated_at = NOW()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Verify the recycler is now available
SELECT 
    full_name,
    email,
    is_online,
    is_available,
    updated_at
FROM recyclers 
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Count remaining requests for this recycler (should be 0)
SELECT COUNT(*) as remaining_requests
FROM pickup_requests pr
LEFT JOIN recyclers r ON pr.recycler_id = r.id
WHERE r.email = 'nquamy7@gmail.com' OR pr.recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';
