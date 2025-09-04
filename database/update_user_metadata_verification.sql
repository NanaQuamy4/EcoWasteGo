-- Update user metadata to match database verification status
-- This ensures the user metadata is in sync with the database

-- Update the user metadata for Osei Adutwum to reflect approved status
UPDATE auth.users 
SET 
  raw_user_meta_data = raw_user_meta_data || '{"verification_status": "approved"}'::jsonb,
  updated_at = NOW()
WHERE email = 'nquamy7@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data->>'verification_status' as verification_status,
  raw_user_meta_data->>'profile_completed' as profile_completed,
  updated_at
FROM auth.users 
WHERE email = 'nquamy7@gmail.com';
