-- Implement busy recycler logic: mark recyclers as busy when they have 5+ accepted but incomplete requests
-- This prevents recyclers from being overwhelmed with too many requests

-- Step 1: Create function to update recycler availability based on pending request count
CREATE OR REPLACE FUNCTION update_recycler_availability_based_on_requests()
RETURNS TRIGGER AS $$
DECLARE
  recycler_id_var UUID;
  pending_count INTEGER;
BEGIN
  -- Get the recycler_id from the changed row
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    recycler_id_var := COALESCE(NEW.recycler_id, OLD.recycler_id);
  ELSE
    recycler_id_var := OLD.recycler_id;
  END IF;
  
  -- Only proceed if we have a recycler_id
  IF recycler_id_var IS NOT NULL THEN
    -- Count pending requests for this recycler (accepted, in_progress, confirmed)
    SELECT COUNT(*) INTO pending_count
    FROM pickup_requests 
    WHERE recycler_id = recycler_id_var 
    AND status IN ('accepted', 'in_progress', 'confirmed');
    
    -- Update recycler availability based on pending count
    UPDATE recyclers 
    SET 
      is_available = CASE 
        WHEN pending_count >= 5 THEN false  -- Mark as busy if 5+ pending requests
        ELSE true  -- Mark as available if less than 5 pending requests
      END,
      updated_at = NOW()
    WHERE id = recycler_id_var;
    
    RAISE NOTICE 'Updated recycler % availability: % pending requests, is_available = %', 
      recycler_id_var, pending_count, (pending_count < 5);
  END IF;
  
  -- Return the appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger to automatically update availability when pickup_requests change
DROP TRIGGER IF EXISTS trigger_update_recycler_availability ON pickup_requests;
CREATE TRIGGER trigger_update_recycler_availability
  AFTER INSERT OR UPDATE OR DELETE ON pickup_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_recycler_availability_based_on_requests();

-- Step 3: Create function to get available recyclers (excludes busy ones)
CREATE OR REPLACE FUNCTION get_available_recyclers_for_requests()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  truck_size TEXT,
  rating NUMERIC,
  verification_status TEXT,
  is_available BOOLEAN,
  is_online BOOLEAN,
  pending_requests_count INTEGER,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  heartbeat_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.full_name::TEXT,
    r.phone::TEXT,
    r.email::TEXT,
    r.truck_size::TEXT,
    r.rating,
    r.verification_status::TEXT,
    r.is_available,
    r.is_online,
    COALESCE(pending_counts.pending_count, 0)::INTEGER as pending_requests_count,
    r.last_seen_at,
    r.heartbeat_at
  FROM recyclers r
  LEFT JOIN (
    SELECT 
      recycler_id,
      COUNT(*) as pending_count
    FROM pickup_requests 
    WHERE status IN ('accepted', 'in_progress', 'confirmed')
    GROUP BY recycler_id
  ) pending_counts ON r.id = pending_counts.recycler_id
  WHERE 
    r.verification_status = 'approved'  -- Only verified recyclers
    AND r.is_online = true  -- Only online recyclers
    AND r.is_available = true  -- Only available recyclers
    AND COALESCE(pending_counts.pending_count, 0) < 5  -- Less than 5 pending requests
    AND r.heartbeat_at > NOW() - INTERVAL '5 minutes'  -- Active within last 5 minutes
  ORDER BY 
    COALESCE(pending_counts.pending_count, 0) ASC,  -- Prioritize recyclers with fewer pending requests
    r.rating DESC,  -- Then by rating
    r.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update admin functions to show busy status based on pending requests
