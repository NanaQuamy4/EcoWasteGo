-- Temporarily Disable RLS for Testing Login
-- WARNING: This is for testing only. Re-enable RLS in production!

-- Disable RLS on customers table
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on recyclers table  
ALTER TABLE public.recyclers DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('customers', 'recyclers');

-- To re-enable RLS later, run:
-- ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.recyclers ENABLE ROW LEVEL SECURITY;
