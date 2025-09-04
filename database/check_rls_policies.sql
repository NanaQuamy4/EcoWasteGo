-- Check RLS policies that might be blocking recycler data access
-- This helps diagnose if Row Level Security is preventing the app from reading recycler data

-- Check if RLS is enabled on the recyclers table
SELECT 
  'RLS Status for recyclers table:' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'recyclers';

-- Check RLS policies on the recyclers table
SELECT 
  'RLS Policies on recyclers table:' as info;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'recyclers';

-- Check if the current user can access recycler data
SELECT 
  'Testing recycler data access:' as info;

-- This will show what data the current user can see
SELECT 
  r.id,
  r.full_name,
  r.verification_status,
  r.profile_completed
FROM recyclers r
LIMIT 5;

-- Check auth.users table structure to ensure ID matching
SELECT 
  'Auth users structure:' as info;

SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'recycler'
LIMIT 3;