DROP FUNCTION IF EXISTS admin_get_all_recyclers_status();
CREATE OR REPLACE FUNCTION admin_get_all_recyclers_status()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  truck_size TEXT,
  rating NUMERIC,
  verification_status TEXT,
  is_available BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  heartbeat_at TIMESTAMP WITH TIME ZONE,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  status_category TEXT,
  pending_requests_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.full_name::TEXT,
    r.phone::TEXT,
    r.email::TEXT,
    r.truck_size::TEXT,
    r.rating,
    r.verification_status::TEXT,
    r.is_available,
    r.is_online,
    r.last_seen_at,
    r.heartbeat_at,
    r.session_id::TEXT,
    r.created_at,
    CASE 
      WHEN r.verification_status != 'approved' THEN 'Unverified'::TEXT
      WHEN r.is_online = false THEN 'Offline'::TEXT
      WHEN r.heartbeat_at < NOW() - INTERVAL '5 minutes' THEN 'Inactive'::TEXT
      WHEN COALESCE(pending_counts.pending_count, 0) >= 5 THEN 'Busy (5+ Requests)'::TEXT
      WHEN r.is_available = false THEN 'Busy'::TEXT
      ELSE 'Available'::TEXT
    END as status_category,
    COALESCE(pending_counts.pending_count, 0)::INTEGER as pending_requests_count
  FROM recyclers r
  LEFT JOIN (
    SELECT 
      recycler_id,
      COUNT(*) as pending_count
    FROM pickup_requests 
    WHERE status IN ('accepted', 'in_progress', 'confirmed')
    GROUP BY recycler_id
  ) pending_counts ON r.id = pending_counts.recycler_id
  ORDER BY 
    CASE 
      WHEN r.verification_status != 'approved' THEN 1
      WHEN r.is_online = false THEN 2
      WHEN r.heartbeat_at < NOW() - INTERVAL '5 minutes' THEN 3
      WHEN COALESCE(pending_counts.pending_count, 0) >= 5 THEN 4
      WHEN r.is_available = false THEN 5
      ELSE 6
    END DESC,
    r.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Update admin summary function to include busy recyclers
DROP FUNCTION IF EXISTS admin_get_online_recyclers_summary();
CREATE OR REPLACE FUNCTION admin_get_online_recyclers_summary()
RETURNS TABLE (
  total_recyclers INTEGER,
  verified_recyclers INTEGER,
  online_recyclers INTEGER,
  available_recyclers INTEGER,
  busy_recyclers INTEGER,
  busy_with_requests_recyclers INTEGER,
  offline_recyclers INTEGER,
  inactive_recyclers INTEGER,
  unverified_recyclers INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM recyclers) as total_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE verification_status = 'approved') as verified_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE is_online = true AND heartbeat_at > NOW() - INTERVAL '5 minutes') as online_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers 
     WHERE is_online = true AND is_available = true AND heartbeat_at > NOW() - INTERVAL '5 minutes'
     AND id NOT IN (
       SELECT recycler_id FROM pickup_requests 
       WHERE status IN ('accepted', 'in_progress', 'confirmed')
       GROUP BY recycler_id HAVING COUNT(*) >= 5
     )) as available_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE is_online = true AND is_available = false AND heartbeat_at > NOW() - INTERVAL '5 minutes') as busy_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers 
     WHERE is_online = true AND heartbeat_at > NOW() - INTERVAL '5 minutes'
     AND id IN (
       SELECT recycler_id FROM pickup_requests 
       WHERE status IN ('accepted', 'in_progress', 'confirmed')
       GROUP BY recycler_id HAVING COUNT(*) >= 5
     )) as busy_with_requests_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE is_online = false) as offline_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE is_online = true AND heartbeat_at < NOW() - INTERVAL '5 minutes') as inactive_recyclers,
    (SELECT COUNT(*)::INTEGER FROM recyclers WHERE verification_status != 'approved') as unverified_recyclers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Initialize availability for existing recyclers
DO $$
DECLARE
  recycler_record RECORD;
  pending_count INTEGER;
BEGIN
  FOR recycler_record IN SELECT id FROM recyclers LOOP
    -- Count pending requests for this recycler
    SELECT COUNT(*) INTO pending_count
    FROM pickup_requests 
    WHERE recycler_id = recycler_record.id 
    AND status IN ('accepted', 'in_progress', 'confirmed');
    
    -- Update availability based on pending count
    UPDATE recyclers 
    SET 
      is_available = CASE 
        WHEN pending_count >= 5 THEN false
        ELSE true
      END
    WHERE id = recycler_record.id;
    
    RAISE NOTICE 'Initialized recycler % availability: % pending requests', recycler_record.id, pending_count;
  END LOOP;
END $$;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION get_available_recyclers_for_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION update_recycler_availability_based_on_requests() TO authenticated;

-- Step 8: Test the new functionality
SELECT 'Testing busy recycler logic...' as info;

-- Test: Get available recyclers
SELECT COUNT(*) as available_recyclers_count FROM get_available_recyclers_for_requests();

-- Test: Show recycler status with pending counts
SELECT 
  full_name,
  status_category,
  pending_requests_count,
  is_available
FROM admin_get_all_recyclers_status()
ORDER BY pending_requests_count DESC;

SELECT 'SUCCESS: Busy recycler logic implemented! Recyclers with 5+ pending requests are now marked as busy.' as status;
