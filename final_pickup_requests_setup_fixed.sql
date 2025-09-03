-- Final setup for pickup_requests table to work with existing customers table
-- This ensures all required columns exist and proper relationships are set up

-- Step 1: Add missing columns to pickup_requests table
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
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
END $$;

-- Step 2: Ensure proper foreign key relationship with customers table
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists and points to customers table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'pickup_requests' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'customer_id'
        AND kcu.referenced_table_name = 'customers'
    ) THEN
        -- Drop any existing foreign key constraint to auth.users
        ALTER TABLE pickup_requests DROP CONSTRAINT IF EXISTS pickup_requests_customer_id_fkey;
        
        -- Add new foreign key constraint to customers table
        ALTER TABLE pickup_requests ADD CONSTRAINT pickup_requests_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated pickup_requests foreign key to reference customers table';
    ELSE
        RAISE NOTICE 'Foreign key constraint already points to customers table';
    END IF;
END $$;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_pickup_requests_customer_id ON pickup_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_recycler_id ON pickup_requests(recycler_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_created_at ON pickup_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_pickup_date ON pickup_requests(preferred_pickup_date);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_coordinates ON pickup_requests(pickup_latitude, pickup_longitude);

-- Step 4: Enable Row Level Security
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own pickup requests" ON pickup_requests;
DROP POLICY IF EXISTS "Customers can create pickup requests" ON pickup_requests;
DROP POLICY IF EXISTS "Customers can update own requests" ON pickup_requests;
DROP POLICY IF EXISTS "Recyclers can view assigned requests" ON pickup_requests;
DROP POLICY IF EXISTS "Recyclers can update assigned requests" ON pickup_requests;

-- Step 6: Create RLS policies
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

-- Step 7: Grant permissions
GRANT ALL ON pickup_requests TO authenticated;

-- Step 8: Enable real-time for pickup_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_requests;

-- Step 9: Insert sample data if table is empty
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
    (SELECT id FROM customers LIMIT 1), -- Use first customer as sample
    '123 Main Street, Accra Central',
    5.6037, -- Accra latitude
    -0.1870, -- Accra longitude
    'plastic',
    'medium',
    'pending',
    15.00,
    5.5
WHERE NOT EXISTS (SELECT 1 FROM pickup_requests LIMIT 1);

-- Step 10: Add table comment
COMMENT ON TABLE pickup_requests IS 'Table for managing customer pickup requests with real-time updates';

-- Final verification
SELECT 'SUCCESS: pickup_requests table is ready with customers table integration!' as status;
