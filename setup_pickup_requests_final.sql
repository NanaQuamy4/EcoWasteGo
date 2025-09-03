-- Final setup for pickup_requests table with proper structure
-- Run this in your Supabase SQL Editor

-- Create the pickup_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS pickup_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE SET NULL,
    
    -- Basic pickup details
    pickup_address TEXT NOT NULL,
    pickup_latitude DECIMAL(10, 8), -- Latitude coordinate
    pickup_longitude DECIMAL(11, 8), -- Longitude coordinate
    pickup_notes TEXT,
    
    -- Waste details
    waste_type VARCHAR(50) DEFAULT 'general',
    waste_quantity VARCHAR(20) DEFAULT 'small',
    estimated_weight DECIMAL(5,2), -- in kg
    
    -- Request status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')),
    
    -- Scheduling
    preferred_pickup_date DATE,
    preferred_pickup_time TIME,
    
    -- Pricing
    estimated_price DECIMAL(8,2),
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
    CONSTRAINT valid_latitude CHECK (pickup_latitude IS NULL OR (pickup_latitude >= -90 AND pickup_latitude <= 90)),
    CONSTRAINT valid_longitude CHECK (pickup_longitude IS NULL OR (pickup_longitude >= -180 AND pickup_longitude <= 180))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pickup_requests_customer_id ON pickup_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_recycler_id ON pickup_requests(recycler_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_created_at ON pickup_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_pickup_date ON pickup_requests(preferred_pickup_date);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_coordinates ON pickup_requests(pickup_latitude, pickup_longitude);

-- Enable Row Level Security
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own pickup requests" ON pickup_requests;
DROP POLICY IF EXISTS "Customers can create pickup requests" ON pickup_requests;
DROP POLICY IF EXISTS "Customers can update own requests" ON pickup_requests;
DROP POLICY IF EXISTS "Recyclers can view assigned requests" ON pickup_requests;
DROP POLICY IF EXISTS "Recyclers can update assigned requests" ON pickup_requests;

-- Create RLS policies
CREATE POLICY "Customers can view own pickup requests" ON pickup_requests
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create pickup requests" ON pickup_requests
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own requests" ON pickup_requests
    FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Recyclers can view assigned requests" ON pickup_requests
    FOR SELECT USING (auth.uid() = recycler_id OR status = 'pending');

CREATE POLICY "Recyclers can update assigned requests" ON pickup_requests
    FOR UPDATE USING (auth.uid() = recycler_id OR (status = 'pending' AND auth.uid() IN (SELECT id FROM recyclers WHERE id = auth.uid())));

-- Grant permissions
GRANT ALL ON pickup_requests TO authenticated;

-- Enable real-time for pickup_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_requests;

-- Insert some sample data for testing (only if table is empty)
INSERT INTO pickup_requests (
    customer_id, 
    pickup_address, 
    pickup_latitude,
    pickup_longitude,
    waste_type, 
    waste_quantity, 
    status,
    estimated_price,
    estimated_weight
) 
SELECT 
    (SELECT id FROM auth.users WHERE email LIKE '%customer%' LIMIT 1), -- Use a customer user
    '123 Main Street, Accra Central',
    5.6037, -- Accra latitude
    -0.1870, -- Accra longitude
    'plastic',
    'medium',
    'pending',
    15.00,
    5.5
WHERE NOT EXISTS (SELECT 1 FROM pickup_requests LIMIT 1);

COMMENT ON TABLE pickup_requests IS 'Table for managing customer pickup requests with real-time updates';
