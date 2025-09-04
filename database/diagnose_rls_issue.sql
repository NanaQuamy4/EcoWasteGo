-- Diagnose RLS Recursion Issue
-- This script helps identify what's causing the infinite recursion

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = t.schemaname) as policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN ('recyclers', 'customers', 'recycler_verifications', 'admin_users', 'notifications')
ORDER BY tablename;

-- Check all existing policies
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
WHERE schemaname = 'public' 
AND tablename IN ('recyclers', 'customers', 'recycler_verifications', 'admin_users', 'notifications')
ORDER BY tablename, policyname;

-- Check for functions that might be causing recursion
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('get_user_role', 'is_admin_user', 'get_recycler_verifications', 'handle_new_user')
ORDER BY p.proname;

-- Check for views that might reference these tables
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
AND definition LIKE '%recyclers%'
ORDER BY viewname;

-- Check for triggers on these tables
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('recyclers', 'customers', 'recycler_verifications', 'admin_users', 'notifications')
AND t.tgisinternal = false
ORDER BY c.relname, t.tgname;
