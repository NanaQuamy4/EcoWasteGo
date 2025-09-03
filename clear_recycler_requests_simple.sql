-- Simple script to clear all pickup requests for recycler nquamy7@gmail.com
-- This will make the recycler available for new requests

-- Clear all pickup requests for this recycler (unassign them)
UPDATE pickup_requests 
SET 
    recycler_id = NULL,
    status = 'pending',
    updated_at = NOW()
WHERE recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Set the recycler as available again
UPDATE recyclers 
SET 
    is_available = true,
    updated_at = NOW()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

-- Verify the changes
SELECT 
    'Recycler Status' as info,
    full_name,
    email,
    is_online,
    is_available
FROM recyclers 
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';
