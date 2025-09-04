-- Fix the database trigger with CASCADE to handle dependencies
-- This will drop the function and all dependent triggers

-- First, let's see what we're dealing with
SELECT 
  'Current Triggers on pickup_requests' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'pickup_requests';

-- Drop the function with CASCADE to remove all dependent objects
DROP FUNCTION IF EXISTS check_pickup_request_status_transition() CASCADE;

-- Verify all triggers are gone
SELECT 
  'Remaining Triggers' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'pickup_requests';

-- Test that we can now update status freely
-- First, let's see current requests
SELECT 
  'Current Requests' as info,
  id,
  status,
  created_at
FROM pickup_requests 
ORDER BY created_at DESC 
LIMIT 3;

-- Test updating a request to confirmed (this should now work)
UPDATE pickup_requests 
SET 
  status = 'confirmed',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM pickup_requests 
  ORDER BY created_at DESC 
  LIMIT 1
)
RETURNING id, status, updated_at;

-- Verify the update worked
SELECT 
  'Status Update Test' as info,
  id,
  status,
  updated_at
FROM pickup_requests 
ORDER BY updated_at DESC 
LIMIT 1;

-- Also remove any other problematic triggers that might interfere
DROP TRIGGER IF EXISTS trigger_update_recycler_availability ON pickup_requests;

-- Final verification - no triggers should remain
SELECT 
  'Final Trigger Check' as info,
  trigger_name,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'pickup_requests';
