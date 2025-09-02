-- Direct fix for Osei Adutwum's verification status
-- This will immediately set the verification status to 'approved'

-- First, let's see the current status
SELECT 
  'Current status for Osei Adutwum:' as info;

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
WHERE au.email = 'nquamy7@gmail.com';

-- Update the verification status to 'approved'
UPDATE recyclers 
SET 
  verification_status = 'approved',
  profile_completed = true,
  updated_at = NOW()
WHERE id = (
  SELECT r.id 
  FROM recyclers r
  JOIN auth.users au ON r.id = au.id
  WHERE au.email = 'nquamy7@gmail.com'
);

-- Show the updated status
SELECT 
  'Updated status for Osei Adutwum:' as info;

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
WHERE au.email = 'nquamy7@gmail.com';
