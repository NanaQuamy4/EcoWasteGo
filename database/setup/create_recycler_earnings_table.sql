-- Create Recycler Earnings Table
-- This table tracks what recyclers earn from each completed pickup

CREATE TABLE IF NOT EXISTS recycler_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recycler_id UUID NOT NULL REFERENCES recyclers(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  payment_summary_id UUID NOT NULL REFERENCES payment_summaries(id) ON DELETE CASCADE,
  
  -- Pickup details
  waste_type VARCHAR(100) NOT NULL,
  weight VARCHAR(50) NOT NULL,
  
  -- Financial breakdown
  base_amount DECIMAL(10,2) NOT NULL,
  environmental_tax DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  recycler_earnings DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0.00,
  
  -- Eco points system
  eco_points_earned INTEGER NOT NULL DEFAULT 0,
  points_per_kg DECIMAL(5,2) DEFAULT 1.0, -- Points per kg of waste
  bonus_points INTEGER DEFAULT 0, -- Bonus for special waste types
  
  -- Status and metadata
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_recycler_id ON recycler_earnings(recycler_id);
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_request_id ON recycler_earnings(request_id);
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_payment_summary_id ON recycler_earnings(payment_summary_id);
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_status ON recycler_earnings(status);
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_completed_at ON recycler_earnings(completed_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_recycler_earnings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recycler_earnings_updated_at
  BEFORE UPDATE ON recycler_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_recycler_earnings_updated_at();

-- Enable Row Level Security
ALTER TABLE recycler_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recycler earnings
-- Recyclers can view their own earnings
CREATE POLICY "Recyclers can view their own earnings" ON recycler_earnings
  FOR SELECT USING (
    recycler_id = auth.uid()
  );

-- Admins can view all earnings
CREATE POLICY "Admins can view all earnings" ON recycler_earnings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- System can insert earnings records
CREATE POLICY "System can insert earnings" ON recycler_earnings
  FOR INSERT WITH CHECK (true);

-- Create function to get recycler total earnings
CREATE OR REPLACE FUNCTION get_recycler_total_earnings(p_recycler_id UUID)
RETURNS TABLE (
  total_earnings DECIMAL(10,2),
  completed_pickups INTEGER,
  average_earnings DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(re.recycler_earnings), 0) as total_earnings,
    COUNT(*)::INTEGER as completed_pickups,
    CASE 
      WHEN COUNT(*) > 0 THEN COALESCE(SUM(re.recycler_earnings), 0) / COUNT(*)
      ELSE 0
    END as average_earnings
  FROM recycler_earnings re
  WHERE re.recycler_id = p_recycler_id
  AND re.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Create function to get recycler earnings history
CREATE OR REPLACE FUNCTION get_recycler_earnings_history(
  p_recycler_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  request_id UUID,
  waste_type VARCHAR(100),
  weight VARCHAR(50),
  total_amount DECIMAL(10,2),
  recycler_earnings DECIMAL(10,2),
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    re.id,
    re.request_id,
    re.waste_type,
    re.weight,
    re.total_amount,
    re.recycler_earnings,
    re.completed_at
  FROM recycler_earnings re
  WHERE re.recycler_id = p_recycler_id
  AND re.status = 'completed'
  ORDER BY re.completed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT ON recycler_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_total_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_earnings_history TO authenticated;

-- Add comments
COMMENT ON TABLE recycler_earnings IS 'Tracks recycler earnings from completed pickups';
COMMENT ON COLUMN recycler_earnings.recycler_earnings IS 'Amount earned by recycler from this pickup';
COMMENT ON COLUMN recycler_earnings.platform_fee IS 'Platform fee deducted from total amount';
COMMENT ON COLUMN recycler_earnings.status IS 'Earnings status: pending, completed, cancelled';
COMMENT ON COLUMN recycler_earnings.completed_at IS 'When the pickup was completed and earnings were finalized';
