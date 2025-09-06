-- Create Subscription Fees Table
-- This table tracks weekly subscription fees for recyclers

CREATE TABLE IF NOT EXISTS subscription_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recycler_id UUID NOT NULL REFERENCES recyclers(id) ON DELETE CASCADE,
  
  -- Weekly period tracking
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Financial details
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  platform_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  platform_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  
  -- Payment tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_fees_recycler_id ON subscription_fees(recycler_id);
CREATE INDEX IF NOT EXISTS idx_subscription_fees_week_start ON subscription_fees(week_start_date);
CREATE INDEX IF NOT EXISTS idx_subscription_fees_status ON subscription_fees(status);
CREATE INDEX IF NOT EXISTS idx_subscription_fees_recycler_week ON subscription_fees(recycler_id, week_start_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_subscription_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists to avoid conflicts during recreation
DROP TRIGGER IF EXISTS trigger_update_subscription_fees_updated_at ON subscription_fees;

CREATE TRIGGER trigger_update_subscription_fees_updated_at
  BEFORE UPDATE ON subscription_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_fees_updated_at();

-- Create function to calculate weekly subscription fees
CREATE OR REPLACE FUNCTION calculate_weekly_subscription_fees(p_recycler_id UUID, p_week_start DATE)
RETURNS TABLE (
  total_earnings DECIMAL(10,2),
  platform_fee_amount DECIMAL(10,2),
  pickup_count INTEGER
) AS $$
DECLARE
  v_week_end DATE := p_week_start + INTERVAL '6 days';
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(re.total_amount), 0) as total_earnings,
    COALESCE(SUM(re.platform_fee), 0) as platform_fee_amount,
    COUNT(*)::INTEGER as pickup_count
  FROM recycler_earnings re
  WHERE re.recycler_id = p_recycler_id
  AND re.status = 'completed'
  AND DATE(re.completed_at) >= p_week_start
  AND DATE(re.completed_at) <= v_week_end;
END;
$$ LANGUAGE plpgsql;

-- Create function to get or create weekly subscription fee
CREATE OR REPLACE FUNCTION get_or_create_weekly_subscription_fee(p_recycler_id UUID, p_week_start DATE)
RETURNS TABLE (
  id UUID,
  total_earnings DECIMAL(10,2),
  platform_fee_amount DECIMAL(10,2),
  status VARCHAR(20),
  pickup_count INTEGER
) AS $$
DECLARE
  v_week_end DATE := p_week_start + INTERVAL '6 days';
  v_fee_record subscription_fees%ROWTYPE;
  v_calculated_fees RECORD;
BEGIN
  -- Check if subscription fee already exists for this week
  SELECT * INTO v_fee_record
  FROM subscription_fees
  WHERE recycler_id = p_recycler_id
  AND week_start_date = p_week_start;
  
  IF v_fee_record.id IS NULL THEN
    -- Calculate fees for this week
    SELECT * INTO v_calculated_fees
    FROM calculate_weekly_subscription_fees(p_recycler_id, p_week_start);
    
    -- Create new subscription fee record
    INSERT INTO subscription_fees (
      recycler_id,
      week_start_date,
      week_end_date,
      total_earnings,
      platform_fee_amount,
      platform_fee_percentage,
      status
    ) VALUES (
      p_recycler_id,
      p_week_start,
      v_week_end,
      v_calculated_fees.total_earnings,
      v_calculated_fees.platform_fee_amount,
      10.00,
      CASE 
        WHEN v_calculated_fees.platform_fee_amount > 0 THEN 'pending'
        ELSE 'paid'
      END
    ) RETURNING * INTO v_fee_record;
  END IF;
  
  -- Return the fee record
  RETURN QUERY
  SELECT 
    v_fee_record.id,
    v_fee_record.total_earnings,
    v_fee_record.platform_fee_amount,
    v_fee_record.status,
    (SELECT COUNT(*)::INTEGER FROM recycler_earnings 
     WHERE recycler_id = p_recycler_id 
     AND recycler_earnings.status = 'completed'
     AND DATE(completed_at) >= p_week_start 
     AND DATE(completed_at) <= v_week_end) as pickup_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark subscription fee as paid
CREATE OR REPLACE FUNCTION mark_subscription_fee_paid(
  p_fee_id UUID,
  p_payment_method VARCHAR(50),
  p_payment_reference VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  UPDATE subscription_fees 
  SET 
    status = 'paid',
    paid_at = NOW(),
    payment_method = p_payment_method,
    payment_reference = p_payment_reference,
    updated_at = NOW()
  WHERE id = p_fee_id
  AND subscription_fees.status = 'pending';
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Create function to get recycler subscription summary
CREATE OR REPLACE FUNCTION get_recycler_subscription_summary(p_recycler_id UUID)
RETURNS TABLE (
  current_week_fees DECIMAL(10,2),
  current_week_earnings DECIMAL(10,2),
  current_week_pickups INTEGER,
  is_payment_required BOOLEAN,
  overdue_fees DECIMAL(10,2),
  total_pending_fees DECIMAL(10,2)
) AS $$
DECLARE
  v_current_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_current_week_end DATE := v_current_week_start + INTERVAL '6 days';
BEGIN
  RETURN QUERY
  WITH current_week AS (
    SELECT 
      COALESCE(sf.platform_fee_amount, 0) as fees,
      COALESCE(sf.total_earnings, 0) as earnings,
      COALESCE(sf.pickup_count, 0) as pickups
    FROM get_or_create_weekly_subscription_fee(p_recycler_id, v_current_week_start) sf
  ),
  pending_fees AS (
    SELECT 
      COALESCE(SUM(platform_fee_amount), 0) as total_pending,
      COALESCE(SUM(CASE WHEN week_end_date < CURRENT_DATE THEN platform_fee_amount ELSE 0 END), 0) as overdue
    FROM subscription_fees
    WHERE recycler_id = p_recycler_id
    AND subscription_fees.status = 'pending'
  )
  SELECT 
    cw.fees as current_week_fees,
    cw.earnings as current_week_earnings,
    cw.pickups as current_week_pickups,
    (pf.total_pending > 0) as is_payment_required,
    pf.overdue as overdue_fees,
    pf.total_pending as total_pending_fees
  FROM current_week cw, pending_fees pf;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON subscription_fees TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_weekly_subscription_fees(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_weekly_subscription_fee(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_subscription_fee_paid(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_subscription_summary(UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE subscription_fees IS 'Tracks weekly subscription fees for recyclers';
COMMENT ON COLUMN subscription_fees.platform_fee_percentage IS 'Platform fee percentage (default 10%)';
COMMENT ON COLUMN subscription_fees.status IS 'Fee status: pending, paid, overdue';
COMMENT ON COLUMN subscription_fees.paid_at IS 'When the fee was paid';
COMMENT ON COLUMN subscription_fees.payment_method IS 'Method used to pay the fee';
COMMENT ON COLUMN subscription_fees.payment_reference IS 'Reference number for the payment';
