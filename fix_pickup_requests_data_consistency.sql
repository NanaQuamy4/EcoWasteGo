-- Fix data consistency between pickup_requests and customers tables
-- This handles the case where pickup_requests has customer_ids that don't exist in customers table

-- Step 1: Check what's in pickup_requests table
SELECT 'Current pickup_requests data:' as info;
SELECT customer_id, COUNT(*) as count 
FROM pickup_requests 
GROUP BY customer_id;

-- Step 2: Check what's in customers table
SELECT 'Current customers data:' as info;
SELECT id, full_name, email 
FROM customers 
ORDER BY created_at;

-- Step 3: Find orphaned customer_ids in pickup_requests
SELECT 'Orphaned customer_ids in pickup_requests:' as info;
SELECT DISTINCT pr.customer_id
FROM pickup_requests pr
LEFT JOIN customers c ON pr.customer_id = c.id
WHERE c.id IS NULL;

-- Step 4: Option A - Delete orphaned pickup_requests (if you want to start fresh)
-- Uncomment the following lines if you want to delete orphaned records:
/*
DELETE FROM pickup_requests 
WHERE customer_id NOT IN (SELECT id FROM customers);
*/

-- Step 5: Option B - Create missing customer records (if you want to keep the data)
-- This creates customer records for any missing customer_ids in pickup_requests
INSERT INTO customers (id, full_name, email, phone, residential_address)
SELECT DISTINCT 
    pr.customer_id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown Customer'),
    COALESCE(au.email, 'unknown@example.com'),
    COALESCE(au.raw_user_meta_data->>'phone', '+233000000000'),
    COALESCE(au.raw_user_meta_data->>'residential_address', 'Unknown Address')
FROM pickup_requests pr
LEFT JOIN customers c ON pr.customer_id = c.id
LEFT JOIN auth.users au ON pr.customer_id = au.id
WHERE c.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 6: Verify the fix
SELECT 'After fix - pickup_requests with valid customer_ids:' as info;
SELECT pr.customer_id, c.full_name, c.email, COUNT(*) as request_count
FROM pickup_requests pr
JOIN customers c ON pr.customer_id = c.id
GROUP BY pr.customer_id, c.full_name, c.email;

-- Step 7: Now we can safely add the foreign key constraint
ALTER TABLE pickup_requests DROP CONSTRAINT IF EXISTS pickup_requests_customer_id_fkey;
ALTER TABLE pickup_requests ADD CONSTRAINT pickup_requests_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Step 8: Add missing columns to pickup_requests table
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

-- Step 9: Create indexes
CREATE INDEX IF NOT EXISTS idx_pickup_requests_customer_id ON pickup_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_recycler_id ON pickup_requests(recycler_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_created_at ON pickup_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_pickup_date ON pickup_requests(preferred_pickup_date);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_coordinates ON pickup_requests(pickup_latitude, pickup_longitude);

-- Step 10: Enable Row Level Security
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

-- Step 11: Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own pickup requests" ON pickup_requests;
DROP POLICY IF EXISTS "Customers can create pickup requests" ON pickup_requests;
DROP POLICY IF EXISTS "Customers can update own requests" ON pickup_requests;
DROP POLICY IF EXISTS "Recyclers can view assigned requests" ON pickup_requests;
DROP POLICY IF EXISTS "Recyclers can update assigned requests" ON pickup_requests;

-- Step 12: Create RLS policies
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

-- Step 13: Grant permissions
GRANT ALL ON pickup_requests TO authenticated;

-- Step 14: Enable real-time for pickup_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_requests;

-- Step 15: Insert sample data if table is empty
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

-- Step 16: Add table comment
COMMENT ON TABLE pickup_requests IS 'Table for managing customer pickup requests with real-time updates';

-- Final verification
SELECT 'SUCCESS: pickup_requests table is ready with customers table integration!' as status;
