-- Test script for verification notification system
-- This script tests the notification triggers for recycler verification

-- First, let's see if we have any recyclers to test with
SELECT 
  'Current recyclers in database:' as info;

SELECT 
  r.id,
  r.full_name,
  r.verification_status,
  au.email
FROM recyclers r
JOIN auth.users au ON r.id = au.id
ORDER BY r.created_at DESC
LIMIT 5;

-- Test 1: Simulate a verification form submission (status change to 'pending')
-- This should trigger a "Verification Form Received" notification
SELECT 
  'Test 1: Simulating verification form submission...' as test_info;

-- Find a recycler with non-pending status to test with
DO $$
DECLARE
  test_recycler_id UUID;
BEGIN
  -- Get a recycler that's not already pending
  SELECT r.id INTO test_recycler_id
  FROM recyclers r
  WHERE r.verification_status != 'pending' OR r.verification_status IS NULL
  LIMIT 1;
  
  IF test_recycler_id IS NOT NULL THEN
    -- Update verification status to 'pending' to simulate form submission
    UPDATE recyclers 
    SET verification_status = 'pending',
        updated_at = NOW()
    WHERE id = test_recycler_id;
    
    RAISE NOTICE 'Test 1 completed: Updated recycler % to pending status', test_recycler_id;
  ELSE
    RAISE NOTICE 'Test 1 skipped: No suitable recycler found for testing';
  END IF;
END $$;

-- Test 2: Simulate admin approval (status change to 'approved')
SELECT 
  'Test 2: Simulating admin approval...' as test_info;

DO $$
DECLARE
  test_recycler_id UUID;
BEGIN
  -- Get a recycler with pending status
  SELECT r.id INTO test_recycler_id
  FROM recyclers r
  WHERE r.verification_status = 'pending'
  LIMIT 1;
  
  IF test_recycler_id IS NOT NULL THEN
    -- Update verification status to 'approved' to simulate admin approval
    UPDATE recyclers 
    SET verification_status = 'approved',
        updated_at = NOW()
    WHERE id = test_recycler_id;
    
    RAISE NOTICE 'Test 2 completed: Updated recycler % to approved status', test_recycler_id;
  ELSE
    RAISE NOTICE 'Test 2 skipped: No pending recycler found for testing';
  END IF;
END $$;

-- Check the notifications that were created
SELECT 
  'Notifications created by tests:' as info;

SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.type,
  n.is_read,
  n.created_at
FROM notifications n
WHERE n.type = 'verification'
ORDER BY n.created_at DESC
LIMIT 5;

-- Summary
SELECT 
  'Test Summary:' as info,
  COUNT(*) as total_verification_notifications
FROM notifications 
WHERE type = 'verification';
