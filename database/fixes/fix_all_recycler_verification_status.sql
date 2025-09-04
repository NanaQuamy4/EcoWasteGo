-- Comprehensive fix for all recycler verification statuses
-- This script ensures all recyclers have the correct verification status and profile completion

-- First, let's see the current state of all recyclers
SELECT 
  'Current state of all recyclers:' as info;

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

-- Update profile_completed to true for all recyclers who have completed their profiles
UPDATE recyclers 
SET 
  profile_completed = true,
  updated_at = NOW()
WHERE 
  full_name IS NOT NULL 
  AND company_name IS NOT NULL 
  AND residential_address IS NOT NULL 
  AND areas_of_operation IS NOT NULL 
  AND truck_size IS NOT NULL 
  AND truck_number_plate IS NOT NULL 
  AND drivers_license IS NOT NULL 
  AND profile_completed = false;

-- If you want to manually set specific recyclers to 'approved' status, uncomment and modify this:
-- UPDATE recyclers 
-- SET 
--   verification_status = 'approved',
--   updated_at = NOW()
-- WHERE id = 'e9e096bf-7c7b-4338-a619-124d7ae699b6'; -- Replace with actual recycler ID

-- Show the updated results
SELECT 
  'Updated state of all recyclers:' as info;

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

-- Check for any recyclers that still need attention
SELECT 
  'Recyclers needing attention:' as info;

SELECT 
  r.id,
  r.full_name,
  r.company_name,
  r.verification_status,
  r.profile_completed,
  au.email,
  CASE 
    WHEN r.verification_status IS NULL THEN 'Missing verification status'
    WHEN r.verification_status = 'incomplete' THEN 'Needs verification'
    WHEN r.profile_completed = false THEN 'Profile not marked as completed'
    ELSE 'OK'
  END as issue
FROM recyclers r
JOIN auth.users au ON r.id = au.id
WHERE 
  r.verification_status IS NULL 
  OR r.verification_status = 'incomplete'
  OR r.profile_completed = false
ORDER BY r.updated_at DESC;
