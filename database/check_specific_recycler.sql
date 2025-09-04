-- Check recycler verification status
-- Run this to see all recyclers and find the one you need

-- First, show all recyclers to find the one you're looking for
SELECT 
  'All recyclers in the database:' as info;

SELECT 
  r.id,
  r.full_name,
  r.company_name,
  r.verification_status,
  r.profile_completed,
  r.updated_at,
  au.email
FROM recyclers r
JOIN auth.users au ON r.id = au.id
ORDER BY r.updated_at DESC;

-- If you want to check a specific recycler by email, uncomment and modify this:
-- SELECT 
--   'Specific recycler by email:' as info;
-- 
-- SELECT 
--   r.id,
--   r.full_name,
--   r.company_name,
--   r.verification_status,
--   r.profile_completed,
--   r.updated_at,
--   au.email
-- FROM recyclers r
-- JOIN auth.users au ON r.id = au.id
-- WHERE au.email = 'your-email@example.com'; -- Replace with actual email

-- If you want to check a specific recycler by ID, uncomment and modify this:
-- SELECT 
--   'Specific recycler by ID:' as info;
-- 
-- SELECT 
--   r.id,
--   r.full_name,
--   r.company_name,
--   r.verification_status,
--   r.profile_completed,
--   r.updated_at,
--   au.email
-- FROM recyclers r
-- JOIN auth.users au ON r.id = au.id
-- WHERE r.id = 'paste-actual-uuid-here'; -- Replace with actual UUID from above query
