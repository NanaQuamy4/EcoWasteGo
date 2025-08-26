-- Simple Admin Permissions for Login Endpoint
-- This script grants basic permissions to the service role to access users during login

-- Grant SELECT permission to service role on customers table
GRANT SELECT ON TABLE public.customers TO service_role;

-- Grant SELECT permission to service role on recyclers table  
GRANT SELECT ON TABLE public.recyclers TO service_role;

-- Verify permissions were granted
SELECT 
    schemaname,
    tablename,
    tableowner,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('customers', 'recyclers');

-- Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('customers', 'recyclers');
