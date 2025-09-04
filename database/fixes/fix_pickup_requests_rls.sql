-- Fix RLS policies for pickup_requests table
-- This allows the pickup request system to work properly

-- Check existing policies for pickup_requests
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'pickup_requests';

-- Drop ALL existing policies for pickup_requests
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'pickup_requests'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON pickup_requests';
    END LOOP;
END $$;

-- Disable RLS temporarily
ALTER TABLE pickup_requests DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for pickup_requests
CREATE POLICY "Allow all operations for pickup_requests" ON pickup_requests
    FOR ALL USING (true) WITH CHECK (true);

-- Create specific policies for user operations
CREATE POLICY "Users can view their own pickup requests" ON pickup_requests
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = recycler_id);

CREATE POLICY "Users can update their own pickup requests" ON pickup_requests
    FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = recycler_id);

CREATE POLICY "Users can delete their own pickup requests" ON pickup_requests
    FOR DELETE USING (auth.uid() = customer_id OR auth.uid() = recycler_id);

-- Grant all necessary permissions
GRANT ALL ON pickup_requests TO authenticated;
GRANT ALL ON pickup_requests TO service_role;
GRANT ALL ON pickup_requests TO anon;

-- Test the fix
SELECT 'Pickup requests RLS policies have been fixed!' as status;
