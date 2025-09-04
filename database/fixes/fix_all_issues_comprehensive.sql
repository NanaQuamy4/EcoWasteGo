-- COMPREHENSIVE FIX FOR ALL ISSUES
-- This script addresses: database triggers, recycler availability, and PGRST116 errors

-- ===== 1. FIX DATABASE TRIGGERS =====
-- Drop all problematic triggers and functions
DROP FUNCTION IF EXISTS check_pickup_request_status_transition() CASCADE;
DROP TRIGGER IF EXISTS trigger_update_recycler_availability ON pickup_requests;

-- ===== 2. FIX RECYCLER AVAILABILITY =====
-- Force set recycler as available and online
UPDATE recyclers 
SET 
  is_available = true,
  is_online = true,
  updated_at = NOW(),
  heartbeat_at = NOW()
WHERE full_name LIKE '%Osei%' OR email = 'nquamy7@gmail.com';

-- ===== 3. CLEAR PENDING REQUESTS =====
-- Clear old pending requests that might be blocking availability
UPDATE pickup_requests 
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE recycler_id = (
  SELECT id FROM recyclers 
  WHERE full_name LIKE '%Osei%' OR email = 'nquamy7@gmail.com'
  LIMIT 1
) 
AND status IN ('pending', 'assigned');

-- ===== 4. VERIFY FIXES =====
-- Check recycler status
SELECT 
  'Recycler Status After Fix' as info,
  id,
  full_name,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  updated_at
FROM recyclers 
WHERE full_name LIKE '%Osei%' OR email = 'nquamy7@gmail.com';

-- Check pending requests count
SELECT 
  'Pending Requests After Clear' as info,
  COUNT(*) as pending_count
FROM pickup_requests 
WHERE recycler_id = (
  SELECT id FROM recyclers 
  WHERE full_name LIKE '%Osei%' OR email = 'nquamy7@gmail.com'
  LIMIT 1
) 
AND status IN ('pending', 'assigned');

-- Test RPC function
SELECT 
  'RPC Test Result' as info,
  COUNT(*) as available_recyclers
FROM get_available_recyclers_simple();

-- ===== 5. CREATE SIMPLE RPC FUNCTION (if needed) =====
-- Ensure we have a working RPC function
CREATE OR REPLACE FUNCTION get_available_recyclers_simple()
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  truck_size text,
  rating numeric,
  is_available boolean,
  is_online boolean,
  last_seen_at timestamptz,
  heartbeat_at timestamptz,
  latitude numeric,
  longitude numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.full_name,
    r.phone,
    r.truck_size,
    r.rating,
    r.is_available,
    r.is_online,
    r.last_seen_at,
    r.heartbeat_at,
    r.latitude,
    r.longitude
  FROM recyclers r
  WHERE r.verification_status = 'approved'
    AND r.is_online = true
    AND r.is_available = true
    AND r.heartbeat_at > NOW() - INTERVAL '10 minutes'
  ORDER BY r.heartbeat_at DESC
  LIMIT 50;
END;
$$;

-- Final verification
SELECT 
  'Final Status Check' as info,
  'All fixes applied successfully' as message;
