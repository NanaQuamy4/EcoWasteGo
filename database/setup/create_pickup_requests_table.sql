-- Create pickup_requests table for handling customer pickup requests
-- Run this SQL in your Supabase SQL editor

-- 1. Create pickup_requests table
CREATE TABLE IF NOT EXISTS pickup_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE SET NULL,
    
    -- Pickup details
    pickup_address TEXT NOT NULL,
    pickup_latitude DECIMAL(10, 8), -- Latitude coordinate
    pickup_longitude DECIMAL(11, 8), -- Longitude coordinate
    pickup_notes TEXT,
    
    -- Waste details
    waste_type VARCHAR(50) DEFAULT 'general' CHECK (waste_type IN ('general', 'plastic', 'paper', 'metal', 'glass', 'organic', 'electronic')),
    waste_quantity VARCHAR(20) DEFAULT 'small' CHECK (waste_quantity IN ('small', 'medium', 'large')),
    estimated_weight DECIMAL(5,2), -- in kg
    
    -- Request status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')),
    
    -- Scheduling
    preferred_pickup_date DATE,
    preferred_pickup_time TIME,
    
    -- Pricing
    estimated_price DECIMAL(8,2), -- in local currency
    final_price DECIMAL(8,2),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Tracking
    pickup_started_at TIMESTAMP WITH TIME ZONE,
    pickup_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Feedback
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    recycler_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_pickup_date CHECK (preferred_pickup_date >= CURRENT_DATE),
    CONSTRAINT valid_latitude CHECK (pickup_latitude IS NULL OR (pickup_latitude >= -90 AND pickup_latitude <= 90)),
    CONSTRAINT valid_longitude CHECK (pickup_longitude IS NULL OR (pickup_longitude >= -180 AND pickup_longitude <= 180))
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pickup_requests_customer_id ON pickup_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_recycler_id ON pickup_requests(recycler_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_created_at ON pickup_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_pickup_requests_pickup_date ON pickup_requests(preferred_pickup_date);

-- 3. Create pickup_request_history table for audit trail
CREATE TABLE IF NOT EXISTS pickup_request_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pickup_request_id UUID REFERENCES pickup_requests(id) ON DELETE CASCADE,
    status_before VARCHAR(20),
    status_after VARCHAR(20),
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for history table
CREATE INDEX IF NOT EXISTS idx_pickup_request_history_request_id ON pickup_request_history(pickup_request_id);
CREATE INDEX IF NOT EXISTS idx_pickup_request_history_created_at ON pickup_request_history(created_at);

-- 5. Enable Row Level Security
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_request_history ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for pickup_requests
-- Customers can view their own requests
CREATE POLICY "Customers can view own pickup requests" ON pickup_requests
    FOR SELECT USING (auth.uid() = customer_id);

-- Customers can create pickup requests
CREATE POLICY "Customers can create pickup requests" ON pickup_requests
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own pending requests
CREATE POLICY "Customers can update own pending requests" ON pickup_requests
    FOR UPDATE USING (
        auth.uid() = customer_id AND 
        status IN ('pending', 'accepted')
    );

-- Recyclers can view requests assigned to them
CREATE POLICY "Recyclers can view assigned requests" ON pickup_requests
    FOR SELECT USING (
        recycler_id = auth.uid() OR 
        (recycler_id IS NULL AND status = 'pending')
    );

-- Recyclers can update requests assigned to them
CREATE POLICY "Recyclers can update assigned requests" ON pickup_requests
    FOR UPDATE USING (
        recycler_id = auth.uid() AND 
        status IN ('accepted', 'in_progress', 'completed')
    );

-- 7. Create RLS policies for pickup_request_history
CREATE POLICY "Users can view related request history" ON pickup_request_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pickup_requests 
            WHERE id = pickup_request_history.pickup_request_id 
            AND (customer_id = auth.uid() OR recycler_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert request history" ON pickup_request_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pickup_requests 
            WHERE id = pickup_request_history.pickup_request_id 
            AND (customer_id = auth.uid() OR recycler_id = auth.uid())
        )
    );

-- 8. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pickup_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for updated_at
CREATE TRIGGER update_pickup_requests_updated_at
    BEFORE UPDATE ON pickup_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_request_updated_at();

