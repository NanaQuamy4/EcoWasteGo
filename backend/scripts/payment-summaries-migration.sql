-- Payment Summaries Migration for EcoWasteGo
-- This script creates the payment_summaries table for payment calculation and management

-- Create payment_summaries table
CREATE TABLE IF NOT EXISTS payment_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES waste_collections(id) ON DELETE CASCADE,
    recycler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(8,2) NOT NULL,
    waste_type VARCHAR(50) NOT NULL,
    rate DECIMAL(8,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    environmental_tax DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    rejection_reason TEXT,
    rejected_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_summaries_request_id ON payment_summaries(request_id);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_recycler_id ON payment_summaries(recycler_id);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_status ON payment_summaries(status);
CREATE INDEX IF NOT EXISTS idx_payment_summaries_created_at ON payment_summaries(created_at);

-- Create composite index for request_id and status (for status queries)
CREATE INDEX IF NOT EXISTS idx_payment_summaries_request_status ON payment_summaries(request_id, status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_summaries_updated_at 
    BEFORE UPDATE ON payment_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_payment_summaries_updated_at();

-- Add payment_summary_id column to waste_collections table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'waste_collections' 
                   AND column_name = 'payment_summary_id') THEN
        ALTER TABLE waste_collections ADD COLUMN payment_summary_id UUID REFERENCES payment_summaries(id);
    END IF;
END $$;

-- Create index for payment_summary_id in waste_collections
CREATE INDEX IF NOT EXISTS idx_waste_collections_payment_summary_id ON waste_collections(payment_summary_id);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create trigger to update notifications updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_notifications_updated_at();

-- Create view for payment summary status
CREATE OR REPLACE VIEW payment_summary_status AS
SELECT 
    ps.id,
    ps.request_id,
    ps.recycler_id,
    ps.status,
    ps.total_amount,
    ps.created_at,
    ps.updated_at,
    wc.customer_id,
    wc.pickup_address,
    wc.waste_type as original_waste_type,
    wc.weight as original_weight
FROM payment_summaries ps
JOIN waste_collections wc ON ps.request_id = wc.id;

-- Create view for rejected payment summaries
CREATE OR REPLACE VIEW rejected_payment_summaries AS
SELECT 
    ps.*,
    wc.customer_id,
    wc.pickup_address,
    wc.waste_type as original_waste_type,
    wc.weight as original_weight,
    u.username as recycler_name
FROM payment_summaries ps
JOIN waste_collections wc ON ps.request_id = wc.id
JOIN users u ON ps.recycler_id = u.id
WHERE ps.status = 'rejected';

-- Insert sample payment summary data (optional)
INSERT INTO payment_summaries (request_id, recycler_id, weight, waste_type, rate, subtotal, environmental_tax, total_amount) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 8.5, 'Plastic', 1.20, 10.20, 0.51, 10.71),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 12.0, 'Paper', 1.00, 12.00, 0.60, 12.60)
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust based on your Supabase setup)
-- GRANT ALL ON payment_summaries TO authenticated;
-- GRANT ALL ON notifications TO authenticated;
-- GRANT ALL ON payment_summary_status TO authenticated;
-- GRANT ALL ON rejected_payment_summaries TO authenticated;

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE payment_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_summaries
CREATE POLICY "Users can view payment summaries for their requests" ON payment_summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = request_id 
            AND (customer_id = auth.uid() OR recycler_id = auth.uid())
        )
    );

CREATE POLICY "Recyclers can create payment summaries for their requests" ON payment_summaries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = request_id 
            AND recycler_id = auth.uid()
        )
    );

CREATE POLICY "Recyclers can update their own payment summaries" ON payment_summaries
    FOR UPDATE USING (recycler_id = auth.uid());

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Create function to get payment summary with customer details
CREATE OR REPLACE FUNCTION get_payment_summary_with_customer(payment_summary_uuid UUID)
RETURNS TABLE (
    id UUID,
    request_id UUID,
    recycler_id UUID,
    weight DECIMAL,
    waste_type VARCHAR,
    rate DECIMAL,
    subtotal DECIMAL,
    environmental_tax DECIMAL,
    total_amount DECIMAL,
    status VARCHAR,
    customer_name VARCHAR,
    pickup_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps.request_id,
        ps.recycler_id,
        ps.weight,
        ps.waste_type,
        ps.rate,
        ps.subtotal,
        ps.environmental_tax,
        ps.total_amount,
        ps.status,
        u.username as customer_name,
        wc.pickup_address,
        ps.created_at
    FROM payment_summaries ps
    JOIN waste_collections wc ON ps.request_id = wc.id
    JOIN users u ON wc.customer_id = u.id
    WHERE ps.id = payment_summary_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
-- GRANT EXECUTE ON FUNCTION get_payment_summary_with_customer(UUID) TO authenticated;

COMMENT ON TABLE payment_summaries IS 'Stores payment summaries for waste collection requests';
COMMENT ON COLUMN payment_summaries.request_id IS 'Reference to the waste collection request';
COMMENT ON COLUMN payment_summaries.recycler_id IS 'ID of the recycler who created the summary';
COMMENT ON COLUMN payment_summaries.weight IS 'Weight of waste in kg';
COMMENT ON COLUMN payment_summaries.waste_type IS 'Type of waste collected';
COMMENT ON COLUMN payment_summaries.rate IS 'Rate per kg in GHS';
COMMENT ON COLUMN payment_summaries.subtotal IS 'Base amount before tax';
COMMENT ON COLUMN payment_summaries.environmental_tax IS 'Environmental tax amount';
COMMENT ON COLUMN payment_summaries.total_amount IS 'Total amount including tax';
COMMENT ON COLUMN payment_summaries.status IS 'Status: pending, accepted, or rejected';
COMMENT ON COLUMN payment_summaries.rejection_reason IS 'Reason for rejection if applicable';
