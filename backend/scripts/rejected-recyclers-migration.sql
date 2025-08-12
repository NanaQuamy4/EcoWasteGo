-- Migration script to track rejected recyclers
-- This ensures that recyclers who reject requests are not shown again to the same customer

-- Create rejected_recyclers table
CREATE TABLE IF NOT EXISTS rejected_recyclers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES waste_collections(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recycler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rejected_recyclers_request_id ON rejected_recyclers(request_id);
CREATE INDEX IF NOT EXISTS idx_rejected_recyclers_customer_id ON rejected_recyclers(customer_id);
CREATE INDEX IF NOT EXISTS idx_rejected_recyclers_recycler_id ON rejected_recyclers(recycler_id);
CREATE INDEX IF NOT EXISTS idx_rejected_recyclers_customer_recycler ON rejected_recyclers(customer_id, recycler_id);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_rejected_recyclers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rejected_recyclers_updated_at
  BEFORE UPDATE ON rejected_recyclers
  FOR EACH ROW
  EXECUTE FUNCTION update_rejected_recyclers_updated_at();

-- Create view for easy querying of rejected recyclers per customer
CREATE OR REPLACE VIEW customer_rejected_recyclers AS
SELECT 
  customer_id,
  recycler_id,
  COUNT(*) as rejection_count,
  MAX(rejected_at) as last_rejected_at,
  STRING_AGG(DISTINCT rejection_reason, '; ') as rejection_reasons
FROM rejected_recyclers
GROUP BY customer_id, recycler_id;

-- Row Level Security (RLS) policies
ALTER TABLE rejected_recyclers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own rejections
CREATE POLICY "Users can view their own rejections" ON rejected_recyclers
  FOR SELECT USING (
    auth.uid() = customer_id OR auth.uid() = recycler_id
  );

-- Policy: Only authenticated users can insert rejections
CREATE POLICY "Authenticated users can insert rejections" ON rejected_recyclers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Only the customer can update their rejections
CREATE POLICY "Customers can update their rejections" ON rejected_recyclers
  FOR UPDATE USING (auth.uid() = customer_id);

-- Policy: Only the customer can delete their rejections
CREATE POLICY "Customers can delete their rejections" ON rejected_recyclers
  FOR DELETE USING (auth.uid() = customer_id);

-- Function to get available recyclers excluding rejected ones
CREATE OR REPLACE FUNCTION get_available_recyclers_excluding_rejected(
  p_customer_id UUID,
  p_location TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  business_name TEXT,
  vehicle_type TEXT,
  rating NUMERIC,
  total_collections INTEGER,
  is_available BOOLEAN,
  service_areas TEXT[],
  city TEXT,
  state TEXT,
  address TEXT,
  profile_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    r.business_name,
    r.vehicle_type,
    r.rating,
    r.total_collections,
    r.is_available,
    r.service_areas,
    r.city,
    r.state,
    r.address,
    r.profile_image
  FROM users u
  INNER JOIN recyclers r ON u.id = r.user_id
  WHERE u.role = 'recycler'
    AND r.is_available = true
    AND u.id NOT IN (
      SELECT recycler_id 
      FROM rejected_recyclers 
      WHERE customer_id = p_customer_id
    )
    AND (
      p_location IS NULL 
      OR r.service_areas @> ARRAY[p_location]
      OR r.city ILIKE '%' || p_location || '%'
      OR r.state ILIKE '%' || p_location || '%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON rejected_recyclers TO authenticated;
GRANT INSERT ON rejected_recyclers TO authenticated;
GRANT UPDATE ON rejected_recyclers TO authenticated;
GRANT DELETE ON rejected_recyclers TO authenticated;
GRANT SELECT ON customer_rejected_recyclers TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_recyclers_excluding_rejected TO authenticated;
