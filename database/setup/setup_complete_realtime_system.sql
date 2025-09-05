-- Complete Real-time System Setup
-- This script sets up all necessary components for real-time rewards updates

-- 1. Create recycler_earnings table (if not exists)
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
  points_per_kg DECIMAL(5,2) DEFAULT 1.0,
  bonus_points INTEGER DEFAULT 0,
  
  -- Status and metadata
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_recycler_id ON recycler_earnings(recycler_id);
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_request_id ON recycler_earnings(request_id);
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_payment_summary_id ON recycler_earnings(payment_summary_id);
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_status ON recycler_earnings(status);
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_completed_at ON recycler_earnings(completed_at);
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_eco_points ON recycler_earnings(eco_points_earned);

-- 3. Create updated_at trigger
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

-- 4. Enable Row Level Security
ALTER TABLE recycler_earnings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Recyclers can view their own earnings" ON recycler_earnings;
DROP POLICY IF EXISTS "Admins can view all earnings" ON recycler_earnings;
DROP POLICY IF EXISTS "System can insert earnings" ON recycler_earnings;

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

-- 6. Create helper functions
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
  eco_points_earned INTEGER,
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
    re.eco_points_earned,
    re.completed_at
  FROM recycler_earnings re
  WHERE re.recycler_id = p_recycler_id
  AND re.status = 'completed'
  ORDER BY re.completed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 7. Grant necessary permissions
GRANT SELECT, INSERT ON recycler_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_total_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_earnings_history TO authenticated;

-- 8. Enable real-time for recycler_earnings table
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recycler_earnings') THEN
        -- Check if table is already in realtime publication
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'recycler_earnings'
        ) THEN
            -- Add table to realtime publication
            ALTER PUBLICATION supabase_realtime ADD TABLE recycler_earnings;
            RAISE NOTICE 'Added recycler_earnings table to realtime publication';
        ELSE
            RAISE NOTICE 'recycler_earnings table already in realtime publication';
        END IF;
    ELSE
        RAISE NOTICE 'recycler_earnings table does not exist';
    END IF;
END $$;

-- 9. Enable REPLICA IDENTITY for real-time subscriptions
ALTER TABLE recycler_earnings REPLICA IDENTITY FULL;

-- 10. Create a trigger for real-time notifications when earnings are created
CREATE OR REPLACE FUNCTION notify_recycler_earnings_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Send real-time notification via pg_notify
  PERFORM pg_notify(
    'recycler-earnings-' || NEW.recycler_id,
    json_build_object(
      'event', 'earnings_created',
      'recycler_id', NEW.recycler_id,
      'earnings_id', NEW.id,
      'eco_points_earned', NEW.eco_points_earned,
      'total_amount', NEW.total_amount,
      'status', NEW.status
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_recycler_earnings_created
  AFTER INSERT ON recycler_earnings
  FOR EACH ROW
  EXECUTE FUNCTION notify_recycler_earnings_created();

-- 11. Create a trigger for real-time notifications when earnings are updated
CREATE OR REPLACE FUNCTION notify_recycler_earnings_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Send real-time notification via pg_notify
  PERFORM pg_notify(
    'recycler-earnings-' || NEW.recycler_id,
    json_build_object(
      'event', 'earnings_updated',
      'recycler_id', NEW.recycler_id,
      'earnings_id', NEW.id,
      'eco_points_earned', NEW.eco_points_earned,
      'total_amount', NEW.total_amount,
      'status', NEW.status,
      'old_status', OLD.status
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_recycler_earnings_updated
  AFTER UPDATE ON recycler_earnings
  FOR EACH ROW
  EXECUTE FUNCTION notify_recycler_earnings_updated();

-- 12. Add comments
COMMENT ON TABLE recycler_earnings IS 'Tracks recycler earnings from completed pickups with real-time updates';
COMMENT ON COLUMN recycler_earnings.recycler_earnings IS 'Amount earned by recycler from this pickup';
COMMENT ON COLUMN recycler_earnings.platform_fee IS 'Platform fee deducted from total amount';
COMMENT ON COLUMN recycler_earnings.status IS 'Earnings status: pending, completed, cancelled';
COMMENT ON COLUMN recycler_earnings.completed_at IS 'When the pickup was completed and earnings were finalized';
COMMENT ON COLUMN recycler_earnings.eco_points_earned IS 'Eco points earned from this pickup';

-- 13. Verify the setup
SELECT 
    'recycler_earnings realtime system setup completed' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'recycler_earnings'
        ) THEN 'SUCCESS: Table is in realtime publication'
        ELSE 'ERROR: Table not in realtime publication'
    END as publication_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = 'recycler_earnings' 
            AND relreplident = 'f'
        ) THEN 'SUCCESS: REPLICA IDENTITY FULL enabled'
        ELSE 'ERROR: REPLICA IDENTITY not properly set'
    END as replica_identity_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'trigger_notify_recycler_earnings_created'
        ) THEN 'SUCCESS: Real-time triggers created'
        ELSE 'ERROR: Real-time triggers not created'
    END as trigger_status;
