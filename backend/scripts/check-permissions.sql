-- Check Database Permissions and Roles
-- Run this in Supabase SQL Editor

-- 1. Check current user and role
SELECT current_user, current_database();

-- 2. Check if we can access the users table
SELECT * FROM users LIMIT 1;

-- 3. Check table permissions
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'users';

-- 4. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 5. Check user permissions
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users';

-- 6. Check if service role exists
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles 
WHERE rolname LIKE '%service%' OR rolname LIKE '%anon%'; 