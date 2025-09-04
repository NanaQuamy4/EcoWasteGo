-- Fix recycler busy logic: Only set to busy if they have 5+ pending/assigned/confirmed/accepted/in_progress requests
-- This gives recyclers manual control but still automatically sets them busy when overloaded

-- First, disable the old trigger and functions
DROP TRIGGER IF EXISTS trigger_update_recycler_availability ON pickup_requests;
DROP FUNCTION IF EXISTS trigger_update_recycler_availability() CASCADE;
DROP FUNCTION IF EXISTS update_recycler_availability() CASCADE;
DROP FUNCTION IF EXISTS calculate_recycler_availability(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_specific_recycler_availability(uuid) CASCADE;
DROP FUNCTION IF EXISTS trigger_update_specific_recycler_availability() CASCADE;

-- Create a new function that properly calculates recycler availability
CREATE OR REPLACE FUNCTION calculate_recycler_availability(recycler_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    pending_count integer;
BEGIN
    -- Count pending requests (not completed)
    SELECT COUNT(*)
    INTO pending_count
    FROM pickup_requests
    WHERE recycler_id = recycler_id_param
      AND status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress');
    
    -- Return true if available (less than 5 pending), false if busy (5 or more pending)
    RETURN pending_count < 5;
END;
$$;

-- Create a function to update a specific recycler's availability
CREATE OR REPLACE FUNCTION update_specific_recycler_availability(recycler_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    should_be_available boolean;
    current_online_status boolean;
BEGIN
    -- Get current online status
    SELECT is_online INTO current_online_status
    FROM recyclers
    WHERE id = recycler_id_param;
    
    -- Only update if recycler is online
    IF current_online_status THEN
        -- Calculate if they should be available
        should_be_available := calculate_recycler_availability(recycler_id_param);
        
        -- Update availability
        UPDATE recyclers
        SET 
            is_available = should_be_available,
            updated_at = NOW()
        WHERE id = recycler_id_param;
        
        RAISE NOTICE 'Updated recycler % availability to % (pending requests: %)', 
            recycler_id_param, 
            should_be_available,
            (SELECT COUNT(*) FROM pickup_requests WHERE recycler_id = recycler_id_param AND status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress'));
    END IF;
END;
$$;

-- Create a new trigger function that only updates the specific recycler
CREATE OR REPLACE FUNCTION trigger_update_specific_recycler_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected_recycler_id uuid;
BEGIN
    -- Determine which recycler to update
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        affected_recycler_id := COALESCE(NEW.recycler_id, OLD.recycler_id);
    ELSIF TG_OP = 'DELETE' THEN
        affected_recycler_id := OLD.recycler_id;
    END IF;
    
    -- Only update if we have a recycler_id
    IF affected_recycler_id IS NOT NULL THEN
        PERFORM update_specific_recycler_availability(affected_recycler_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the new trigger
CREATE TRIGGER trigger_update_specific_recycler_availability
  AFTER INSERT OR UPDATE OR DELETE ON pickup_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_specific_recycler_availability();

-- Update all recyclers with the new logic
UPDATE recyclers
SET 
    is_available = calculate_recycler_availability(id),
    updated_at = NOW()
WHERE is_online = true AND verification_status = 'approved';

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_recycler_availability(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_specific_recycler_availability(uuid) TO authenticated;

-- Verify the new system
SELECT 
    r.id,
    r.full_name,
    r.is_online,
    r.is_available,
    (SELECT COUNT(*) FROM pickup_requests pr 
     WHERE pr.recycler_id = r.id 
     AND pr.status IN ('pending', 'assigned', 'confirmed', 'accepted', 'in_progress')) as pending_requests,
    CASE 
        WHEN r.is_online = false THEN 'Offline'
        WHEN r.is_available = true THEN 'Available'
        WHEN r.is_available = false THEN 'Busy (5+ pending)'
        ELSE 'Unknown'
    END as status
FROM recyclers r
WHERE r.is_online = true
ORDER BY r.full_name;

-- Success message
SELECT 'New recycler availability system implemented: Recyclers are set to busy only when they have 5+ pending/assigned/confirmed/accepted/in_progress requests.' as message;
