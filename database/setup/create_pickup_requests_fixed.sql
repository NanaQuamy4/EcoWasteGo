-- Fixed pickup_requests table creation (no PostGIS dependency)
-- Run this SQL in your Supabase SQL editor to fix the immediate error

-- Create the basic pickup_requests table
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
    
    -- Request status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')),
    
    -- Pricing
    estimated_price DECIMAL(8,2),
    final_price DECIMAL(8,2),
    
    -- Tracking
    pickup_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Feedback
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_latitude CHECK (pickup_latitude IS NULL OR (pickup_latitude >= -90 AND pickup_latitude <= 90)),
    CONSTRAINT valid_longitude CHECK (pickup_longitude IS NULL OR (pickup_longitude >= -180 AND pickup_longitude <= 180))
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_pickup_requests_customer_id ON pickup_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_recycler_id ON pickup_requests(recycler_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_coordinates ON pickup_requests(pickup_latitude, pickup_longitude);

-- Enable Row Level Security
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Customers can view own pickup requests" ON pickup_requests
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create pickup requests" ON pickup_requests
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own requests" ON pickup_requests
    FOR UPDATE USING (auth.uid() = customer_id);

-- Grant permissions
GRANT ALL ON pickup_requests TO authenticated;

-- Insert some sample data for testing
INSERT INTO pickup_requests (
    customer_id, 
    pickup_address, 
    pickup_latitude,
    pickup_longitude,
    waste_type, 
    waste_quantity, 
    status,
    estimated_price,
    final_price,
    customer_rating
) VALUES 
(
    (SELECT id FROM auth.users LIMIT 1), -- Use first user as sample
    '123 Main Street, Accra',
    5.6037, -- Accra latitude
    -0.1870, -- Accra longitude
    'plastic',
    'medium',
    'completed',
    15.00,
    15.00,
    5
),
(
    (SELECT id FROM auth.users LIMIT 1), -- Use first user as sample
    '456 Oak Avenue, Kumasi',
    6.6885, -- Kumasi latitude
    -1.6244, -- Kumasi longitude
    'paper',
    'small',
    'completed',
    8.50,
    8.50,
    4
),
(
    (SELECT id FROM auth.users LIMIT 1), -- Use first user as sample
    '789 Pine Road, Takoradi',
    4.8845, -- Takoradi latitude
    -1.7554, -- Takoradi longitude
    'metal',
    'large',
    'completed',
    25.00,
    25.00,
    5
);

COMMENT ON TABLE pickup_requests IS 'Table for managing customer pickup requests';
