-- =====================================================
-- IMPLEMENT ROBUST RECYCLER ONLINE STATUS TRACKING
-- =====================================================

-- 1. Add new fields to recyclers table for better tracking
ALTER TABLE recyclers 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS heartbeat_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 4.5;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_recyclers_online_status 
ON recyclers(is_available, is_online, last_seen_at);

CREATE INDEX IF NOT EXISTS idx_recyclers_heartbeat 
ON recyclers(heartbeat_at);

-- 3. Function to update recycler heartbeat
CREATE OR REPLACE FUNCTION update_recycler_heartbeat(
  p_recycler_id UUID,
  p_session_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE recyclers 
  SET 
    heartbeat_at = NOW(),
    last_seen_at = NOW(),
    is_online = true,
    session_id = COALESCE(p_session_id, session_id)
  WHERE id = p_recycler_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to set recycler offline
CREATE OR REPLACE FUNCTION set_recycler_offline(
  p_recycler_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE recyclers 
  SET 
    is_online = false,
    is_available = false,
    session_id = NULL
  WHERE id = p_recycler_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to automatically set inactive recyclers offline
CREATE OR REPLACE FUNCTION auto_set_inactive_recyclers_offline()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Set recyclers offline if they haven't sent heartbeat in last 5 minutes
  UPDATE recyclers 
  SET 
    is_online = false,
    is_available = false,
    session_id = NULL
  WHERE 
    is_online = true 
    AND heartbeat_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the update
  INSERT INTO admin_notifications (
    title,
    message,
    type,
    created_at
  ) VALUES (
    'Auto-Offline Update',
    'Set ' || updated_count || ' inactive recyclers offline',
    'system',
    NOW()
  );
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Note: Auto-offline function created but requires external scheduling
-- Since pg_cron is not available, you'll need to set up an external cron job
-- or use a service like Vercel Cron to call auto_set_inactive_recyclers_offline()
-- every minute. For now, the function exists and can be called manually or
-- through your application logic.

-- 7. Function to get online recyclers with their status
CREATE OR REPLACE FUNCTION get_online_recyclers()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  truck_size TEXT,
  rating NUMERIC,
  is_available BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  heartbeat_at TIMESTAMP WITH TIME ZONE
) AS $$
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
    r.heartbeat_at
  FROM recyclers r
  WHERE 
    r.verification_status = 'approved'
    AND r.is_online = true
    AND r.heartbeat_at > NOW() - INTERVAL '5 minutes'
  ORDER BY r.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to get recycler online status
CREATE OR REPLACE FUNCTION get_recycler_online_status(p_recycler_id UUID)
RETURNS TABLE (
  is_online BOOLEAN,
  is_available BOOLEAN,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  heartbeat_at TIMESTAMP WITH TIME ZONE,
  session_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.is_online,
    r.is_available,
    r.last_seen_at,
    r.heartbeat_at,
    r.session_id
  FROM recyclers r
  WHERE r.id = p_recycler_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION update_recycler_heartbeat(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_recycler_offline(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_online_recyclers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_online_status(UUID) TO authenticated;

-- 10. Enable Row Level Security for new functions
ALTER FUNCTION update_recycler_heartbeat(UUID, TEXT) OWNER TO postgres;
ALTER FUNCTION set_recycler_offline(UUID) OWNER TO postgres;
ALTER FUNCTION get_online_recyclers() OWNER TO postgres;
ALTER FUNCTION get_recycler_online_status(UUID) OWNER TO postgres;

-- 11. Create trigger to automatically update last_seen_at when is_available changes
CREATE OR REPLACE FUNCTION update_last_seen_on_availability_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_seen_at when availability status changes
  IF OLD.is_available IS DISTINCT FROM NEW.is_available THEN
    NEW.last_seen_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_seen_availability
  BEFORE UPDATE ON recyclers
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen_on_availability_change();

-- 12. Initialize existing recyclers
UPDATE recyclers 
SET 
  last_seen_at = NOW(),
  heartbeat_at = NOW(),
  is_online = is_available
WHERE last_seen_at IS NULL;

-- 13. Create view for easy querying of online recyclers
CREATE OR REPLACE VIEW online_recyclers_view AS
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
  CASE 
    WHEN r.heartbeat_at > NOW() - INTERVAL '1 minute' THEN 'Active'
    WHEN r.heartbeat_at > NOW() - INTERVAL '5 minutes' THEN 'Online'
    ELSE 'Offline'
  END as status
FROM recyclers r
WHERE r.verification_status = 'approved';

-- Grant access to the view
GRANT SELECT ON online_recyclers_view TO authenticated;

-- 14. Note: Real-time publication already exists
-- The recyclers table is already part of supabase_realtime publication
-- This enables real-time updates when recycler status changes

-- 15. Add RLS policies for the new fields
ALTER TABLE recyclers ENABLE ROW LEVEL SECURITY;

-- Policy for recyclers to update their own heartbeat
CREATE POLICY "Recyclers can update their own heartbeat" ON recyclers
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for recyclers to read their own online status
CREATE POLICY "Recyclers can read their own online status" ON recyclers
  FOR SELECT USING (auth.uid() = id);

-- Policy for customers to read online recyclers
CREATE POLICY "Customers can read online recyclers" ON recyclers
  FOR SELECT USING (
    verification_status = 'approved' 
    AND is_online = true 
    AND heartbeat_at > NOW() - INTERVAL '5 minutes'
  );

COMMENT ON TABLE recyclers IS 'Recyclers table with enhanced online status tracking';
COMMENT ON COLUMN recyclers.last_seen_at IS 'Last time recycler was active in the app';
COMMENT ON COLUMN recyclers.heartbeat_at IS 'Last heartbeat received from recycler app';
COMMENT ON COLUMN recyclers.session_id IS 'Current session identifier for the recycler';
COMMENT ON COLUMN recyclers.is_online IS 'Whether recycler is currently online (based on heartbeat)';
COMMENT ON COLUMN recyclers.rating IS 'Recycler rating (0.00 to 5.00) based on customer feedback';

-- 16. Function to update recycler rating (for future use)
CREATE OR REPLACE FUNCTION update_recycler_rating(
  p_recycler_id UUID,
  p_new_rating NUMERIC
)
RETURNS VOID AS $$
BEGIN
  -- Ensure rating is between 0 and 5
  IF p_new_rating < 0 OR p_new_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 0 and 5';
  END IF;
  
  UPDATE recyclers 
  SET rating = p_new_rating
  WHERE id = p_recycler_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for rating updates
GRANT EXECUTE ON FUNCTION update_recycler_rating(UUID, NUMERIC) TO authenticated;
