-- Create Payment Summaries Table
-- This table stores payment summaries sent by recyclers to customers

-- Create sequence for payment summaries ID
CREATE SEQUENCE IF NOT EXISTS payment_summaries_id_seq;

CREATE TABLE IF NOT EXISTS payment_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
  recycler_id UUID NOT NULL REFERENCES recyclers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Payment details
  weight VARCHAR(50) NOT NULL, -- e.g., "10 kg"
  waste_type VARCHAR(100) NOT NULL,
  rate VARCHAR(50) NOT NULL, -- e.g., "₵1.20/kg"
  base_amount DECIMAL(10,2) NOT NULL,
  environmental_tax DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status and metadata
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional details
  notes TEXT,
  quality_rating VARCHAR(20), -- e.g., "good", "fair", "poor"
  contamination_level DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
  
  -- Rejection details
  rejection_reason TEXT,
  selected_reason VARCHAR(50), -- predefined reason ID
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_acknowledged BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_summaries_request_id ON payment_summaries(request_id);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_recycler_id ON payment_summaries(recycler_id);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_customer_id ON payment_summaries(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_status ON payment_summaries(status);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_created_at ON payment_summaries(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_rejected_at ON payment_summaries(rejected_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_summaries_updated_at
  BEFORE UPDATE ON payment_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_summaries_updated_at();

-- Enable Row Level Security
ALTER TABLE payment_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment summaries
-- Recyclers can insert and update their own payment summaries
CREATE POLICY "Recyclers can manage their payment summaries" ON payment_summaries
  FOR ALL USING (
    recycler_id = auth.uid()
  );

-- Customers can view their own payment summaries
CREATE POLICY "Customers can view their payment summaries" ON payment_summaries
  FOR SELECT USING (
    customer_id = auth.uid()
  );

-- Admins can view all payment summaries
CREATE POLICY "Admins can view all payment summaries" ON payment_summaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Create function to send payment summary notification
CREATE OR REPLACE FUNCTION notify_payment_summary_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification to customer (using customer_id directly as user_id)
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    created_at
  ) VALUES (
    NEW.customer_id,
    'payment_summary',
    'Payment Summary Ready',
    'Your recycler has sent the payment summary for your waste collection.',
    jsonb_build_object(
      'request_id', NEW.request_id,
      'payment_summary_id', NEW.id,
      'total_amount', NEW.total_amount,
      'recycler_id', NEW.recycler_id
    ),
    NOW()
  );

  -- Send real-time notification via pg_notify
  PERFORM pg_notify(
    'payment-summary-' || NEW.request_id,
    json_build_object(
      'event', 'payment_summary_created',
      'payment_summary', row_to_json(NEW)
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment summary notifications
CREATE TRIGGER trigger_notify_payment_summary_created
  AFTER INSERT ON payment_summaries
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_summary_created();

-- Create function to handle payment rejection
CREATE OR REPLACE FUNCTION handle_payment_rejection()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to rejected
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    -- Set rejection timestamp
    NEW.rejected_at = NOW();
    
    -- Create notification for recycler (using recycler_id directly as user_id)
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    ) VALUES (
      NEW.recycler_id,
      'payment_rejected',
      'Payment Rejected',
      'Customer has rejected your payment summary. Reason: ' || COALESCE(NEW.selected_reason, 'Custom reason provided'),
      jsonb_build_object(
        'payment_summary_id', NEW.id,
        'request_id', NEW.request_id,
        'customer_id', NEW.customer_id,
        'rejection_reason', NEW.rejection_reason,
        'selected_reason', NEW.selected_reason,
        'can_edit', true,
        'rejected_at', NEW.rejected_at
      ),
      NOW()
    );

    -- Send real-time notification to recycler
    PERFORM pg_notify(
      'recycler-notifications-' || NEW.recycler_id,
      json_build_object(
        'event', 'payment_rejected',
        'payment_summary', row_to_json(NEW)
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment rejection
CREATE TRIGGER trigger_handle_payment_rejection
  BEFORE UPDATE ON payment_summaries
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_rejection();

-- Create function to update payment summary status
CREATE OR REPLACE FUNCTION update_payment_summary_status(
  p_payment_summary_id UUID,
  p_status VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
  v_recycler_id UUID;
BEGIN
  UPDATE payment_summaries 
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = p_payment_summary_id
  AND status = 'pending'; -- Only allow updates from pending status
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF v_updated THEN
    -- Get recycler_id
    SELECT recycler_id INTO v_recycler_id FROM payment_summaries WHERE id = p_payment_summary_id;
    
    -- Send notification about status change
    IF v_recycler_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        created_at
      ) VALUES (
        v_recycler_id,
        'payment_status_update',
        'Payment Status Updated',
        'Customer has ' || p_status || ' the payment summary.',
        jsonb_build_object(
          'payment_summary_id', p_payment_summary_id,
          'status', p_status
        ),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON payment_summaries TO authenticated;
GRANT USAGE ON SEQUENCE payment_summaries_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION update_payment_summary_status TO authenticated;

-- Insert sample data for testing (only if required tables have data)
DO $$
DECLARE
  sample_request_id UUID;
  sample_recycler_id UUID;
  sample_customer_id UUID;
BEGIN
  -- Check if we have data in required tables
  SELECT id INTO sample_request_id FROM pickup_requests LIMIT 1;
  SELECT id INTO sample_recycler_id FROM recyclers LIMIT 1;
  SELECT id INTO sample_customer_id FROM customers LIMIT 1;
  
  -- Only insert sample data if all required tables have data
  IF sample_request_id IS NOT NULL AND sample_recycler_id IS NOT NULL AND sample_customer_id IS NOT NULL THEN
    INSERT INTO payment_summaries (
      request_id,
      recycler_id,
      customer_id,
      weight,
      waste_type,
      rate,
      base_amount,
      environmental_tax,
      total_amount,
      status,
      notes,
      quality_rating,
      contamination_level
    ) VALUES (
      sample_request_id,
      sample_recycler_id,
      sample_customer_id,
      '8.5 kg',
      'Mixed Waste',
      '₵1.20/kg',
      10.20,
      0.51,
      10.71,
      'pending',
      'Good quality waste with minimal contamination',
      'good',
      0.05
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Sample payment summary data inserted successfully';
  ELSE
    RAISE NOTICE 'Skipping sample data insertion - required tables are empty';
  END IF;
END $$;

COMMENT ON TABLE payment_summaries IS 'Stores payment summaries sent by recyclers to customers for waste collection services';
COMMENT ON COLUMN payment_summaries.weight IS 'Weight of collected waste (e.g., "10 kg")';
COMMENT ON COLUMN payment_summaries.rate IS 'Rate per unit (e.g., "₵1.20/kg")';
COMMENT ON COLUMN payment_summaries.status IS 'Payment status: pending, accepted, rejected, paid';
COMMENT ON COLUMN payment_summaries.quality_rating IS 'Quality assessment: good, fair, poor';
COMMENT ON COLUMN payment_summaries.contamination_level IS 'Contamination level from 0.00 to 1.00';
COMMENT ON COLUMN payment_summaries.rejection_reason IS 'Detailed reason for rejection provided by customer';
COMMENT ON COLUMN payment_summaries.selected_reason IS 'Predefined reason ID selected by customer';
COMMENT ON COLUMN payment_summaries.rejected_at IS 'Timestamp when payment was rejected';
COMMENT ON COLUMN payment_summaries.rejection_acknowledged IS 'Whether recycler has acknowledged the rejection';