-- 10. Create function to log status changes
CREATE OR REPLACE FUNCTION log_pickup_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO pickup_request_history (
            pickup_request_id, 
            status_before, 
            status_after, 
            changed_by,
            change_reason
        ) VALUES (
            NEW.id, 
            OLD.status, 
            NEW.status, 
            auth.uid(),
            'Status updated'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for status change logging
CREATE TRIGGER log_pickup_request_status_change_trigger
    AFTER UPDATE ON pickup_requests
    FOR EACH ROW
    EXECUTE FUNCTION log_pickup_request_status_change();

-- 12. Create function to get pickup request statistics
CREATE OR REPLACE FUNCTION get_pickup_request_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_requests', COUNT(*),
        'completed_requests', COUNT(*) FILTER (WHERE status = 'completed'),
        'pending_requests', COUNT(*) FILTER (WHERE status = 'pending'),
        'in_progress_requests', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'cancelled_requests', COUNT(*) FILTER (WHERE status = 'cancelled'),
        'average_rating', ROUND(AVG(customer_rating), 2),
        'total_earnings', COALESCE(SUM(final_price) FILTER (WHERE status = 'completed'), 0)
    ) INTO result
    FROM pickup_requests
    WHERE customer_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 13. Create function to get recycler pickup statistics
CREATE OR REPLACE FUNCTION get_recycler_pickup_stats(recycler_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_pickups', COUNT(*),
        'completed_pickups', COUNT(*) FILTER (WHERE status = 'completed'),
        'pending_pickups', COUNT(*) FILTER (WHERE status = 'pending'),
        'in_progress_pickups', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'average_rating', ROUND(AVG(customer_rating), 2),
        'total_earnings', COALESCE(SUM(final_price) FILTER (WHERE status = 'completed'), 0),
        'completion_rate', ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
             NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'in_progress', 'completed')), 0)) * 100, 2
        )
    ) INTO result
    FROM pickup_requests
    WHERE recycler_id = recycler_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 14. Grant permissions
GRANT ALL ON pickup_requests TO authenticated;
GRANT ALL ON pickup_request_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_pickup_request_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_pickup_stats(UUID) TO authenticated;

-- 15. Create view for pickup request dashboard
CREATE OR REPLACE VIEW pickup_requests_dashboard AS
SELECT 
    pr.id,
    pr.customer_id,
    pr.recycler_id,
    pr.pickup_address,
    pr.waste_type,
    pr.waste_quantity,
    pr.status,
    pr.preferred_pickup_date,
    pr.estimated_price,
    pr.final_price,
    pr.customer_rating,
    pr.created_at,
    pr.updated_at,
    -- Customer info
    cu.email as customer_email,
    -- Recycler info
    r.full_name as recycler_name,
    r.phone as recycler_phone,
    -- Status info
    CASE 
        WHEN pr.status = 'pending' THEN 'Waiting for recycler'
        WHEN pr.status = 'accepted' THEN 'Accepted by recycler'
        WHEN pr.status = 'in_progress' THEN 'Pickup in progress'
        WHEN pr.status = 'completed' THEN 'Completed'
        WHEN pr.status = 'cancelled' THEN 'Cancelled'
        WHEN pr.status = 'rejected' THEN 'Rejected'
        ELSE 'Unknown'
    END as status_description
FROM pickup_requests pr
LEFT JOIN auth.users cu ON pr.customer_id = cu.id
LEFT JOIN recyclers r ON pr.recycler_id = r.id;

-- Grant permissions on view
GRANT SELECT ON pickup_requests_dashboard TO authenticated;

-- 16. Insert some sample data (optional - remove in production)
-- INSERT INTO pickup_requests (
--     customer_id, 
--     pickup_address, 
--     waste_type, 
--     waste_quantity, 
--     status,
--     preferred_pickup_date
-- ) VALUES (
--     'your-customer-id-here',
--     '123 Main Street, Accra',
--     'plastic',
--     'medium',
--     'completed',
--     CURRENT_DATE + INTERVAL '1 day'
-- );

COMMENT ON TABLE pickup_requests IS 'Table for managing customer pickup requests';
COMMENT ON TABLE pickup_request_history IS 'Audit trail for pickup request status changes';
COMMENT ON FUNCTION get_pickup_request_stats(UUID) IS 'Get pickup request statistics for a customer';
COMMENT ON FUNCTION get_recycler_pickup_stats(UUID) IS 'Get pickup statistics for a recycler';
