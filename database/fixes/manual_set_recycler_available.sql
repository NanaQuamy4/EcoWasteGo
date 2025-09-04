-- Manually set a specific recycler to available for testing
-- Replace 'YOUR_RECYCLER_ID' with the actual recycler ID

-- Set recycler to online and available
UPDATE public.recyclers 
SET 
  is_online = true,
  is_available = true,
  heartbeat_at = NOW(),
  updated_at = NOW()
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'; -- Replace with your recycler ID

-- Clear any pending requests that might be making them busy
UPDATE public.pickup_requests
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE 
  recycler_id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6' 
  AND status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress');

-- Verify the status
SELECT 
  id, 
  full_name, 
  is_online, 
  is_available, 
  verification_status,
  heartbeat_at,
  (SELECT COUNT(*) FROM pickup_requests WHERE recycler_id = r.id AND status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress')) as pending_requests
FROM public.recyclers r
WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6';

RAISE NOTICE 'Recycler manually set to available. Pending requests cleared.';
