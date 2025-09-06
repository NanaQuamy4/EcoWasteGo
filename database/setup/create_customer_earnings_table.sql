-- Create Customer Earnings Table
-- This table tracks customer points, achievements, and environmental impact

CREATE TABLE IF NOT EXISTS customer_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  
  -- Pickup details
  waste_type VARCHAR(50) NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  
  -- Points system
  base_points INTEGER NOT NULL DEFAULT 0, -- Base points for recycling
  bonus_points INTEGER DEFAULT 0, -- Bonus points for special waste types
  total_points INTEGER NOT NULL DEFAULT 0, -- Total points earned
  
  -- Environmental impact
  co2_saved DECIMAL(8,2) NOT NULL DEFAULT 0, -- CO2 saved in kg
  trees_equivalent DECIMAL(8,2) NOT NULL DEFAULT 0, -- Trees equivalent
  landfill_space_saved DECIMAL(8,2) NOT NULL DEFAULT 0, -- Landfill space saved in m³
  energy_saved DECIMAL(8,2) NOT NULL DEFAULT 0, -- Energy saved in kWh
  
  -- Achievement tracking
  achievements_earned TEXT[], -- Array of achievement keys earned
  new_achievements TEXT[], -- Array of new achievements earned in this pickup
  
  -- Status and metadata
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_earnings_customer_id ON customer_earnings(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_earnings_request_id ON customer_earnings(request_id);
CREATE INDEX IF NOT EXISTS idx_customer_earnings_status ON customer_earnings(status);
CREATE INDEX IF NOT EXISTS idx_customer_earnings_completed_at ON customer_earnings(completed_at);
CREATE INDEX IF NOT EXISTS idx_customer_earnings_total_points ON customer_earnings(total_points);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_customer_earnings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_earnings_updated_at
  BEFORE UPDATE ON customer_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_earnings_updated_at();

-- Enable Row Level Security
ALTER TABLE customer_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer earnings
-- Customers can view their own earnings
CREATE POLICY "Customers can view their own earnings" ON customer_earnings
  FOR SELECT USING (
    customer_id = auth.uid()
  );

-- Admins can view all earnings
CREATE POLICY "Admins can view all earnings" ON customer_earnings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- System can insert earnings records
CREATE POLICY "System can insert earnings" ON customer_earnings
  FOR INSERT WITH CHECK (true);

-- Create function to get customer total stats
CREATE OR REPLACE FUNCTION get_customer_total_stats(p_customer_id UUID)
RETURNS TABLE (
  total_points INTEGER,
  total_pickups INTEGER,
  total_weight_kg DECIMAL(8,2),
  total_co2_saved DECIMAL(8,2),
  total_trees_equivalent DECIMAL(8,2),
  total_landfill_saved DECIMAL(8,2),
  total_energy_saved DECIMAL(8,2),
  average_points_per_pickup DECIMAL(8,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ce.total_points), 0)::INTEGER as total_points,
    COUNT(*)::INTEGER as total_pickups,
    COALESCE(SUM(ce.weight_kg), 0) as total_weight_kg,
    COALESCE(SUM(ce.co2_saved), 0) as total_co2_saved,
    COALESCE(SUM(ce.trees_equivalent), 0) as total_trees_equivalent,
    COALESCE(SUM(ce.landfill_space_saved), 0) as total_landfill_saved,
    COALESCE(SUM(ce.energy_saved), 0) as total_energy_saved,
    CASE 
      WHEN COUNT(*) > 0 THEN (COALESCE(SUM(ce.total_points), 0)::DECIMAL / COUNT(*)::DECIMAL)::DECIMAL(8,2)
      ELSE 0::DECIMAL(8,2)
    END as average_points_per_pickup
  FROM customer_earnings ce
  WHERE ce.customer_id = p_customer_id
  AND ce.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Create function to get customer earnings history
CREATE OR REPLACE FUNCTION get_customer_earnings_history(
  p_customer_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  request_id UUID,
  waste_type VARCHAR(50),
  weight_kg DECIMAL(5,2),
  total_points INTEGER,
  co2_saved DECIMAL(8,2),
  achievements_earned TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.request_id,
    ce.waste_type,
    ce.weight_kg,
    ce.total_points,
    ce.co2_saved,
    ce.achievements_earned,
    ce.completed_at
  FROM customer_earnings ce
  WHERE ce.customer_id = p_customer_id
  AND ce.status = 'completed'
  ORDER BY ce.completed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get customer achievements
CREATE OR REPLACE FUNCTION get_customer_achievements(p_customer_id UUID)
RETURNS TABLE (
  achievement_key TEXT,
  title TEXT,
  description TEXT,
  points INTEGER,
  earned BOOLEAN,
  earned_date TIMESTAMP WITH TIME ZONE,
  current_progress INTEGER,
  required_progress INTEGER
) AS $$
DECLARE
  stats RECORD;
BEGIN
  -- Get customer stats
  SELECT * INTO stats FROM get_customer_total_stats(p_customer_id);
  
  -- Return achievements with progress
  RETURN QUERY
  SELECT 
    'first_pickup'::TEXT as achievement_key,
    'First Pickup'::TEXT as title,
    'Complete your first waste pickup'::TEXT as description,
    50::INTEGER as points,
    (stats.total_pickups >= 1)::BOOLEAN as earned,
    CASE WHEN stats.total_pickups >= 1 THEN 
      (SELECT completed_at FROM customer_earnings WHERE customer_id = p_customer_id ORDER BY completed_at ASC LIMIT 1)
    ELSE NULL END as earned_date,
    stats.total_pickups::INTEGER as current_progress,
    1::INTEGER as required_progress
  UNION ALL
  SELECT 
    'eco_warrior'::TEXT,
    'Eco Warrior'::TEXT,
    'Complete 5 eco-friendly pickups'::TEXT,
    100::INTEGER,
    (stats.total_pickups >= 5)::BOOLEAN,
    CASE WHEN stats.total_pickups >= 5 THEN 
      (SELECT completed_at FROM customer_earnings WHERE customer_id = p_customer_id ORDER BY completed_at ASC LIMIT 1 OFFSET 4)
    ELSE NULL END,
    stats.total_pickups::INTEGER,
    5::INTEGER
  UNION ALL
  SELECT 
    'waste_reducer'::TEXT,
    'Waste Reducer'::TEXT,
    'Recycle 20kg of waste'::TEXT,
    75::INTEGER,
    (stats.total_weight_kg >= 20)::BOOLEAN,
    CASE WHEN stats.total_weight_kg >= 20 THEN 
      (SELECT completed_at FROM customer_earnings WHERE customer_id = p_customer_id ORDER BY completed_at ASC LIMIT 1)
    ELSE NULL END,
    stats.total_weight_kg::INTEGER,
    20::INTEGER
  UNION ALL
  SELECT 
    'environmental_champion'::TEXT,
    'Environmental Champion'::TEXT,
    'Recycle 50kg of waste'::TEXT,
    150::INTEGER,
    (stats.total_weight_kg >= 50)::BOOLEAN,
    CASE WHEN stats.total_weight_kg >= 50 THEN 
      (SELECT completed_at FROM customer_earnings WHERE customer_id = p_customer_id ORDER BY completed_at ASC LIMIT 1)
    ELSE NULL END,
    stats.total_weight_kg::INTEGER,
    50::INTEGER
  UNION ALL
  SELECT 
    'recycling_master'::TEXT,
    'Recycling Master'::TEXT,
    'Recycle 100kg of waste'::TEXT,
    200::INTEGER,
    (stats.total_weight_kg >= 100)::BOOLEAN,
    CASE WHEN stats.total_weight_kg >= 100 THEN 
      (SELECT completed_at FROM customer_earnings WHERE customer_id = p_customer_id ORDER BY completed_at ASC LIMIT 1)
    ELSE NULL END,
    stats.total_weight_kg::INTEGER,
    100::INTEGER
  UNION ALL
  SELECT 
    'planet_protector'::TEXT,
    'Planet Protector'::TEXT,
    'Recycle 200kg of waste'::TEXT,
    300::INTEGER,
    (stats.total_weight_kg >= 200)::BOOLEAN,
    CASE WHEN stats.total_weight_kg >= 200 THEN 
      (SELECT completed_at FROM customer_earnings WHERE customer_id = p_customer_id ORDER BY completed_at ASC LIMIT 1)
    ELSE NULL END,
    stats.total_weight_kg::INTEGER,
    200::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT ON customer_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_total_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_earnings_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_achievements TO authenticated;

-- Add comments
COMMENT ON TABLE customer_earnings IS 'Tracks customer points, achievements, and environmental impact from completed pickups';
COMMENT ON COLUMN customer_earnings.base_points IS 'Base points earned for recycling';
COMMENT ON COLUMN customer_earnings.bonus_points IS 'Bonus points for special waste types';
COMMENT ON COLUMN customer_earnings.total_points IS 'Total points earned from this pickup';
COMMENT ON COLUMN customer_earnings.co2_saved IS 'CO2 saved in kg from this pickup';
COMMENT ON COLUMN customer_earnings.trees_equivalent IS 'Trees equivalent saved from this pickup';
COMMENT ON COLUMN customer_earnings.achievements_earned IS 'Array of achievement keys earned from this pickup';
COMMENT ON COLUMN customer_earnings.new_achievements IS 'Array of new achievements earned in this pickup';

-- Enable real-time for customer_earnings table
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_earnings') THEN
        -- Check if table is already in realtime publication
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'customer_earnings'
        ) THEN
            -- Add table to realtime publication
            ALTER PUBLICATION supabase_realtime ADD TABLE customer_earnings;
            RAISE NOTICE 'Added customer_earnings table to realtime publication';
        ELSE
            RAISE NOTICE 'customer_earnings table already in realtime publication';
        END IF;
    ELSE
        RAISE NOTICE 'customer_earnings table does not exist';
    END IF;
END $$;

-- Enable REPLICA IDENTITY for real-time subscriptions
ALTER TABLE customer_earnings REPLICA IDENTITY FULL;

-- Create trigger for real-time notifications when earnings are created
CREATE OR REPLACE FUNCTION notify_customer_earnings_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Send real-time notification via pg_notify
  PERFORM pg_notify(
    'customer-earnings-' || NEW.customer_id,
    json_build_object(
      'event', 'earnings_created',
      'customer_id', NEW.customer_id,
      'earnings_id', NEW.id,
      'total_points', NEW.total_points,
      'achievements_earned', NEW.achievements_earned,
      'status', NEW.status
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_customer_earnings_created
  AFTER INSERT ON customer_earnings
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_earnings_created();

-- Verify the setup
SELECT 
    'customer_earnings table setup completed' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'customer_earnings'
        ) THEN 'SUCCESS: Table is in realtime publication'
        ELSE 'ERROR: Table not in realtime publication'
    END as publication_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = 'customer_earnings' 
            AND relreplident = 'f'
        ) THEN 'SUCCESS: REPLICA IDENTITY FULL enabled'
        ELSE 'ERROR: REPLIck CA IDENTITY not properly set'
    END as replica_identity_status;
