-- Fix profile_completed status for recyclers who have completed their profiles
-- This script updates the profile_completed field to true for recyclers who have all required fields filled

-- First, let's see the current state
SELECT 
  'Current profile_completed status:' as info;

SELECT 
  r.id,
  r.full_name,
  r.company_name,
  r.verification_status,
  r.profile_completed,
  CASE 
    WHEN r.full_name IS NOT NULL 
     AND r.company_name IS NOT NULL 
     AND r.residential_address IS NOT NULL 
     AND r.areas_of_operation IS NOT NULL 
     AND r.truck_size IS NOT NULL 
     AND r.truck_number_plate IS NOT NULL 
     AND r.drivers_license IS NOT NULL 
    THEN 'SHOULD BE TRUE'
    ELSE 'SHOULD BE FALSE'
  END as expected_status
FROM recyclers r
ORDER BY r.updated_at DESC;

-- Update profile_completed to true for recyclers who have all required fields
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

-- Show the updated results
SELECT 
  'Updated profile_completed status:' as info;

SELECT 
  r.id,
  r.full_name,
  r.company_name,
  r.verification_status,
  r.profile_completed,
  r.updated_at
FROM recyclers r
ORDER BY r.updated_at DESC;
