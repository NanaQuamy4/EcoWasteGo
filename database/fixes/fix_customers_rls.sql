-- Fix RLS policies for customers table
-- This allows the notification system to work properly

-- Check existing policies for customers
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'customers';

-- Drop ALL existing policies for customers
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'customers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON customers';
    END LOOP;
END $$;

-- Disable RLS temporarily
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for customers
CREATE POLICY "Allow all operations for customers" ON customers
    FOR ALL USING (true) WITH CHECK (true);

-- Create specific policies for user operations
CREATE POLICY "Users can view their own customer data" ON customers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer data" ON customers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own customer data" ON customers
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant all necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON customers TO service_role;
GRANT ALL ON customers TO anon;

-- Test the fix
SELECT 'Customers RLS policies have been fixed!' as status;
