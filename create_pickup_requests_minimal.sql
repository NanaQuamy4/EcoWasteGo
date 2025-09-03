-- Minimal pickup_requests table creation (guaranteed to work)
-- Run this SQL in your Supabase SQL editor to fix the immediate error

-- Drop the table if it exists to start fresh
DROP TABLE IF EXISTS pickup_requests CASCADE;

-- Create the minimal pickup_requests table
CREATE TABLE pickup_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recycler_id UUID REFERENCES recyclers(id) ON DELETE SET NULL,
    
    -- Basic pickup details
    pickup_address TEXT NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX idx_pickup_requests_customer_id ON pickup_requests(customer_id);
CREATE INDEX idx_pickup_requests_recycler_id ON pickup_requests(recycler_id);
CREATE INDEX idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX idx_pickup_requests_created_at ON pickup_requests(created_at);

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
    'metal',
    'large',
    'completed',
    25.00,
    25.00,
    5
);

COMMENT ON TABLE pickup_requests IS 'Table for managing customer pickup requests';
