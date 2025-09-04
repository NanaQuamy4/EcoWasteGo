-- Create function to update recycler location when they go online
CREATE OR REPLACE FUNCTION update_recycler_location(
  recycler_id UUID,
  new_latitude DECIMAL(10, 8),
  new_longitude DECIMAL(11, 8)
)
RETURNS VOID AS $$
BEGIN
  UPDATE recyclers 
  SET 
    latitude = new_latitude,
    longitude = new_longitude,
    last_seen_at = NOW(),
    heartbeat_at = NOW()
  WHERE id = recycler_id;
  
  -- Log the location update
  RAISE NOTICE 'Updated recycler % location to (%, %)', recycler_id, new_latitude, new_longitude;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_recycler_location(UUID, DECIMAL, DECIMAL) TO authenticated;
