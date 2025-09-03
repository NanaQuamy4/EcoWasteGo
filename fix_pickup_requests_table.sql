-- Fix pickup_requests table structure
-- This script will check and fix any missing columns

-- First, let's check what columns exist and add missing ones
DO $$ 
BEGIN
    -- Add preferred_pickup_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'preferred_pickup_date') THEN
        ALTER TABLE pickup_requests ADD COLUMN preferred_pickup_date DATE;
    END IF;
    
    -- Add preferred_pickup_time if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'preferred_pickup_time') THEN
        ALTER TABLE pickup_requests ADD COLUMN preferred_pickup_time TIME;
    END IF;
    
    -- Add estimated_price if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'estimated_price') THEN
        ALTER TABLE pickup_requests ADD COLUMN estimated_price DECIMAL(8,2);
    END IF;
    
    -- Add final_price if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'final_price') THEN
        ALTER TABLE pickup_requests ADD COLUMN final_price DECIMAL(8,2);
    END IF;
    
    -- Add payment_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'payment_status') THEN
        ALTER TABLE pickup_requests ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
    END IF;
    
    -- Add pickup_started_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'pickup_started_at') THEN
        ALTER TABLE pickup_requests ADD COLUMN pickup_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add pickup_completed_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'pickup_completed_at') THEN
        ALTER TABLE pickup_requests ADD COLUMN pickup_completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add customer_rating if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'customer_rating') THEN
        ALTER TABLE pickup_requests ADD COLUMN customer_rating INTEGER 
        CHECK (customer_rating >= 1 AND customer_rating <= 5);
    END IF;
    
    -- Add customer_feedback if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'customer_feedback') THEN
        ALTER TABLE pickup_requests ADD COLUMN customer_feedback TEXT;
    END IF;
    
    -- Add recycler_notes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'recycler_notes') THEN
        ALTER TABLE pickup_requests ADD COLUMN recycler_notes TEXT;
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pickup_requests' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE pickup_requests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
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
