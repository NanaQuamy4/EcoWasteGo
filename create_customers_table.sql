-- Create customers table to store customer information
-- This will allow proper joins with pickup_requests

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    residential_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Customers can view own profile" ON customers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Customers can update own profile" ON customers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Customers can insert own profile" ON customers
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON customers TO authenticated;

-- Insert sample customer data (only if table is empty)
INSERT INTO customers (id, full_name, phone, email, residential_address)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', 'John Doe'),
    COALESCE(raw_user_meta_data->>'phone', '+233241234567'),
    email,
    COALESCE(raw_user_meta_data->>'residential_address', '123 Main Street, Accra')
FROM auth.users 
WHERE email LIKE '%customer%' OR email LIKE '%@%'
ON CONFLICT (id) DO NOTHING;

-- Update pickup_requests to reference customers table instead of auth.users
-- First, let's check if we need to update the foreign key
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists and points to auth.users
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'pickup_requests' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'customer_id'
        AND kcu.referenced_table_name = 'users'
        AND kcu.referenced_table_schema = 'auth'
    ) THEN
        -- Drop the existing foreign key constraint
        ALTER TABLE pickup_requests DROP CONSTRAINT IF EXISTS pickup_requests_customer_id_fkey;
        
        -- Add new foreign key constraint to customers table
        ALTER TABLE pickup_requests ADD CONSTRAINT pickup_requests_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated pickup_requests foreign key to reference customers table';
    ELSE
        RAISE NOTICE 'Foreign key constraint not found or already correct';
    END IF;
END $$;

COMMENT ON TABLE customers IS 'Customer profiles linked to auth.users';
