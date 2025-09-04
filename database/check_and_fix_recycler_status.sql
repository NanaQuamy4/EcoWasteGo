-- Check current recycler status
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  last_seen_at,
  updated_at
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';

-- Check pending requests for this recycler
SELECT 
  COUNT(*) as pending_count,
  status
FROM pickup_requests 
WHERE recycler_id = (SELECT id FROM recyclers WHERE email = 'nquamy7@gmail.com')
  AND status IN ('accepted', 'in_progress', 'confirmed')
GROUP BY status;

-- Fix: Set recycler as available (clear any busy status)
UPDATE recyclers 
SET 
  is_available = true,
  updated_at = NOW()
WHERE email = 'nquamy7@gmail.com';

-- Verify the fix
SELECT 
  id,
  full_name,
  email,
  is_online,
  is_available,
  verification_status
FROM recyclers 
WHERE email = 'nquamy7@gmail.com';
