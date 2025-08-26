-- Fix Admin Permissions for Login Endpoint
-- This script grants the necessary permissions to the service role (admin) to access users during login

-- 1. Grant all permissions to service role on customers table
GRANT ALL PRIVILEGES ON TABLE public.customers TO service_role;

-- 2. Grant all permissions to service role on recyclers table  
GRANT ALL PRIVILEGES ON TABLE public.recyclers TO service_role;

-- 3. Ensure service role can bypass RLS policies
ALTER TABLE public.customers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.recyclers FORCE ROW LEVEL SECURITY;

-- 4. Create or update RLS policies to allow service role access
-- Customers table policy
DROP POLICY IF EXISTS "Service role can access all customers" ON public.customers;
CREATE POLICY "Service role can access all customers" ON public.customers
    FOR ALL USING (auth.role() = 'service_role');

-- Recyclers table policy  
DROP POLICY IF EXISTS "Service role can access all recyclers" ON public.recyclers;
CREATE POLICY "Service role can access all recyclers" ON public.recyclers
    FOR ALL USING (auth.role() = 'service_role');

-- 5. Alternative: Disable RLS temporarily for testing (remove this in production)
-- ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.recyclers DISABLE ROW LEVEL SECURITY;

-- 6. Verify permissions
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('customers', 'recyclers');

-- 7. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('customers', 'recyclers');
