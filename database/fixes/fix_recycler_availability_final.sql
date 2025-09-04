-- Final fix for recycler availability and busy status issues
-- This ensures proper management of recycler availability

-- First, let's check current recycler status
SELECT 
  'Current Recycler Status' as info,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  latitude,
  longitude
FROM recyclers 
WHERE verification_status = 'approved'
ORDER BY heartbeat_at DESC;

-- Create a function to properly calculate availability
CREATE OR REPLACE FUNCTION calculate_recycler_availability(p_recycler_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  pending_count INTEGER;
  is_online_status BOOLEAN;
  is_verified BOOLEAN;
  recent_heartbeat BOOLEAN;
BEGIN
  -- Check if recycler is verified
  SELECT verification_status = 'approved' INTO is_verified
  FROM recyclers 
  WHERE id = p_recycler_id;
  
  IF NOT is_verified THEN
    RETURN FALSE;
  END IF;
  
  -- Check if recycler is online
  SELECT is_online INTO is_online_status
  FROM recyclers 
  WHERE id = p_recycler_id;
  
  IF NOT is_online_status THEN
    RETURN FALSE;
  END IF;
  
  -- Check if recycler has recent heartbeat (within last 10 minutes)
  SELECT heartbeat_at > NOW() - INTERVAL '10 minutes' INTO recent_heartbeat
  FROM recyclers 
  WHERE id = p_recycler_id;
  
  IF NOT recent_heartbeat THEN
    RETURN FALSE;
  END IF;
  
  -- Count pending requests (accepted, in_progress, confirmed)
  SELECT COUNT(*) INTO pending_count
  FROM pickup_requests 
  WHERE recycler_id = p_recycler_id 
    AND status IN ('accepted', 'in_progress', 'confirmed');
  
  -- Available if less than 5 pending requests
  RETURN pending_count < 5;
END;
$$;

-- Create a function to update recycler availability
CREATE OR REPLACE FUNCTION update_recycler_availability()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  recycler_record RECORD;
  new_availability BOOLEAN;
BEGIN
  -- Update availability for all verified recyclers
  FOR recycler_record IN 
    SELECT id FROM recyclers WHERE verification_status = 'approved'
  LOOP
    -- Calculate new availability status
    SELECT calculate_recycler_availability(recycler_record.id) INTO new_availability;
    
    -- Update the recycler's availability status
    UPDATE recyclers 
    SET 
      is_available = new_availability,
      updated_at = NOW()
    WHERE id = recycler_record.id;
    
    -- Log the update
    RAISE NOTICE 'Updated recycler % availability to %', recycler_record.id, new_availability;
  END LOOP;
END;
$$;

-- Create a trigger to automatically update availability when pickup requests change
CREATE OR REPLACE FUNCTION trigger_update_recycler_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update availability for the affected recycler
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_recycler_availability();
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_recycler_availability();
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_recycler_availability ON pickup_requests;

-- Create the trigger
CREATE TRIGGER trigger_update_recycler_availability
  AFTER INSERT OR UPDATE OR DELETE ON pickup_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_recycler_availability();

-- Update all recycler availability now
SELECT update_recycler_availability();

-- Check the updated status
SELECT 
  'Updated Recycler Status' as info,
  full_name,
  email,
  is_online,
  is_available,
  verification_status,
  heartbeat_at,
  latitude,
  longitude,
  (SELECT COUNT(*) FROM pickup_requests 
   WHERE recycler_id = recyclers.id 
   AND status IN ('accepted', 'in_progress', 'confirmed')) as pending_requests
FROM recyclers 
WHERE verification_status = 'approved'
ORDER BY heartbeat_at DESC;

-- Create a simple function to get available recyclers
CREATE OR REPLACE FUNCTION get_available_recyclers_simple()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  truck_size TEXT,
  rating DECIMAL,
  is_available BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_recycler_availability(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_recycler_availability() TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_recyclers_simple() TO authenticated;

-- Test the new function
SELECT 'Testing new availability function...' as status;
SELECT * FROM get_available_recyclers_simple();
