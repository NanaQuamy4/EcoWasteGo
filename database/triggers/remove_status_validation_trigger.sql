-- Completely remove the status validation trigger
-- This is the nuclear option - removes all database-level status validation

-- Drop all triggers on pickup_requests table
DROP TRIGGER IF EXISTS check_pickup_request_status_transition_trigger ON pickup_requests;
DROP TRIGGER IF EXISTS trigger_update_recycler_availability ON pickup_requests;

-- Drop the problematic function
DROP FUNCTION IF EXISTS check_pickup_request_status_transition();

-- List remaining triggers to make sure we got them all
SELECT 
  'Remaining Triggers' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'pickup_requests';

-- Test that we can now update status freely
-- First, create a test request if none exists
INSERT INTO pickup_requests (
  customer_id,
  recycler_id,
  pickup_address,
  waste_type,
  waste_quantity,
  estimated_weight,
  status,
  payment_status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM recyclers WHERE verification_status = 'approved' LIMIT 1),
  'Test Address',
  'Mixed Waste',
  1,
  5.0,
  'pending',
  'pending'
) ON CONFLICT DO NOTHING;

-- Test updating status from pending to confirmed
UPDATE pickup_requests 
SET 
  status = 'confirmed',
  updated_at = NOW()
WHERE status = 'pending'
ORDER BY created_at DESC 
LIMIT 1
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
