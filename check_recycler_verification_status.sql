-- Check recycler verification status in the database
-- This helps diagnose verification status issues

-- Check all recyclers and their verification status
SELECT 
  'Current recycler verification statuses:' as info;

SELECT 
  r.id,
  r.full_name,
  r.company_name,
  r.verification_status,
  r.updated_at,
  au.email
FROM recyclers r
JOIN auth.users au ON r.id = au.id
ORDER BY r.updated_at DESC;

-- Check for any recyclers with 'approved' status
SELECT 
  'Recyclers with approved status:' as info;

SELECT 
  r.id,
  r.full_name,
  r.company_name,
  r.verification_status,
  r.updated_at
FROM recyclers r
WHERE r.verification_status = 'approved'
ORDER BY r.updated_at DESC;

-- Check for any recyclers with 'pending' status
SELECT 
  'Recyclers with pending status:' as info;

SELECT 
  r.id,
  r.full_name,
  r.company_name,
  r.verification_status,
  r.updated_at
FROM recyclers r
WHERE r.verification_status = 'pending'
ORDER BY r.updated_at DESC;

-- Check for any recyclers with 'rejected' status
SELECT 
  'Recyclers with rejected status:' as info;

SELECT 
  r.id,
  r.full_name,
  r.company_name,
  r.verification_status,
  r.updated_at
FROM recyclers r
WHERE r.verification_status = 'rejected'
ORDER BY r.updated_at DESC;
