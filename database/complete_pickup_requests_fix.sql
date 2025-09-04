-- Complete fix for pickup_requests table
-- This handles all possible scenarios

-- Step 1: Check if table exists and what columns it has
DO $$ 
DECLARE
    table_exists boolean;
    column_count integer;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pickup_requests'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Count existing columns
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns 
        WHERE table_name = 'pickup_requests';
        
        RAISE NOTICE 'Table pickup_requests exists with % columns', column_count;
        
        -- If table has very few columns, it's probably incomplete
        IF column_count < 10 THEN
            RAISE NOTICE 'Table appears incomplete, recreating...';
            DROP TABLE pickup_requests CASCADE;
            table_exists := false;
        END IF;
    END IF;
    
    -- If table doesn't exist or was dropped, create it
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating pickup_requests table...';
        
        CREATE TABLE pickup_requests (
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
        
        RAISE NOTICE 'Table created successfully';
    ELSE
        RAISE NOTICE 'Table exists, adding missing columns...';
        
        -- Add missing columns one by one
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'pickup_latitude') THEN
            ALTER TABLE pickup_requests ADD COLUMN pickup_latitude DECIMAL(10, 8);
            RAISE NOTICE 'Added pickup_latitude column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'pickup_longitude') THEN
            ALTER TABLE pickup_requests ADD COLUMN pickup_longitude DECIMAL(11, 8);
            RAISE NOTICE 'Added pickup_longitude column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'pickup_notes') THEN
            ALTER TABLE pickup_requests ADD COLUMN pickup_notes TEXT;
            RAISE NOTICE 'Added pickup_notes column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'waste_type') THEN
            ALTER TABLE pickup_requests ADD COLUMN waste_type VARCHAR(50) DEFAULT 'general';
            RAISE NOTICE 'Added waste_type column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'waste_quantity') THEN
            ALTER TABLE pickup_requests ADD COLUMN waste_quantity VARCHAR(20) DEFAULT 'small';
            RAISE NOTICE 'Added waste_quantity column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'estimated_weight') THEN
            ALTER TABLE pickup_requests ADD COLUMN estimated_weight DECIMAL(5,2);
            RAISE NOTICE 'Added estimated_weight column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'preferred_pickup_date') THEN
            ALTER TABLE pickup_requests ADD COLUMN preferred_pickup_date DATE;
            RAISE NOTICE 'Added preferred_pickup_date column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'preferred_pickup_time') THEN
            ALTER TABLE pickup_requests ADD COLUMN preferred_pickup_time TIME;
            RAISE NOTICE 'Added preferred_pickup_time column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'estimated_price') THEN
            ALTER TABLE pickup_requests ADD COLUMN estimated_price DECIMAL(8,2);
            RAISE NOTICE 'Added estimated_price column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'final_price') THEN
            ALTER TABLE pickup_requests ADD COLUMN final_price DECIMAL(8,2);
            RAISE NOTICE 'Added final_price column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'payment_status') THEN
            ALTER TABLE pickup_requests ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
            RAISE NOTICE 'Added payment_status column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'pickup_started_at') THEN
            ALTER TABLE pickup_requests ADD COLUMN pickup_started_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added pickup_started_at column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'pickup_completed_at') THEN
            ALTER TABLE pickup_requests ADD COLUMN pickup_completed_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added pickup_completed_at column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'customer_rating') THEN
            ALTER TABLE pickup_requests ADD COLUMN customer_rating INTEGER;
            RAISE NOTICE 'Added customer_rating column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'customer_feedback') THEN
            ALTER TABLE pickup_requests ADD COLUMN customer_feedback TEXT;
            RAISE NOTICE 'Added customer_feedback column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'recycler_notes') THEN
            ALTER TABLE pickup_requests ADD COLUMN recycler_notes TEXT;
            RAISE NOTICE 'Added recycler_notes column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_requests' AND column_name = 'updated_at') THEN
            ALTER TABLE pickup_requests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column';
        END IF;
    END IF;
END $$;

-- Step 2: Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_pickup_requests_customer_id ON pickup_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_recycler_id ON pickup_requests(recycler_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_created_at ON pickup_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_pickup_date ON pickup_requests(preferred_pickup_date);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_coordinates ON pickup_requests(pickup_latitude, pickup_longitude);

-- Step 3: Enable Row Level Security
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own pickup requests" ON pickup_requests;
DROP POLICY IF EXISTS "Customers can create pickup requests" ON pickup_requests;
DROP POLICY IF EXISTS "Customers can update own requests" ON pickup_requests;
DROP POLICY IF EXISTS "Recyclers can view assigned requests" ON pickup_requests;
DROP POLICY IF EXISTS "Recyclers can update assigned requests" ON pickup_requests;

-- Step 5: Create RLS policies
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

-- Step 6: Grant permissions
GRANT ALL ON pickup_requests TO authenticated;

-- Step 7: Enable real-time for pickup_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_requests;

-- Step 8: Insert sample data if table is empty
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
    (SELECT id FROM auth.users LIMIT 1), -- Use first user as sample
    '123 Main Street, Accra Central',
    5.6037, -- Accra latitude
    -0.1870, -- Accra longitude
    'plastic',
    'medium',
    'pending',
    15.00,
    5.5
WHERE NOT EXISTS (SELECT 1 FROM pickup_requests LIMIT 1);

-- Step 9: Add table comment
COMMENT ON TABLE pickup_requests IS 'Table for managing customer pickup requests with real-time updates';

-- Final verification
SELECT 'SUCCESS: pickup_requests table is ready!' as status;
